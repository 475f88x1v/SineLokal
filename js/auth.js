(function () {
    const client = () => window.sineLokalSupabase;
    const $ = s => document.querySelector(s);

    const message = (text, error = false) => {
        const el = $("#authMessage");

        if (el) {
            el.textContent = text;
            el.classList.toggle("error", error);
        }
    };

    async function profileFor(user) {
        if (!client() || !user) return null;

        const { data } = await client()
            .from("profiles")
            .select("id,display_name,role")
            .eq("id", user.id)
            .maybeSingle();

        return data;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const form = $("#authForm");

        if (!form) return;

        if (!client()) {
            message(
                "Connect Supabase first in js/supabase-config.js. The auth form is ready once configured.",
                true
            );
        }

        form.addEventListener("submit", async e => {
            e.preventDefault();

            if (!client()) {
                return message("Supabase is not configured yet.", true);
            }

            const submit = form.querySelector('button[type="submit"]');
            submit.disabled = true;

            const mode = form.dataset.mode;
            const email = $("#email").value.trim();
            const password = $("#password").value;

            try {
                if (mode === "register") {
                    const name = $("#displayName").value.trim();

                    const { data, error } = await client().auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                display_name: name
                            },
                            emailRedirectTo:
                                location.origin +
                                location.pathname.replace(
                                    /[^/]*$/,
                                    "login.html"
                                )
                        }
                    });

                    if (error) throw error;

                    message(
                        data.session
                            ? "Account created. You can now sign in."
                            : "Account created. Check your email to confirm your account, then log in."
                    );
                } else {
                    const { data, error } = await client()
                        .auth.signInWithPassword({
                            email,
                            password
                        });

                    if (error) throw error;

                    const profile = await profileFor(data.user);

                    const params = new URLSearchParams(location.search);
                    const next = params.get("next");

                    if (
                        next &&
                        next.startsWith("/") &&
                        !next.startsWith("//")
                    ) {
                        location.href = next;
                    } else {
                        location.href =
                            profile?.role === "admin"
                                ? "admin/index.html"
                                : "account.html";
                    }
                }
            } catch (error) {
                message(error.message || "Authentication failed.", true);
            } finally {
                submit.disabled = false;
            }
        });
    });
})();