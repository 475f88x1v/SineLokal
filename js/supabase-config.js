window.SINELOKAL_SUPABASE_URL = "https://oqmzsvxwzkcexkvecqik.supabase.co";
window.SINELOKAL_SUPABASE_ANON_KEY = "sb_publishable_1g0bmP1-WNkHMZH4zvTfoA_mcmwJWzz";

(function () {
    const url = window.SINELOKAL_SUPABASE_URL;
    const key = window.SINELOKAL_SUPABASE_ANON_KEY;

    const configured = Boolean(
        url &&
        key &&
        !url.includes("PASTE_YOUR_ACTUAL") &&
        !key.includes("PASTE_YOUR_ACTUAL")
    );

    window.sineLokalSupabaseConfigured = configured;

    window.sineLokalSupabase =
        configured && window.supabase
            ? window.supabase.createClient(url, key)
            : null;

    if (!configured) {
        console.warn(
            "SineLokal: Check your Supabase URL and publishable key."
        );
    }
})();