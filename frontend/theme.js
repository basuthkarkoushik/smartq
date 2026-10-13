/* =====================================================
   SMARTQ - THEME EFFECTS (load AFTER fx.js)
   ===================================================== */

(function () {
    "use strict";

    var root = document.documentElement;
    var canHover = window.matchMedia && matchMedia("(hover: hover)").matches;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- DARK / LIGHT MODE ---------- */

    var saved = null, savedPal = null;
    try {
        saved = localStorage.getItem("smartq_mode");
        savedPal = localStorage.getItem("smartq_palette");
    } catch (e) {}

    root.setAttribute("data-theme", saved || "light");
    root.setAttribute("data-palette", savedPal || "ocean");

    var PALETTES_UI = [
        ["ocean", "Ocean", "linear-gradient(135deg,#2563eb,#06b6d4)"],
        ["sunset", "Sunset", "linear-gradient(135deg,#f97316,#ec4899)"],
        ["royal", "Royal", "linear-gradient(135deg,#6d28d9,#db2777)"],
        ["fresh", "Fresh", "linear-gradient(135deg,#15803d,#84cc16)"],
        ["classic", "Classic", "linear-gradient(135deg,#1f8f7f,#5b8def)"]
    ];

    var SHAPES = {
        ocean: [0x2563eb, 0x06b6d4, 0x7c3aed],
        sunset: [0xf97316, 0xec4899, 0xfbbf24],
        royal: [0x7c3aed, 0xdb2777, 0x2563eb],
        fresh: [0x16a34a, 0x84cc16, 0x0ea5e9],
        classic: [0x2fb5a0, 0x5b8def, 0xa78bfa]
    };

    window.__thCols = function () {
        return SHAPES[root.getAttribute("data-palette")] || SHAPES.ocean;
    };

    function addPalette() {

        var box = document.createElement("div");
        box.className = "th-pal";

        var btn = document.createElement("button");
        btn.className = "th-pal-btn";
        btn.type = "button";
        btn.title = "Change colours";
        btn.textContent = "🎨";

        var panel = document.createElement("div");
        panel.className = "th-pal-panel";

        PALETTES_UI.forEach(function (p) {

            var sw = document.createElement("button");
            sw.type = "button";
            sw.className = "th-sw";
            sw.title = p[1];
            sw.style.background = p[2];
            sw.dataset.name = p[0];

            sw.addEventListener("click", function () {
                root.setAttribute("data-palette", p[0]);
                try { localStorage.setItem("smartq_palette", p[0]); } catch (e) {}
                mark();
                if (window.__thRecolor) window.__thRecolor();
            });

            panel.appendChild(sw);
        });

        function mark() {
            panel.querySelectorAll(".th-sw").forEach(function (s) {
                s.classList.toggle("on", s.dataset.name === root.getAttribute("data-palette"));
            });
        }

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            box.classList.toggle("open");
        });

        document.addEventListener("click", function () { box.classList.remove("open"); });

        box.appendChild(btn);
        box.appendChild(panel);
        document.body.appendChild(box);
        mark();
    }

    function addToggle() {

        var btn = document.createElement("button");
        btn.className = "th-toggle";
        btn.type = "button";
        btn.title = "Switch light / dark mode";

        function paint() {
            btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
        }

        btn.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try { localStorage.setItem("smartq_mode", next); } catch (e) {}
            paint();
        });

        paint();
        document.body.appendChild(btn);
    }


    /* ---------- CURSOR GLOW + CARD SPOTLIGHT + 3D TILT ---------- */

    var CARD = ".card, .stat-card, .service-card, .appointment-card, .queue-info, .auth-card";
    var TILT = ".service-card, .stat-card";

    function addPointerEffects() {

        if (!canHover || reduce) return;

        var glow = document.createElement("div");
        glow.className = "th-cursor";
        document.body.appendChild(glow);

        var x = 0, y = 0, queued = false;

        document.addEventListener("mousemove", function (e) {

            x = e.clientX;
            y = e.clientY;

            if (!queued) {
                queued = true;
                requestAnimationFrame(function () {
                    queued = false;
                    glow.style.transform = "translate(" + x + "px," + y + "px)";
                });
            }

            var card = e.target.closest ? e.target.closest(CARD) : null;

            if (!card) return;

            var r = card.getBoundingClientRect();
            var px = e.clientX - r.left;
            var py = e.clientY - r.top;

            card.style.setProperty("--mx", px + "px");
            card.style.setProperty("--my", py + "px");

            if (card.matches(TILT)) {
                var rx = ((py / r.height) - 0.5) * -8;
                var ry = ((px / r.width) - 0.5) * 8;
                card.style.transform =
                    "perspective(800px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
            }
        });

        document.addEventListener("mouseout", function (e) {

            var card = e.target.closest ? e.target.closest(TILT) : null;

            if (card && !card.contains(e.relatedTarget)) {
                card.style.transform = "";
            }
        });
    }


    /* ---------- ICONS ON STAT CARDS ---------- */

    var ICONS = [
        [/active|live/, "⚡"],
        [/complete/, "✅"],
        [/total|appointments/, "📅"],
        [/queue|status|system/, "📡"],
        [/token/, "🎫"],
        [/waiting/, "⏳"],
        [/staff/, "🧑‍💼"],
        [/customer/, "👥"],
        [/service/, "🛎️"]
    ];

    function addStatIcons() {

        document.querySelectorAll(".stat-card").forEach(function (card) {

            if (card.querySelector(".stat-ico")) return;

            var label = card.querySelector(".stat-label");
            var text = label ? label.textContent.toLowerCase() : "";
            var icon = "📊";

            for (var i = 0; i < ICONS.length; i++) {
                if (ICONS[i][0].test(text)) { icon = ICONS[i][1]; break; }
            }

            var el = document.createElement("span");
            el.className = "stat-ico";
            el.textContent = icon;
            card.appendChild(el);
        });
    }


    document.addEventListener("DOMContentLoaded", function () {
        addToggle();
        addPalette();
        addPointerEffects();
        addStatIcons();
    });
})();


