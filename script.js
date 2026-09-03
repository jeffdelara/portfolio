/* =========================================
   bryl-minimal script
   Theme toggle, entrance stagger, sidebar,
   mobile menu, halftone canvas
   ========================================= */

(function () {
    "use strict";

    // ---------- Theme Manager ----------
    const THEME_KEY = "theme-preference";
    const html = document.documentElement;

    function getPreferredTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") return stored;
        return "system";
    }

    function getResolvedTheme(pref) {
        if (pref === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return pref;
    }

    function applyTheme(pref) {
        html.setAttribute("data-theme", pref);
        // Update halftone after theme change
        requestAnimationFrame(drawHalftone);
    }

    function cycleTheme() {
        const current = getPreferredTheme();
        const next =
            current === "light" ? "dark" : current === "dark" ? "system" : "light";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    // Initial theme
    applyTheme(getPreferredTheme());

    // Listen for OS theme changes
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
            if (getPreferredTheme() === "system") {
                applyTheme("system");
            }
        });

    // Theme toggle buttons
    document
        .querySelectorAll(".theme-toggle")
        .forEach((btn) => btn.addEventListener("click", cycleTheme));

    // ---------- Sidebar Active Link ----------
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const sections = document.querySelectorAll("section[id]");

    function updateActiveLink() {
        let current = "";
        sections.forEach((section) => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute("id");
            }
        });
        sidebarLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", updateActiveLink, { passive: true });
    updateActiveLink();

    // ---------- Mobile Menu ----------
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileLinks = document.querySelectorAll(".mobile-link");
    let menuOpen = false;

    function openMenu() {
        menuOpen = true;
        menuToggle.classList.add("active");
        mobileMenu.classList.add("open");
        mobileMenu.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        menuOpen = false;
        menuToggle.classList.remove("active");
        mobileMenu.classList.remove("open");
        mobileMenu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    menuToggle.addEventListener("click", () => {
        menuOpen ? closeMenu() : openMenu();
    });

    mobileLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuOpen) closeMenu();
    });

    // ---------- Entrance Stagger ----------
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion) {
        const entranceEls = document.querySelectorAll(".entrance");

        // Stagger: first at 50ms, each +70ms, cap ~330ms
        entranceEls.forEach((el, i) => {
            const delay = Math.min(50 + i * 70, 330);
            el.style.transitionDelay = delay + "ms";
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );

        entranceEls.forEach((el) => observer.observe(el));
    } else {
        // If reduced motion, show everything immediately
        document
            .querySelectorAll(".entrance")
            .forEach((el) => el.classList.add("visible"));
    }

    // ---------- Halftone Canvas ----------
    let canvas = null;

    function createCanvas() {
        canvas = document.createElement("canvas");
        canvas.id = "halftone";
        canvas.setAttribute("aria-hidden", "true");
        document.body.appendChild(canvas);
    }

    function drawHalftone() {
        if (prefersReducedMotion) {
            if (canvas) canvas.style.display = "none";
            return;
        }

        if (!canvas) createCanvas();
        const context = canvas.getContext("2d");

        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        context.scale(dpr, dpr);

        context.clearRect(0, 0, w, h);

        const isDark =
            html.getAttribute("data-theme") === "dark" ||
            (html.getAttribute("data-theme") === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        const dotColor = isDark
            ? "rgba(244, 244, 245, 0.15)"
            : "rgba(10, 10, 10, 0.3)";

        const cellSize = 9;
        const dotRadius = 1;
        const fadeHeight = h * 0.5;

        context.fillStyle = dotColor;

        for (let x = 0; x < w; x += cellSize) {
            for (let y = 0; y < h; y += cellSize) {
                let alpha;
                if (y < fadeHeight) {
                    alpha = 1 - (y / fadeHeight) * 0.9;
                } else {
                    alpha = 0.1 * (1 - (y - fadeHeight) / (h - fadeHeight));
                }

                if (alpha > 0.01) {
                    context.globalAlpha = alpha;
                    context.beginPath();
                    context.arc(x, y, dotRadius, 0, Math.PI * 2);
                    context.fill();
                }
            }
        }

        context.globalAlpha = 1;
    }

    drawHalftone();

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(drawHalftone, 150);
    });

    // Redraw on theme change
    const themeObserver = new MutationObserver(() => {
        requestAnimationFrame(drawHalftone);
    });
    themeObserver.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
})();
