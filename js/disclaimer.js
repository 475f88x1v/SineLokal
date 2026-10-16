(function () {
    "use strict";

    const STORAGE_KEY = "sinelokal_disclaimer_accepted";

    function isHomePage() {
        const path = window.location.pathname;
        const lastSegment = path.split("/").filter(Boolean).pop() || "";

        return lastSegment === "" ||
            lastSegment.toLowerCase() === "index.html";
    }

    function createDisclaimer(forceShow = false) {
        if (document.querySelector("#disclaimerModal")) {
            return;
        }

        if (!forceShow && !isHomePage()) {
            return;
        }

        if (!forceShow) {
            let accepted = false;

            try {
                accepted = localStorage.getItem(STORAGE_KEY) === "true";
            } catch (error) {
                console.warn(
                    "SineLokal: Unable to read disclaimer acceptance.",
                    error
                );
            }

            if (accepted) {
                return;
            }
        }

        const modal = document.createElement("div");

        modal.id = "disclaimerModal";
        modal.className = "disclaimer-modal";

        modal.innerHTML = `
            <section
                class="disclaimer-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="disclaimerTitle"
                aria-describedby="disclaimerDescription"
                tabindex="-1"
            >
                <div class="disclaimer-icon-wrap">
                    <span
                        class="disclaimer-icon"
                        aria-hidden="true"
                    >i</span>
                </div>

                <h2
                    class="disclaimer-heading"
                    id="disclaimerTitle"
                >
                    Disclaimer
                </h2>

                <p class="disclaimer-subtitle">
                    Please read before proceeding.
                </p>

                <div
                    class="disclaimer-content"
                    id="disclaimerDescription"
                >
                    <p>
                        SineLokal is a Filipino film directory created
                        for informational and educational purposes.
                        It helps users discover Filipino films
                        available on YouTube.
                    </p>

                    <p>
                        <strong>
                            SineLokal does not own, host, or claim
                            copyright over the films featured on this
                            website.
                        </strong>
                        All movies, videos, posters, trademarks, and
                        related materials belong to their respective
                        owners and copyright holders.
                    </p>

                    <p>
                        All movie viewing links direct users to
                        YouTube. SineLokal is not responsible for
                        the availability of videos or changes made
                        to them on YouTube.
                    </p>

                    <p>
                        If you are a copyright owner and have concerns
                        regarding a film listed on SineLokal, please
                        contact the website administrators for review.
                    </p>
                </div>

                <div class="disclaimer-acknowledgment">
                    By proceeding, you acknowledge that SineLokal
                    serves as a directory for discovering Filipino
                    films and that the featured films remain the
                    property of their respective rights holders.
                </div>

                <div class="disclaimer-actions">
                    <button
                        class="disclaimer-accept"
                        id="acceptDisclaimer"
                        type="button"
                    >
                        I Understand
                    </button>
                </div>

                <p class="disclaimer-footer">
                    Thank you for supporting Filipino cinema
                    and its creators.
                </p>
            </section>
        `;

        document.body.appendChild(modal);
        document.body.classList.add("disclaimer-open");

        const acceptButton = modal.querySelector("#acceptDisclaimer");
        const card = modal.querySelector(".disclaimer-card");

        acceptButton.addEventListener("click", function () {
            // Save acceptance so the automatic homepage modal
            // does not appear again on subsequent visits.
            try {
                localStorage.setItem(STORAGE_KEY, "true");
            } catch (error) {
                console.warn(
                    "SineLokal: Unable to save disclaimer acceptance.",
                    error
                );
            }

            modal.remove();
            document.body.classList.remove("disclaimer-open");
        });

        card.focus();
    }

    document.addEventListener("click", function (event) {
        const disclaimerLink = event.target.closest(
            "#footerDisclaimerLink"
        );

        if (!disclaimerLink) {
            return;
        }

        event.preventDefault();
        createDisclaimer(true);
    });

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            function () {
                createDisclaimer(false);
            }
        );
    } else {
        createDisclaimer(false);
    }
})();