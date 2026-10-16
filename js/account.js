document.addEventListener("DOMContentLoaded", async () => {
    const client = window.sineLokalSupabase;
    const info = document.querySelector("#accountInfo");

    if (!client) {
        info.textContent = "Connect Supabase to use your account.";
        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        location.href =
            "login.html?next=" + encodeURIComponent("/account.html");
        return;
    }

    const { data: profile } = await client
        .from("profiles")
        .select("display_name,role")
        .eq("id", user.id)
        .maybeSingle();

    info.innerHTML = `
        <p>
            <strong>Email</strong><br>
            ${escapeHtml(user.email || "")}
        </p>
        <p>
            <strong>Name</strong><br>
            ${escapeHtml(
                profile?.display_name ||
                user.user_metadata?.display_name ||
                "SineLokal member"
            )}
        </p>
        <p>
            <strong>Role</strong><br>
            ${escapeHtml(profile?.role || "user")}
        </p>
    `;

    document
        .querySelector("#accountLogout")
        .addEventListener("click", async () => {
            await client.auth.signOut();
            location.href = "index.html";
        });
});

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}