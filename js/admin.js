(function () {
    const $ = s => document.querySelector(s);

    const esc = s =>
        String(s ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));

    async function requireAdmin() {
        const db = window.sineLokalSupabase;

        if (!db) {
            location.href = "../login.html";
            return null;
        }

        const {
            data: { user }
        } = await db.auth.getUser();

        if (!user) {
            location.href =
                "../login.html?next=" + encodeURIComponent(location.pathname);
            return null;
        }

        const { data: profile } = await db
            .from("profiles")
            .select("role,display_name")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role !== "admin") {
            document.body.innerHTML = `
                <main class="auth-wrap">
                    <section class="auth-card">
                        <h1>Access denied</h1>
                        <p>
                            This page is restricted to SineLokal administrators.
                        </p>
                        <a class="button button-gold" href="../index.html">
                            Return home
                        </a>
                    </section>
                </main>
            `;

            return null;
        }

        return { db, user, profile };
    }

    function say(text, error = false) {
        const el = $("#adminMessage");

        if (el) {
            el.textContent = text;
            el.classList.toggle("error", error);
        }
    }

    async function dashboard(ctx) {
        const { count: movies } = await ctx.db
            .from("movies")
            .select("id", { count: "exact", head: true });

        const { count: users } = await ctx.db
            .from("profiles")
            .select("id", { count: "exact", head: true });

        const { count: favorites } = await ctx.db
            .from("favorites")
            .select("id", { count: "exact", head: true });

        $("#statMovies").textContent = movies ?? "—";
        $("#statUsers").textContent = users ?? "—";
        $("#statFavorites").textContent = favorites ?? "—";
    }

    async function movieManager(ctx) {
        const form = $("#movieForm");
        const table = $("#adminMovieRows");

        async function refresh() {
            const { data, error } = await ctx.db
                .from("movies")
                .select("id,title,genre,year,featured")
                .order("created_at", { ascending: false });

            if (error) {
                say(error.message, true);
                return;
            }

            table.innerHTML = (data || [])
                .map(m => `
                    <tr>
                        <td>${esc(m.title)}</td>
                        <td>${esc(m.genre)}</td>
                        <td>${esc(m.year || "")}</td>
                        <td>${m.featured ? "Yes" : "No"}</td>
                        <td>
                            <div class="table-actions">
                                <button
                                    class="small-button"
                                    data-edit="${esc(m.id)}"
                                >
                                    Edit
                                </button>
                                <button
                                    class="small-button danger"
                                    data-delete="${esc(m.id)}"
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `)
                .join("") || `
                    <tr>
                        <td colspan="5">
                            No films in Supabase yet. Add your first film above.
                        </td>
                    </tr>
                `;
        }

        function reset() {
            form.reset();
            $("#movieId").value = "";
            $("#movieFormTitle").textContent = "Add a film";
            $("#saveMovie").textContent = "Save film";
        }

        form.addEventListener("submit", async e => {
            e.preventDefault();

            const payload = {
                title: $("#title").value.trim(),
                genre: $("#genre").value,
                year: $("#year").value
                    ? Number($("#year").value)
                    : null,
                duration: $("#duration").value.trim(),
                description: $("#description").value.trim(),
                poster_url: $("#posterUrl").value.trim(),
                youtube_url: $("#youtubeUrl").value.trim(),
                featured: $("#featured").checked
            };

            const id = $("#movieId").value;

            const result = id
                ? await ctx.db
                    .from("movies")
                    .update(payload)
                    .eq("id", id)
                : await ctx.db
                    .from("movies")
                    .insert(payload);

            if (result.error) {
                say(result.error.message, true);
                return;
            }

            say(id ? "Film updated." : "Film added.");

            reset();
            await refresh();
        });

        table.addEventListener("click", async e => {
            const edit = e.target.closest("[data-edit]");
            const del = e.target.closest("[data-delete]");

            if (edit) {
                const { data, error } = await ctx.db
                    .from("movies")
                    .select("*")
                    .eq("id", edit.dataset.edit)
                    .single();

                if (error) {
                    say(error.message, true);
                    return;
                }

                $("#movieId").value = data.id;
                $("#title").value = data.title || "";
                $("#genre").value = data.genre || "Drama";
                $("#year").value = data.year || "";
                $("#duration").value = data.duration || "";
                $("#description").value = data.description || "";
                $("#posterUrl").value = data.poster_url || "";
                $("#youtubeUrl").value = data.youtube_url || "";
                $("#featured").checked = !!data.featured;

                $("#movieFormTitle").textContent = "Edit film";
                $("#saveMovie").textContent = "Update film";

                form.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            if (
                del &&
                confirm(
                    "Delete this film? User favorites for it will also be removed."
                )
            ) {
                const { error } = await ctx.db
                    .from("movies")
                    .delete()
                    .eq("id", del.dataset.delete);

                if (error) {
                    say(error.message, true);
                } else {
                    say("Film deleted.");
                }

                await refresh();
            }
        });

        $("#cancelMovieEdit")?.addEventListener("click", reset);

        await refresh();
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const ctx = await requireAdmin();

        if (!ctx) return;

        if ($("#adminIdentity")) {
            $("#adminIdentity").textContent =
                ctx.profile?.display_name || ctx.user.email;
        }

        $("#adminLogout")?.addEventListener("click", async () => {
            await ctx.db.auth.signOut();
            location.href = "../index.html";
        });

        if (document.body.dataset.adminPage === "dashboard") {
            await dashboard(ctx);
        }

        if (document.body.dataset.adminPage === "movies") {
            await movieManager(ctx);
        }
    });
})();