/* =====================================================
   SMARTQ - ANIMATIONS & EFFECTS (load AFTER app.js)
   Does not change any existing function except adding
   a small visual wrapper around showMessage().
   ===================================================== */

(function () {
    "use strict";

    var page = document.body.dataset.page || "";
    var reduce = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- INLINE SVG ILLUSTRATION (no internet needed) ---------- */

    var QUEUE_SVG =
        '<svg class="fx-illus" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="160" cy="186" rx="140" ry="9" fill="rgba(0,0,0,.15)"/>' +
        '<g class="fx-p p1"><circle cx="70" cy="82" r="22" fill="#ffd9b3"/><rect x="45" y="106" width="50" height="72" rx="22" fill="#ffffff"/></g>' +
        '<g class="fx-p p2"><circle cx="160" cy="72" r="24" fill="#f2b98a"/><rect x="132" y="98" width="56" height="80" rx="24" fill="#ffd166"/></g>' +
        '<g class="fx-p p3"><circle cx="250" cy="82" r="22" fill="#ffd9b3"/><rect x="225" y="106" width="50" height="72" rx="22" fill="#a8e6cf"/></g>' +
        '<g class="fx-ticket"><rect x="200" y="14" width="86" height="40" rx="9" fill="#ffffff"/>' +
        '<text x="243" y="41" text-anchor="middle" font-size="19" font-weight="700" fill="#28796d" font-family="Arial">Q024</text></g>' +
        '<g><circle cx="50" cy="35" r="22" fill="#ffffff"/>' +
        '<line x1="50" y1="35" x2="50" y2="20" stroke="#28796d" stroke-width="3" stroke-linecap="round"/>' +
        '<line class="fx-hand" x1="50" y1="35" x2="63" y2="35" stroke="#ef476f" stroke-width="3" stroke-linecap="round"/></g>' +
        '</svg>';


    /* ---------- FLOATING STICKERS ---------- */

    function addStickers() {

        var host = document.querySelector(".auth-page") || document.body;

        var layer = document.createElement("div");
        layer.className = "fx-bg";

        var items = [
            ["🎫", "5%", "12%", 0], ["⏱️", "90%", "16%", 1.2],
            ["📅", "10%", "76%", 2], ["✅", "86%", "70%", .6],
            ["🔔", "48%", "88%", 1.8], ["⭐", "72%", "6%", 2.6]
        ];

        items.forEach(function (s) {
            var e = document.createElement("span");
            e.className = "fx-sticker";
            e.textContent = s[0];
            e.style.left = s[1];
            e.style.top = s[2];
            e.style.animationDelay = s[3] + "s";
            layer.appendChild(e);
        });

        if (page === "auth") {
            ["#7fd1c1:-60px:-60px:260px", "#bfe3f7:auto:-80px:300px"].forEach(function (b, i) {
                var p = b.split(":");
                var blob = document.createElement("div");
                blob.className = "fx-blob";
                blob.style.background = p[0];
                blob.style.width = blob.style.height = p[3];
                if (i === 0) { blob.style.left = p[1]; blob.style.top = p[2]; }
                else { blob.style.right = "-80px"; blob.style.bottom = "-80px"; }
                layer.appendChild(blob);
            });
        }

        host.appendChild(layer);
    }


    /* ---------- ANIMATED TITLE STICKER ---------- */

    var TITLE_STICKERS = {
        dashboard: ["👋", "fx-wave"],
        booking: ["📅", "fx-bounce"],
        queue: ["⏳", "fx-flip"],
        history: ["📜", "fx-swing"],
        profile: ["😎", "fx-bounce"],
        staff: ["🧑‍💼", "fx-swing"],
        admin: ["⚙️", "fx-spin"]
    };

    function addTitleSticker() {

        var t = document.querySelector(".page-title");
        var cfg = TITLE_STICKERS[page];

        if (!t || !cfg || t.querySelector(".fx-title-sticker")) return;

        var s = document.createElement("span");
        s.className = "fx-title-sticker " + cfg[1];
        s.textContent = cfg[0];
        t.appendChild(s);
    }


    /* ---------- HERO BANNER (dashboard) + LOGIN ILLUSTRATION ---------- */

    function addImages() {

        if (page === "dashboard") {

            var grid = document.querySelector(".stats-grid");

            if (grid && !document.querySelector(".fx-hero")) {

                var hero = document.createElement("div");
                hero.className = "fx-hero";
                hero.innerHTML =
                    '<div><h2>Skip the line, not the service 🚀</h2>' +
                    '<p>Book a slot, get your token and track your turn live.</p>' +
                    '<a href="booking.html" class="btn btn-secondary" style="margin-top:14px">🎫 Get a Token</a></div>' +
                    QUEUE_SVG;

                grid.parentNode.insertBefore(hero, grid);
            }
        }

        if (page === "auth") {

            var brand = document.querySelector(".brand");

            if (brand && !document.querySelector(".fx-illus-panel")) {

                var panel = document.createElement("div");
                panel.className = "fx-illus-panel";
                panel.innerHTML = QUEUE_SVG;
                brand.parentNode.insertBefore(panel, brand);
            }
        }
    }


    /* ---------- EMOJI ICONS FOR SERVICES + EMPTY STATES ---------- */

    function iconFor(name) {

        name = name.toLowerCase();

        if (/consult|doctor|health/.test(name)) return "🩺";
        if (/document|verif/.test(name)) return "📄";
        if (/support|help|customer/.test(name)) return "🎧";
        if (/account|bank|payment/.test(name)) return "💳";

        return "🎫";
    }


    /* ---------- NUMBER COUNT-UP ---------- */

    function countUp(el) {

        var text = el.textContent.trim();

        if (!/^\d+$/.test(text) ||
            el.dataset.fxRun === "1" ||
            el.dataset.fxVal === text) return;

        var to = parseInt(text, 10);
        var from = parseInt(el.dataset.fxVal || "0", 10);

        if (reduce || to === from) {
            el.dataset.fxVal = text;
            return;
        }

        el.dataset.fxRun = "1";

        var start = performance.now();
        var dur = 800;

        (function step(now) {

            var p = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);

            el.textContent = Math.round(from + (to - from) * eased);

            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                el.dataset.fxRun = "0";
                el.dataset.fxVal = String(to);
            }
        })(start);
    }


    /* ---------- APPLY TO DYNAMIC CONTENT ---------- */

    function enhance() {

        document.querySelectorAll(".service-card").forEach(function (card) {

            var icon = card.querySelector(".service-icon");
            var name = card.querySelector(".service-name");

            if (icon && name && !icon.dataset.fx && icon.textContent.trim() === "Q") {
                icon.dataset.fx = "1";
                icon.textContent = iconFor(name.textContent);
            }
        });

        document.querySelectorAll(".empty-icon").forEach(function (el) {
            if (!el.dataset.fx) {
                el.dataset.fx = "1";
                el.textContent = "🎫";
            }
        });

        document.querySelectorAll(".stat-value").forEach(countUp);
    }

    var queued = false;

    new MutationObserver(function () {

        if (queued) return;

        queued = true;

        requestAnimationFrame(function () {
            queued = false;
            enhance();
        });

    }).observe(document.body, { childList: true, subtree: true });


    /* ---------- CONFETTI + NOTIFICATION EMOJI ---------- */

    function confetti() {

        if (reduce) return;

        var box = document.createElement("div");
        box.className = "fx-confetti";

        var colors = ["#28796d", "#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#f78c6b"];

        for (var i = 0; i < 60; i++) {

            var piece = document.createElement("i");

            piece.style.left = Math.random() * 100 + "%";
            piece.style.background = colors[i % colors.length];
            piece.style.width = (6 + Math.random() * 6) + "px";
            piece.style.height = (8 + Math.random() * 8) + "px";
            piece.style.animationDuration = (1.8 + Math.random() * 1.6) + "s";
            piece.style.animationDelay = (Math.random() * 0.4) + "s";
            piece.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");

            box.appendChild(piece);
        }

        document.body.appendChild(box);

        setTimeout(function () { box.remove(); }, 4000);
    }

    if (typeof window.showMessage === "function") {

        var originalShowMessage = window.showMessage;

        window.showMessage = function (message, type) {

            originalShowMessage.apply(this, arguments);

            var box = document.querySelector(".notification");

            if (box) {
                box.textContent = (type === "error" ? "⚠️ " : "✅ ") + box.textContent;
                if (type === "error") box.classList.add("fx-shake");
            }

            if (type !== "error" && /booked|completed|added|registration|updated/i.test(message)) {
                confetti();
            }
        };
    }


    /* ---------- START ---------- */

    document.addEventListener("DOMContentLoaded", function () {
        addStickers();
        addTitleSticker();
        addImages();
        enhance();
    });

})();
