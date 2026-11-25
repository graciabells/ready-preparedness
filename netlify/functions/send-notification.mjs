
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const webpush = require("web-push");

export default async (request) => {
    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
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

        const authHeader = request.headers.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
        }

        const token = authHeader.slice(7);

        const authClient = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        const { data: userData, error: authError } =
            await authClient.auth.getUser(token);

        if (authError || !userData.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const adminClient = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: admin, error: adminError } = await adminClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userData.user.id)
            .maybeSingle();

        if (adminError || !admin) {
            return new Response("Forbidden", { status: 403 });
        }

        const { title, body, url } = await request.json();

        if (
            typeof title !== "string" ||
            typeof body !== "string" ||
            !title.trim() ||
            !body.trim()
        ) {
            return new Response("Invalid notification data", {
                status: 400
            });
        }

        webpush.setVapidDetails(
            VAPID_SUBJECT,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );

        const { data: subscriptions, error } = await adminClient
            .from("push_subscriptions")
            .select("id, endpoint, p256dh, auth");

        if (error) throw error;

        const payload = JSON.stringify({
            title,
            body,
            url: typeof url === "string" ? url : "./residents.html"
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
                await webpush.sendNotification(subscription, payload);
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

        return Response.json({
            success: true,
            sent
        });

    } catch (error) {
        console.error("Push notification error:", error);

        return Response.json(
            { error: "Unable to send notifications." },
            { status: 500 }
        );
    }
};