/* =====================================================
   3D LAYER: glossy 3D stickers, perspective floor, Three.js shapes
   ===================================================== */

(function () {
    "use strict";

    var page = document.body.dataset.page || "";
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- 3D STICKERS (SVG with extrusion + gloss) ---------- */

    function svg(inner) {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
    }

    var BELL = 'd="M50 14c-16 0-26 12-26 28v18l-8 10h68l-8-10V42c0-16-10-28-26-28z"';
    var STAR = 'd="M50 8l12.5 26 28.5 4-20.7 20 5 28.4L50 73l-25.3 13.4 5-28.4L9 38l28.5-4z"';

    var SV = {
        ticket: svg('<g transform="rotate(-14 50 50)"><rect x="10" y="32" width="80" height="44" rx="10" fill="#b45309"/><rect x="10" y="24" width="80" height="44" rx="10" fill="url(#gT)"/><rect x="15" y="28" width="70" height="9" rx="5" fill="#fff" opacity=".4"/><line x1="64" y1="32" x2="64" y2="62" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 3" opacity=".85"/><text x="37" y="55" font-size="26" font-weight="800" fill="#7c2d12" text-anchor="middle" font-family="Arial">Q</text></g>'),
        clock: svg('<circle cx="50" cy="59" r="34" fill="#0f766e"/><rect x="43" y="8" width="14" height="9" rx="3" fill="#0f766e"/><circle cx="50" cy="52" r="34" fill="url(#gC)"/><circle cx="50" cy="52" r="26" fill="#fff"/><path d="M50 52V35M50 52l13 6" stroke="#0f766e" stroke-width="5" stroke-linecap="round"/><ellipse cx="37" cy="29" rx="15" ry="7" fill="#fff" opacity=".4" transform="rotate(-30 37 29)"/>'),
        calendar: svg('<rect x="14" y="24" width="72" height="68" rx="12" fill="#94a3b8"/><rect x="14" y="16" width="72" height="68" rx="12" fill="#fff"/><path d="M14 28a12 12 0 0 1 12-12h48a12 12 0 0 1 12 12v14H14z" fill="url(#gK)"/><rect x="30" y="8" width="6" height="16" rx="3" fill="#475569"/><rect x="64" y="8" width="6" height="16" rx="3" fill="#475569"/><g fill="#5b8def"><circle cx="32" cy="56" r="5"/><circle cx="50" cy="56" r="5"/><circle cx="68" cy="56" r="5"/><circle cx="32" cy="72" r="5"/><circle cx="50" cy="72" r="5"/></g>'),
        check: svg('<rect x="14" y="22" width="72" height="72" rx="20" fill="#15803d"/><rect x="14" y="14" width="72" height="72" rx="20" fill="url(#gG)"/><rect x="20" y="19" width="60" height="22" rx="11" fill="#fff" opacity=".28"/><path d="M33 51l12 12 22-26" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
        bell: svg('<path ' + BELL + ' fill="#b45309" transform="translate(0 7)"/><circle cx="50" cy="90" r="9" fill="#b45309"/><path ' + BELL + ' fill="url(#gT)"/><circle cx="50" cy="84" r="9" fill="#f59e0b"/><ellipse cx="37" cy="38" rx="7" ry="15" fill="#fff" opacity=".45" transform="rotate(12 37 38)"/>'),
        star: svg('<path ' + STAR + ' fill="#b45309" transform="translate(0 7)"/><path ' + STAR + ' fill="url(#gT)"/><path ' + STAR + ' fill="#fff" opacity=".35" transform="translate(50 46) scale(.5) translate(-50 -46)"/>'),
        coin: svg('<circle cx="50" cy="58" r="36" fill="#b45309"/><circle cx="50" cy="50" r="36" fill="url(#gT)"/><circle cx="50" cy="50" r="27" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/><text x="50" y="61" font-size="32" font-weight="800" fill="#92400e" text-anchor="middle" font-family="Arial">Q</text><ellipse cx="37" cy="29" rx="16" ry="7" fill="#fff" opacity=".45" transform="rotate(-30 37 29)"/>')
    };

    function addDefs() {

        var d = document.createElement("div");

        d.innerHTML =
            '<svg width="0" height="0" style="position:absolute"><defs>' +
            '<linearGradient id="gT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>' +
            '<linearGradient id="gC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#0d9488"/></linearGradient>' +
            '<linearGradient id="gK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a9a"/><stop offset="1" stop-color="#ef4444"/></linearGradient>' +
            '<linearGradient id="gG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient>' +
            '</defs></svg>';

        document.body.appendChild(d.firstChild);
    }

    function make3D(el, kind, index) {

        el.dataset.th = "1";
        el.innerHTML = SV[kind];

        var s = el.firstChild;
        s.classList.add("th-stk");
        s.style.animationDelay = (-index * 1.3) + "s";
    }

    // keeps stickers away from page titles and the navbar
    var SPOTS = [["2%", "46%"], ["91%", "20%"], ["5%", "80%"], ["88%", "66%"], ["47%", "90%"], ["76%", "7%"], ["35%", "92%"], ["95%", "44%"]];

    function upgradeStickers() {

        var kinds = ["ticket", "clock", "calendar", "check", "bell", "star"];

        document.querySelectorAll(".fx-sticker").forEach(function (el, i) {

            if (el.dataset.th) return;

            el.style.width = (58 + (i * 13) % 28) + "px";

            var spot = SPOTS[i % SPOTS.length];
            el.style.left = spot[0];
            el.style.top = spot[1];

            make3D(el, el.dataset.kind || kinds[i % kinds.length], i);
        });
    }

    function addExtraStickers() {

        var layer = document.querySelector(".fx-bg");

        if (!layer) return;

        [["coin", "0", "0"], ["coin", "0", "0"]].forEach(function (e, i) {

            var el = document.createElement("span");
            el.className = "fx-sticker";
            el.dataset.kind = e[0];
            el.style.left = e[1];
            el.style.top = e[2];
            el.style.animationDelay = (i * 1.7) + "s";
            layer.appendChild(el);
        });
    }

    function decorate() {

        document.querySelectorAll(".queue-main").forEach(function (q) {

            if (q.querySelector(".th-corner")) return;

            [["ticket", "l"], ["clock", "r"]].forEach(function (c, i) {

                var el = document.createElement("span");
                el.className = "th-corner " + c[1];
                q.appendChild(el);
                make3D(el, c[0], i + 2);
            });
        });

        document.querySelectorAll(".empty-icon").forEach(function (e) {

            if (e.dataset.th) return;

            e.dataset.th = "1";
            e.innerHTML = "<span>" + SV.ticket + "</span>";
            e.firstChild.firstChild.classList.add("th-stk");
        });
    }


    /* ---------- THREE.JS: FLOATING GLOSSY 3D SHAPES ---------- */

    var PALETTES = {
        auth: [0x2fb5a0, 0x5b8def, 0xa78bfa],
        dashboard: [0x2fb5a0, 0x5b8def, 0xfbbf24],
        booking: [0x5b8def, 0xa78bfa, 0x2fb5a0],
        queue: [0x2fb5a0, 0xfbbf24, 0x5b8def],
        history: [0xa78bfa, 0x5b8def, 0x2fb5a0],
        profile: [0xf472b6, 0xa78bfa, 0x5b8def],
        staff: [0x5b8def, 0x2fb5a0, 0xa78bfa],
        admin: [0xa78bfa, 0x2fb5a0, 0xfbbf24]
    };

    function startScene() {

        var T = window.THREE;

        if (!T) return;

        var canvas = document.createElement("canvas");
        canvas.className = "th-3d";
        document.body.appendChild(canvas);

        var renderer;

        try {
            renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        } catch (e) {
            canvas.remove();
            return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        var cols = window.__thCols();
        var scene = new T.Scene();
        var cam = new T.PerspectiveCamera(45, 1, 0.1, 100);
        cam.position.z = 16;

        scene.add(new T.AmbientLight(0xffffff, 0.75));

        var sun = new T.DirectionalLight(0xffffff, 0.9);
        sun.position.set(6, 9, 10);
        scene.add(sun);

        var glow = new T.PointLight(cols[1], 1.1, 60);
        glow.position.set(-9, -5, 7);
        scene.add(glow);

        var geos = [
            new T.TorusGeometry(1, 0.38, 24, 64),
            new T.IcosahedronGeometry(1.1, 0),
            new T.OctahedronGeometry(1.2),
            new T.SphereGeometry(0.85, 32, 32),
            new T.BoxGeometry(1.4, 1.4, 1.4),
            new T.TorusKnotGeometry(0.7, 0.25, 96, 16),
            new T.ConeGeometry(0.9, 1.6, 32)
        ];

        var count = window.innerWidth < 700 ? 7 : 14;
        var items = [];

        for (var i = 0; i < count; i++) {

            var mat = new T.MeshPhysicalMaterial({
                color: cols[i % cols.length], roughness: 0.22, metalness: 0.1,
                clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.92
            });

            var m = new T.Mesh(geos[i % geos.length], mat);
            var side = i % 2 ? 1 : -1;

            m.position.set(side * (4 + Math.random() * 9), (Math.random() - 0.5) * 14, -7 + Math.random() * 8);
            m.scale.setScalar(0.7 + Math.random() * 0.9);
            m.rotation.set(Math.random() * 3, Math.random() * 3, 0);

            m.userData = {
                rx: (Math.random() - 0.5) * 0.012,
                ry: (Math.random() - 0.5) * 0.016,
                ph: Math.random() * 6.28,
                amp: 0.3 + Math.random() * 0.5,
                y0: m.position.y
            };

            scene.add(m);
            items.push(m);
        }

        window.__thRecolor = function () {
            cols = window.__thCols();
            items.forEach(function (m, i) { m.material.color.setHex(cols[i % cols.length]); });
            glow.color.setHex(cols[1]);
        };

        var mx = 0, my = 0, t = 0;

        window.addEventListener("mousemove", function (e) {
            mx = e.clientX / window.innerWidth - 0.5;
            my = e.clientY / window.innerHeight - 0.5;
        });

        function resize() {
            var w = window.innerWidth, h = window.innerHeight;
            renderer.setSize(w, h, false);
            cam.aspect = w / h;
            cam.updateProjectionMatrix();
        }

        resize();
        window.addEventListener("resize", resize);

        (function loop() {

            requestAnimationFrame(loop);

            t += 0.01;

            items.forEach(function (m) {
                var u = m.userData;
                m.rotation.x += u.rx;
                m.rotation.y += u.ry;
                m.position.y = u.y0 + Math.sin(t + u.ph) * u.amp;
            });

            cam.position.x += (mx * 3 - cam.position.x) * 0.03;
            cam.position.y += (-my * 2 - cam.position.y) * 0.03;
            cam.lookAt(0, 0, 0);

            scene.position.y = (window.scrollY || 0) * 0.004;

            renderer.render(scene, cam);
        })();
    }

    function loadScene() {

        if (reduce) return;

        var s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        s.onload = startScene;
        document.head.appendChild(s);
    }


    /* ---------- START ---------- */

    document.addEventListener("DOMContentLoaded", function () {

        addDefs();
        addExtraStickers();
        upgradeStickers();
        decorate();

        var floor = document.createElement("div");
        floor.className = "th-floor";
        document.body.appendChild(floor);

        var queued = false;

        new MutationObserver(function () {
            if (queued) return;
            queued = true;
            requestAnimationFrame(function () { queued = false; decorate(); });
        }).observe(document.body, { childList: true, subtree: true });

        loadScene();
    });
})();