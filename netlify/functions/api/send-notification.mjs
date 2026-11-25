
import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
    }

    try {
        const {
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY,
            VAPID_SUBJECT
        } = process.env;

        if (
            !SUPABASE_URL ||
            !SUPABASE_ANON_KEY ||
            !SUPABASE_SERVICE_ROLE_KEY ||
            !VAPID_PUBLIC_KEY ||
            !VAPID_PRIVATE_KEY ||
            !VAPID_SUBJECT
        ) {
            throw new Error("Missing server environment variables.");
        }

        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).send("Unauthorized");
        }

        const token = authHeader.slice(7);

        const authClient = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        const { data: userData, error: authError } =
            await authClient.auth.getUser(token);

        if (authError || !userData.user) {
            return res.status(401).send("Unauthorized");
        }

        const adminClient = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: admin, error: adminError } =
            await adminClient
                .from("admin_users")
                .select("user_id")
                .eq("user_id", userData.user.id)
                .maybeSingle();

        if (adminError || !admin) {
            return res.status(403).send("Forbidden");
        }

        const { title, body, url } = req.body || {};

        if (
            typeof title !== "string" ||
            typeof body !== "string" ||
            !title.trim() ||
            !body.trim()
        ) {
            return res.status(400).json({
                error: "Invalid notification data"
            });
        }

        webpush.setVapidDetails(
            VAPID_SUBJECT,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );

        const { data: subscriptions, error } =
            await adminClient
                .from("push_subscriptions")
                .select("id, endpoint, p256dh, auth");

        if (error) throw error;

        const payload = JSON.stringify({
            title,
            body,
            url: typeof url === "string"
                ? url
                : "/residents.html"
        });

        let sent = 0;

        for (const item of subscriptions || []) {
            const subscription = {
                endpoint: item.endpoint,
                keys: {
                    p256dh: item.p256dh,
                    auth: item.auth
                }
            };

            try {
                await webpush.sendNotification(
                    subscription,
                    payload
                );

                sent++;

            } catch (pushError) {
                if (
                    pushError.statusCode === 404 ||
                    pushError.statusCode === 410
                ) {
                    await adminClient
                        .from("push_subscriptions")
                        .delete()
                        .eq("id", item.id);
                }
            }
        }

        return res.status(200).json({
            success: true,
            sent
        });

    } catch (error) {
        console.error("Push notification error:", error);

        return res.status(500).json({
            error: "Unable to send notifications."
        });
    }
}
