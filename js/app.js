(function () {
    const $ = (s, root = document) => root.querySelector(s);

    const esc = (value = "") =>
        String(value).replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));

    let films = [...(window.SINELOKAL_SAMPLE_MOVIES || [])];
    let currentUser = null;
    let favoriteIds = new Set();

    function movieId(movie) {
        return String(movie.id);
    }

    function genreName(movie) {
        return movie.genre || "Uncategorized";
    }

    function poster(movie) {
        return movie.poster_url || movie.posterUrl || "assets/images/SineLokal.png";
    }

    async function loadFilms() {
        const client = window.sineLokalSupabase;

        if (!client) return;

        const { data, error } = await client
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data && data.length) films = data;
    }

    async function loadUser() {
        const client = window.sineLokalSupabase;

        if (!client) return;

        const { data } = await client.auth.getUser();
        currentUser = data?.user || null;

        if (currentUser) {
            const { data: profile } = await client
                .from("profiles")
                .select("role,display_name")
                .eq("id", currentUser.id)
                .maybeSingle();

            currentUser.role = profile?.role || "user";
            currentUser.display_name =
                profile?.display_name ||
                currentUser.user_metadata?.display_name ||
                "";

            const { data: favs } = await client
                .from("favorites")
                .select("movie_id")
                .eq("user_id", currentUser.id);

            favoriteIds = new Set(
                (favs || []).map(row => String(row.movie_id))
            );
        }
    }

    function renderNav() {
        const host = $("#siteNav");

        if (!host) return;

        host.innerHTML = `
            <a class="brand" href="index.html" aria-label="SineLokal home">
                <img src="assets/images/SineLokal.png" alt="SineLokal">
                <span>FILIPINO FILMS. CLOSER TO HOME.</span>
            </a>
            <nav class="main-nav" aria-label="Main navigation">
                <a href="index.html">Home</a>
                <a href="browse.html">Browse</a>
                <button class="nav-link" id="openGenres" type="button">Genres</button>
                <a href="favorites.html">Favorites</a>
                <a href="index.html#about">About</a>
                ${
                    currentUser
                        ? `<a href="account.html">My Account</a>${
                            currentUser.role === 'admin'
                                ? '<a href="admin/index.html">Admin</a>'
                                : ''
                        }<button class="nav-auth" id="logoutButton">Log out</button>`
                        : '<a class="nav-auth" href="login.html">Log in</a>'
                }
            </nav>`;

        $("#openGenres")?.addEventListener("click", openGenreModal);

        $("#logoutButton")?.addEventListener("click", async () => {
            await window.sineLokalSupabase?.auth.signOut();
            location.href = "index.html";
        });
    }

    const genreData = [
        [
            "Action",
            "Action & Martial Arts",
            "High-energy adventures, heroic stories, and thrilling fights."
        ],
        [
            "Drama",
            "Drama",
            "Stories about family, sacrifice, social issues, and the human spirit."
        ],
        [
            "Romance",
            "Romance & Rom-Com",
            "Heartfelt love stories, relationships, and second chances."
        ],
        [
            "Comedy",
            "Comedy",
            "Filipino humor, family entertainment, and lighthearted stories."
        ],
        [
            "Horror",
            "Horror & Supernatural",
            "Folklore, urban legends, supernatural beings, and the unknown."
        ],
        [
            "Crime",
            "Crime & Gangster",
            "Stories about crime, justice, syndicates, and investigations."
        ],
        [
            "Historical",
            "Historical & Biographical",
            "National heroes and important moments in Philippine history."
        ],
        [
            "Independent",
            "Independent & Slow Cinema",
            "Distinctive, artistic, and socially conscious filmmaking."
        ],
        [
            "Fantasy",
            "Fantasy & Folklore",
            "Magical worlds, mythical creatures, and Filipino traditions."
        ],
        [
            "Documentary",
            "Documentary",
            "Real people, events, culture, and experiences."
        ]
    ];

    function ensureGenreModal() {
        if ($("#genreModal")) return;

        const modal = document.createElement("div");

        modal.id = "genreModal";
        modal.className = "genre-modal";
        modal.hidden = true;

        modal.innerHTML = `
            <div class="genre-backdrop" data-close-genre></div>
            <section
                class="genre-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="genreTitle"
                tabindex="-1"
            >
                <header class="genre-dialog-head">
                    <div>
                        <p class="eyebrow">SINELOKAL COLLECTION</p>
                        <h2 id="genreTitle">Explore Filipino Film Genres</h2>
                        <p>
                            Discover stories, themes, and voices that define
                            Philippine cinema.
                        </p>
                    </div>
                    <button
                        class="icon-close"
                        type="button"
                        aria-label="Close genre explorer"
                        data-close-genre
                    >×</button>
                </header>
                <div class="genre-grid">
                    ${genreData.map(([slug, title, desc]) => `
                        <button
                            class="genre-tile"
                            type="button"
                            data-genre="${esc(slug)}"
                        >
                            <span class="gold-line"></span>
                            <strong>${esc(title)}</strong>
                            <span>${esc(desc)}</span>
                        </button>
                    `).join("")}
                </div>
                <footer class="genre-dialog-foot">
                    <button
                        class="button button-gold"
                        type="button"
                        id="allFilmsFromGenres"
                    >View all films</button>
                </footer>
            </section>`;

        document.body.appendChild(modal);

        modal.addEventListener("click", e => {
            if (e.target.closest("[data-close-genre]")) closeGenreModal();

            const tile = e.target.closest("[data-genre]");

            if (tile) {
                location.href =
                    `browse.html?genre=${encodeURIComponent(tile.dataset.genre)}`;
            }

            if (e.target.closest("#allFilmsFromGenres")) {
                location.href = "browse.html";
            }
        });

        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && !modal.hidden) closeGenreModal();
        });
    }

    function openGenreModal() {
        ensureGenreModal();

        const modal = $("#genreModal");

        modal.hidden = false;
        document.body.classList.add("modal-open");

        requestAnimationFrame(() => modal.classList.add("visible"));

        $(".genre-dialog", modal).focus();
    }

    window.openSineLokalGenres = openGenreModal;

    function closeGenreModal() {
        const modal = $("#genreModal");

        if (!modal) return;

        modal.classList.remove("visible");
        document.body.classList.remove("modal-open");

        setTimeout(() => {
            if (!modal.classList.contains("visible")) modal.hidden = true;
        }, 220);
    }

    function movieCard(movie) {
        const id = movieId(movie);

        return `
            <article class="movie-card">
                <a
                    class="poster-link"
                    href="movie.html?id=${encodeURIComponent(id)}"
                >
                    <img
                        src="${esc(poster(movie))}"
                        alt="${esc(movie.title)} poster"
                        loading="lazy"
                        onerror="this.src='assets/images/SineLokal.png'"
                    >
                    <span class="poster-overlay">
                        <span>View film</span>
                    </span>
                </a>
                <div class="movie-card-body">
                    <p class="movie-genre">
                        ${esc(genreName(movie))} · ${esc(movie.year || "Year n/a")}
                    </p>
                    <h3>
                        <a href="movie.html?id=${encodeURIComponent(id)}">
                            ${esc(movie.title)}
                        </a>
                    </h3>
                    <p class="movie-duration">${esc(movie.duration || "")}</p>
                    <button
                        class="favorite-toggle ${favoriteIds.has(id) ? "is-favorite" : ""}"
                        type="button"
                        data-favorite="${esc(id)}"
                        aria-label="${favoriteIds.has(id) ? "Remove from" : "Add to"} favorites"
                    >
                        ${favoriteIds.has(id) ? "♥ Saved" : "♡ Favorite"}
                    </button>
                </div>
            </article>`;
    }

    function renderCards(container, list) {
        if (!container) return;

        container.innerHTML = list.length
            ? list.map(movieCard).join("")
            : '<p class="empty-state">No films found for this selection yet. Try another genre or browse all films.</p>';
    }

    async function toggleFavorite(id) {
        if (!currentUser) {
            location.href =
                "login.html?next=" +
                encodeURIComponent(location.pathname + location.search);

            return;
        }

        const client = window.sineLokalSupabase;

        if (!client) {
            alert("Connect Supabase to save favorites.");
            return;
        }

        const exists = favoriteIds.has(id);
        let query;

        if (exists) {
            query = await client
                .from("favorites")
                .delete()
                .eq("user_id", currentUser.id)
                .eq("movie_id", id);
        } else {
            query = await client
                .from("favorites")
                .insert({
                    user_id: currentUser.id,
                    movie_id: id
                });
        }

        if (query.error) {
            alert("Could not update favorites: " + query.error.message);
            return;
        }

        if (exists) favoriteIds.delete(id);
        else favoriteIds.add(id);

        if (typeof window.refreshSineLokalPage === "function") {
            window.refreshSineLokalPage();
        } else {
            location.reload();
        }
    }

    document.addEventListener("click", e => {
        const button = e.target.closest("[data-favorite]");

        if (button) toggleFavorite(button.dataset.favorite);
    });

    async function initialize() {
        await loadUser();
        await loadFilms();

        renderNav();

        const page = document.body.dataset.page;

        if (page === "home") {
            renderCards(
                $("#featuredGrid"),
                films.filter(m => m.featured).slice(0, 3)
            );

            renderCards($("#recentGrid"), films.slice(0, 3));
        }

        if (page === "browse") {
            const search = $("#filmSearch");
            const filter = $("#genreFilter");
            const grid = $("#filmGrid");
            const count = $("#filmCount");
            const heading = $("#browseHeading");

            const genres = [...new Set(films.map(genreName))].sort();

            genres.forEach(g => {
                const option = document.createElement("option");

                option.value = g;
                option.textContent = g;

                filter.appendChild(option);
            });

            const params = new URLSearchParams(location.search);
            const wanted = params.get("genre");

            if (wanted) {
                const match = [...filter.options].find(
                    o => o.value.toLowerCase() === wanted.toLowerCase()
                );

                if (match) filter.value = match.value;
            }

            function update() {
                const q = search.value.trim().toLowerCase();
                const g = filter.value.toLowerCase();

                const list = films.filter(m =>
                    (!q || `${m.title} ${m.description || ""}`.toLowerCase().includes(q)) &&
                    (g === "all" || genreName(m).toLowerCase().includes(g))
                );

                heading.textContent =
                    g === "all"
                        ? (q ? "Search Results" : "All Films")
                        : `${filter.value} Films`;

                count.textContent =
                    `${list.length} ${list.length === 1 ? "film" : "films"} found`;

                renderCards(grid, list);
            }

            search.addEventListener("input", update);
            filter.addEventListener("change", update);

            $("#clearFilters")?.addEventListener("click", () => {
                search.value = "";
                filter.value = "all";

                history.replaceState({}, "", "browse.html");

                update();
            });

            update();
        }

        if (page === "movie") {
            const id = new URLSearchParams(location.search).get("id");
            const movie = films.find(m => movieId(m) === id);
            const host = $("#movieDetail");

            if (!movie) {
                host.innerHTML =
                    '<p class="empty-state">Film not found. <a href="browse.html">Return to Browse</a>.</p>';
            } else {
                document.title = `${movie.title} | SineLokal`;

                host.innerHTML = `
                    <div class="detail-poster">
                        <img src="${esc(poster(movie))}" alt="${esc(movie.title)} poster">
                    </div>
                    <div class="detail-copy">
                        <p class="eyebrow">
                            ${esc(genreName(movie))} · ${esc(movie.year || "")}
                        </p>
                        <h1>${esc(movie.title)}</h1>
                        <p class="detail-duration">${esc(movie.duration || "")}</p>
                        <p class="detail-description">
                            ${esc(movie.description || "No description added yet.")}
                        </p>
                        <div class="detail-actions">
                            ${
                                movie.youtube_url
                                    ? `<a class="button button-gold" href="${esc(movie.youtube_url)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>`
                                    : ""
                            }
                            <button
                                class="button button-outline"
                                data-favorite="${esc(movieId(movie))}"
                            >
                                ${favoriteIds.has(movieId(movie)) ? "♥ Saved to Favorites" : "♡ Add to Favorites"}
                            </button>
                        </div>
                    </div>`;
            }
        }

        if (page === "favorites") {
            const grid = $("#favoritesGrid");

            if (!currentUser) {
                $("#favoritesNotice").innerHTML =
                    'Please <a href="login.html">log in</a> to view your saved films.';
            } else {
                const ids = new Set([...favoriteIds]);

                renderCards(
                    grid,
                    films.filter(m => ids.has(movieId(m)))
                );

                if (!favoriteIds.size) {
                    $("#favoritesNotice").textContent =
                        "You haven't saved any films yet. Explore the library and tap Favorite.";
                }
            }
        }

        window.refreshSineLokalPage = () => initialize();
    }

    document.addEventListener("DOMContentLoaded", initialize);
})();