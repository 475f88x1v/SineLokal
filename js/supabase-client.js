(function () {
    const url = window.SINELOKAL_SUPABASE_URL;
    const key = window.SINELOKAL_SUPABASE_ANON_KEY;

    const configured = Boolean(
        url &&
        key &&
        !url.includes("YOUR-PROJECT") &&
        !key.includes("YOUR_SUPABASE")
    );

    window.sineLokalSupabaseConfigured = configured;

    window.sineLokalSupabase = configured && window.supabase
        ? window.supabase.createClient(url, key)
        : null;

    if (!configured) {
        console.warn(
            "SineLokal: Add your Supabase URL and anon key in js/supabase-config.js. Demo film browsing still works."
        );
    }
})();