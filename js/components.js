
(function () {
    const $ = (selector, root = document) =>
        root.querySelector(selector);

    async function loadComponent(selector, file) {
        const container = $(selector);

        if (!container) return;

        try {
            const response = await fetch(file);

            if (!response.ok) {
                throw new Error(
                    `Failed to load ${file}: ${response.status}`
                );
            }

            container.outerHTML = await response.text();
        } catch (error) {
            console.error("SineLokal component error:", error);
        }
    }

    async function initializeComponents() {
        const tasks = [];

        if ($("#navbarComponent")) {
            tasks.push(
                loadComponent(
                    "#navbarComponent",
                    "components/navbar.html"
                )
            );
        }

        if ($("#footerComponent")) {
            tasks.push(
                loadComponent(
                    "#footerComponent",
                    "components/footer.html"
                )
            );
        }

        await Promise.all(tasks);

        initializeNavbar();
        initializeFooter();
    }

    function initializeNavbar() {
        const toggle = $("#navToggle");
        const nav = $("#mainNav");

        if (!nav) return;

        if (toggle) {
            toggle.addEventListener("click", () => {
                const isOpen = nav.classList.toggle("is-open");

                toggle.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

                toggle.setAttribute(
                    "aria-label",
                    isOpen
                        ? "Close navigation"
                        : "Open navigation"
                );
            });
        }

        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");

                toggle?.setAttribute("aria-expanded", "false");
                toggle?.setAttribute(
                    "aria-label",
                    "Open navigation"
                );
            });
        });

        setActiveNavigation();
        initializeGenreButton();
        updateAuthNavigation();
    }

    function setActiveNavigation() {
        const currentPage = document.body.dataset.page;

        const activeLinks = {
            home: "home",
            browse: "browse",
            movie: "browse",
            favorites: "favorites",
            login: "login",
            register: "login",
            account: "account"
        };

        const activeKey = activeLinks[currentPage];

        if (!activeKey) return;

        const link = $(`[data-nav="${activeKey}"]`);

        if (link) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    }


    function initializeGenreButton() {
        const button = $("#openGenres");

        if (!button) return;

        button.addEventListener("click", () => {
            if (
                typeof window.openSineLokalGenres === "function"
            ) {
                window.openSineLokalGenres();
                return;
            }

            window.location.href = "browse.html";
        });
    }

    async function updateAuthNavigation() {
        const client = window.sineLokalSupabase;
        const nav = $("#mainNav");

        if (!nav || !client) return;

        try {
            const {
                data: { user },
                error
            } = await client.auth.getUser();

            if (error) throw error;

            const loginLink = nav.querySelector(
                '[data-nav="login"]'
            );

            const favoritesLink = nav.querySelector(
                '[data-nav="favorites"]'
            );

            if (!user) return;

            if (loginLink) {
                loginLink.textContent = "My Account";
                loginLink.href = "account.html";
                loginLink.dataset.nav = "account";
            }

            if (favoritesLink) {
                favoritesLink.hidden = false;
            }

            let profile = null;

            const { data, error: profileError } = await client
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (!profileError) {
                profile = data;
            }

            if (profile?.role === "admin") {
                let adminLink = nav.querySelector(
                    '[data-nav="admin"]'
                );

                if (!adminLink) {
                    adminLink = document.createElement("a");
                    adminLink.dataset.nav = "admin";
                    adminLink.href = "admin/index.html";
                    adminLink.textContent = "Admin";

                    nav.appendChild(adminLink);
                }
            }

            let logoutButton = nav.querySelector("#logoutButton");

            if (!logoutButton) {
                logoutButton = document.createElement("button");
                logoutButton.id = "logoutButton";
                logoutButton.type = "button";
                logoutButton.className = "nav-link nav-auth";
                logoutButton.textContent = "Log out";

                nav.appendChild(logoutButton);
            }

            logoutButton.addEventListener("click", async () => {
                logoutButton.disabled = true;

                try {
                    const { error: signOutError } =
                        await client.auth.signOut();

                    if (signOutError) throw signOutError;

                    window.location.href = "index.html";
                } catch (error) {
                    console.error("Logout failed:", error);
                    alert("Unable to log out. Please try again.");
                    logoutButton.disabled = false;
                }
            });
        } catch (error) {
            console.error(
                "Unable to update SineLokal navigation:",
                error
            );
        }
    }

    function initializeFooter() {
        const year = $("#footerYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        const disclaimerLink = $("#footerDisclaimerLink");

        disclaimerLink?.addEventListener("click", event => {
            event.preventDefault();

            if (
                typeof window.openSineLokalDisclaimer === "function"
            ) {
                window.openSineLokalDisclaimer();
            } else {
                console.error(
                    "The disclaimer function is unavailable. Check js/disclaimer.js."
                );
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeComponents
        );
    } else {
        initializeComponents();
    }
})();
