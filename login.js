
import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    // SHOW / HIDE PASSWORD
    document.querySelectorAll(".password-eye").forEach(button => {

        button.addEventListener("click", () => {

            const target = document.getElementById(
                button.dataset.target
            );

            const icon = button.querySelector("i");

            if (target.type === "password") {

                target.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");

            } else {

                target.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");

            }

        });

    });


    // ADMIN LOGIN
    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const button = document.getElementById("loginButton");

        if (!email || !password) {

            alert("Please enter your email and password.");
            return;

        }

        button.disabled = true;
        button.innerHTML = "Logging in...";

        try {

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {

                alert("Login failed: " + error.message);
                return;

            }

            // VERIFY ADMIN ACCOUNT
            const { data: admin, error: adminError } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", data.user.id)
                .maybeSingle();

            if (adminError || !admin) {

                await supabase.auth.signOut();

                alert("This account is not registered as an administrator.");
                return;

            }

            alert("Login successful!");

            window.location.replace("admin-dashboard.html");

        } catch (error) {

            console.error("Login error:", error);

            alert("Something went wrong: " + error.message);

        } finally {

            button.disabled = false;

            button.innerHTML =
                'Sign In <i class="fa-solid fa-arrow-right"></i>';

        }

    });


});
