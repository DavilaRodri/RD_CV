/* rodrigodavila.com · modo juego
   Un mapa de mundo nocturno: cada parada es un nivel (experiencia, apps, webs,
   taller, asistente y contacto). Al entrar en un nivel se abre su pantalla con
   el mismo contenido de la versión clásica, que se mueve al panel y vuelve a
   su sitio al cerrarlo. La versión clásica sigue siendo la página en sí. */

(function () {
    'use strict';

    var raiz = document.documentElement;
    var NS = 'http://www.w3.org/2000/svg';
    var W = 3800, H = 1000;

    function guardado(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    /* ---------- Niveles ---------- */
    var NIVELES = [
        { id: 'inicio', x: 220, y: 640, tipo: 'casa', es: 'Inicio', en: 'Home', sub: 'Rodrigo Dávila', piezas: ['#inicio .portada-texto'] },
        { id: 'accenture-2017', x: 470, y: 470, tipo: 'oficina', alto: 120, es: 'Accenture', en: 'Accenture', sub: '2017 – 2018', piezas: ['.puestos > li:nth-child(4)'] },
        { id: 'altia', x: 720, y: 650, tipo: 'oficina', alto: 90, es: 'Altia', en: 'Altia', sub: '2018 – 2021', piezas: ['.puestos > li:nth-child(3)'] },
        { id: 'deloitte', x: 980, y: 470, tipo: 'oficina', alto: 150, es: 'Deloitte', en: 'Deloitte', sub: '2021 – 2025', piezas: ['.puestos > li:nth-child(2)'] },
        { id: 'accenture', x: 1235, y: 630, tipo: 'agentes', es: 'Accenture · BBVA', en: 'Accenture · BBVA', sub: { es: '2025 – hoy', en: '2025 – now' }, piezas: ['.puestos > li:nth-child(1)', '.experiencia-lado .clientes'] },
        { id: 'habilidades', x: 1430, y: 450, tipo: 'templo', es: 'Lo que sé hacer', en: 'What I can do', sub: { es: 'Habilidades', en: 'Skills' }, piezas: ['#capacidades .mapa', '.formacion'] },
        { id: 'urbapadel', x: 1720, y: 630, tipo: 'app', icono: 'urbapadel', es: 'UrbaPadel', en: 'UrbaPadel', sub: 'App', piezas: ['#urbapadel'] },
        { id: 'lullcam', x: 1930, y: 450, tipo: 'app', icono: 'lullcam', es: 'LullCam', en: 'LullCam', sub: 'App', piezas: ['#lullcam'] },
        { id: 'tumenu', x: 2140, y: 630, tipo: 'app', icono: 'tumenu', es: 'TuMenu', en: 'TuMenu', sub: 'App', piezas: ['#tumenu'] },
        { id: 'godafly', x: 2345, y: 450, tipo: 'app', icono: 'godafly', es: 'GodaFly', en: 'GodaFly', sub: 'App', piezas: ['#godafly'] },
        { id: 'mifilmoteca', x: 2540, y: 630, tipo: 'app', icono: 'mifilmoteca', es: 'Mi Filmoteca', en: 'Mi Filmoteca', sub: 'App', piezas: ['#mifilmoteca'] },
        { id: 'webs', x: 2830, y: 470, tipo: 'cartel', es: 'Webs', en: 'Websites', sub: { es: 'A medida', en: 'Custom' }, piezas: ['#webs .webs-rejilla'] },
        { id: 'taller', x: 3010, y: 650, tipo: 'taller', es: 'El taller', en: 'Workbench', sub: 'Zapeo · RunClap', piezas: ['#zapeo', '#runclap'] },
        { id: 'chat', x: 3330, y: 460, tipo: 'faro', es: 'Pregúntame', en: 'Ask me', sub: { es: 'Mi IA', en: 'My AI' }, piezas: ['#asistente .chat'] },
        { id: 'contacto', x: 3570, y: 640, tipo: 'buzon', es: 'Contacto', en: 'Contact', sub: '¿Hablamos?', piezas: ['#contacto .contacto-caja'] }
    ];
    var ISLAS = [
        { cx: 830, cy: 560, rx: 700, ry: 255, s: 1 },
        { cx: 2130, cy: 545, rx: 500, ry: 245, s: 2 },
        { cx: 2920, cy: 560, rx: 225, ry: 250, s: 3 },
        { cx: 3450, cy: 550, rx: 245, ry: 245, s: 4 }
    ];

    /* ---------- Utilidades de dibujo ---------- */
    function azar(semilla) {
        var s = semilla;
        return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    }
    function catmull(p0, p1, p2, p3) {
        return [p1,
            { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
            { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
            p2];
    }
    function bezier(c, t) {
        var u = 1 - t;
        return {
            x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x,
            y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y
        };
    }
    function f(n) { return Math.round(n * 10) / 10; }

    // Contorno orgánico y cerrado de una isla.
    function contornoIsla(isla) {
        var r = azar(isla.s * 977), pts = [], n = 22;
        for (var i = 0; i < n; i++) {
            var a = i / n * Math.PI * 2, k = 0.9 + r() * 0.14;
            pts.push({ x: isla.cx + Math.cos(a) * isla.rx * k, y: isla.cy + Math.sin(a) * isla.ry * k });
        }
        var d = 'M' + f(pts[0].x) + ' ' + f(pts[0].y);
        for (i = 0; i < n; i++) {
            var c = catmull(pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]);
            d += 'C' + f(c[1].x) + ' ' + f(c[1].y) + ' ' + f(c[2].x) + ' ' + f(c[2].y) + ' ' + f(c[3].x) + ' ' + f(c[3].y);
        }
        return d + 'Z';
    }
    function dentroDeIsla(x, y, margen) {
        return ISLAS.some(function (i) {
            var dx = (x - i.cx) / (i.rx * 0.88 - margen), dy = (y - i.cy) / (i.ry * 0.88 - margen);
            return dx * dx + dy * dy < 1;
        });
    }

    // Camino que une los niveles, con una tabla de puntos para andar por él.
    var curvas = [], muestras = [], indiceNivel = [];
    (function () {
        var p = NIVELES;
        for (var i = 0; i < p.length - 1; i++) {
            curvas.push(catmull(p[Math.max(i - 1, 0)], p[i], p[i + 1], p[Math.min(i + 2, p.length - 1)]));
        }
        var dist = 0, prev = null;
        curvas.forEach(function (c, i) {
            for (var j = 0; j <= 40; j++) {
                if (i > 0 && j === 0) continue;
                var q = bezier(c, j / 40);
                if (prev) dist += Math.hypot(q.x - prev.x, q.y - prev.y);
                if (j === 0) indiceNivel[i] = muestras.length;
                muestras.push({ x: q.x, y: q.y, d: dist });
                prev = q;
            }
            indiceNivel[i + 1] = muestras.length - 1;
        });
    })();
    function puntoEn(d) {
        var lo = 0, hi = muestras.length - 1;
        if (d <= 0) return muestras[0];
        if (d >= muestras[hi].d) return muestras[hi];
        while (hi - lo > 1) { var m = (lo + hi) >> 1; if (muestras[m].d < d) lo = m; else hi = m; }
        var a = muestras[lo], b = muestras[hi], t = (d - a.d) / (b.d - a.d || 1);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    function distNivel(i) { return muestras[indiceNivel[i]].d; }
    function cercaDelCamino(x, y, r) {
        for (var i = 0; i < muestras.length; i += 3) {
            if (Math.abs(muestras[i].x - x) < r && Math.abs(muestras[i].y - y) < r) return true;
        }
        return false;
    }

    /* ---------- Edificios ---------- */
    function arbol(x, y, s) {
        return '<g class="arbol" transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(s) + ')">' +
            '<ellipse cx="0" cy="2" rx="16" ry="5" class="sombra"/>' +
            '<rect x="-3" y="-16" width="6" height="18" rx="2" class="tronco"/>' +
            '<circle cx="0" cy="-30" r="18" class="copa"/>' +
            '<circle cx="-6" cy="-35" r="9" class="copa-luz"/></g>';
    }
    function ventanas(x0, y0, cols, filas, r) {
        var s = '';
        for (var c = 0; c < cols; c++) for (var k = 0; k < filas; k++) {
            s += '<rect x="' + (x0 + c * 16) + '" y="' + (y0 + k * 20) + '" width="9" height="11" rx="1.5" class="' + (r() > 0.35 ? 'luz' : 'apagada') + '"/>';
        }
        return s;
    }
    var EDIFICIOS = {
        casa: function () {
            return '<rect x="-40" y="-92" width="80" height="62" rx="4" class="muro"/>' +
                '<path d="M-50 -88L0 -132L50 -88Z" class="tejado"/>' +
                '<rect x="-10" y="-58" width="20" height="28" rx="3" class="puerta"/>' +
                '<rect x="-31" y="-78" width="14" height="13" rx="2" class="luz"/><rect x="17" y="-78" width="14" height="13" rx="2" class="luz"/>' +
                '<rect x="22" y="-126" width="10" height="22" class="muro"/>';
        },
        oficina: function (n, r) {
            var h = n.alto;
            return '<rect x="-36" y="' + (-30 - h) + '" width="72" height="' + h + '" rx="4" class="edificio"/>' +
                '<rect x="-36" y="' + (-30 - h) + '" width="72" height="10" rx="4" class="edificio-alto"/>' +
                ventanas(-27, -12 - h, 4, Math.floor((h - 14) / 20), r) +
                '<rect x="-1.5" y="' + (-52 - h) + '" width="3" height="22" class="antena"/><circle cx="0" cy="' + (-54 - h) + '" r="4" class="baliza"/>';
        },
        agentes: function (n, r) {
            var s = '<rect x="-46" y="-210" width="92" height="180" rx="6" class="edificio"/>' +
                '<rect x="-46" y="-210" width="92" height="12" rx="6" class="edificio-alto"/>' + ventanas(-35, -190, 5, 7, r) +
                '<g class="orbita">';
            for (var i = 0; i < 6; i++) {
                var a = i / 6 * Math.PI * 2;
                s += '<line x1="0" y1="-262" x2="' + f(Math.cos(a) * 56) + '" y2="' + f(-262 + Math.sin(a) * 26) + '" class="enlace"/>' +
                    '<circle cx="' + f(Math.cos(a) * 56) + '" cy="' + f(-262 + Math.sin(a) * 26) + '" r="7" class="agente" style="animation-delay:' + (i * 0.35) + 's"/>';
            }
            return s + '</g><circle cx="0" cy="-262" r="13" class="orquestador"/><rect x="-2" y="-249" width="4" height="40" class="antena"/>';
        },
        templo: function () {
            var s = '<rect x="-62" y="-44" width="124" height="14" rx="3" class="edificio-alto"/><rect x="-54" y="-56" width="108" height="14" rx="3" class="edificio"/>';
            for (var i = 0; i < 4; i++) s += '<rect x="' + (-44 + i * 26) + '" y="-122" width="12" height="68" rx="3" class="columna"/>';
            return s + '<rect x="-58" y="-132" width="116" height="12" rx="3" class="edificio"/><path d="M-62 -132L0 -168L62 -132Z" class="tejado"/>' +
                '<circle cx="0" cy="-146" r="7" class="baliza"/>';
        },
        app: function (n) {
            return '<rect x="-48" y="-50" width="96" height="22" rx="8" class="edificio"/><rect x="-40" y="-60" width="80" height="14" rx="6" class="edificio-alto"/>' +
                '<g class="icono-flota"><image href="img/apps/' + n.icono + '-icono.webp" x="-40" y="-150" width="80" height="80" clip-path="url(#j-redondo)"/></g>';
        },
        cartel: function () {
            return '<rect x="-52" y="-70" width="6" height="42" class="antena"/><rect x="46" y="-70" width="6" height="42" class="antena"/>' +
                '<rect x="-76" y="-182" width="152" height="116" rx="10" class="edificio"/>' +
                '<rect x="-70" y="-176" width="140" height="16" rx="4" class="edificio-alto"/>' +
                '<circle cx="-61" cy="-168" r="3" class="baliza"/><circle cx="-51" cy="-168" r="3" class="luz"/><circle cx="-41" cy="-168" r="3" class="ok"/>' +
                '<image href="img/webs/urbapadel.webp" x="-70" y="-158" width="140" height="86" preserveAspectRatio="xMidYMin slice"/>';
        },
        taller: function () {
            var dientes = '';
            for (var i = 0; i < 8; i++) dientes += '<rect x="-5" y="-30" width="10" height="12" rx="2" transform="rotate(' + (i * 45) + ')"/>';
            return '<rect x="-56" y="-100" width="88" height="70" rx="4" class="muro"/><path d="M-64 -96L-12 -132L40 -96Z" class="tejado"/>' +
                '<rect x="-40" y="-72" width="40" height="42" rx="3" class="puerta"/><rect x="-36" y="-68" width="32" height="10" class="luz"/>' +
                '<g transform="translate(56 -104)"><g class="engranaje">' + dientes + '<circle r="22"/><circle r="8" class="hueco"/></g></g>';
        },
        faro: function () {
            return '<path d="M-30 -30L-20 -210H20L30 -30Z" class="faro"/><path d="M-26 -90H26L24 -120H-24Z" class="faro-raya"/><path d="M-22 -150H22L21 -178H-21Z" class="faro-raya"/>' +
                '<rect x="-26" y="-236" width="52" height="28" rx="6" class="edificio"/><circle cx="0" cy="-222" r="10" class="luz"/>' +
                '<path d="M-24 -236L0 -260L24 -236Z" class="tejado"/>' +
                '<g class="bocadillo"><rect x="34" y="-316" width="96" height="58" rx="18" class="globo"/><path d="M48 -262L40 -244L66 -260Z" class="globo"/>' +
                '<circle cx="60" cy="-287" r="6" class="punto-chat"/><circle cx="82" cy="-287" r="6" class="punto-chat"/><circle cx="104" cy="-287" r="6" class="punto-chat"/></g>';
        },
        buzon: function () {
            return '<rect x="-5" y="-80" width="10" height="50" class="antena"/>' +
                '<path d="M-34 -78V-118A24 24 0 0 1 -10 -142H10A24 24 0 0 1 34 -118V-78Z" class="buzon"/>' +
                '<rect x="-20" y="-112" width="40" height="8" rx="4" class="hueco"/>' +
                '<rect x="34" y="-136" width="5" height="40" class="antena"/><path d="M39 -136H66L58 -126L66 -116H39Z" class="bandera"/>';
        }
    };

    function heroe() {
        return '<g id="j-heroe"><ellipse cx="0" cy="0" rx="17" ry="6" class="sombra"/>' +
            '<g class="cuerpo-heroe">' +
            '<rect class="pierna p1" x="-8" y="-17" width="6.5" height="17" rx="3"/><rect class="pierna p2" x="1.5" y="-17" width="6.5" height="17" rx="3"/>' +
            '<rect x="-17" y="-40" width="8" height="20" rx="3" class="mochila"/>' +
            '<rect x="-12" y="-44" width="24" height="29" rx="9" class="camiseta"/>' +
            '<circle cx="0" cy="-56" r="13" class="cara"/>' +
            '<path d="M-13.5 -57A13.5 13.5 0 0 1 13.5 -57Q8 -63 2 -61Q-5 -66 -13.5 -57Z" class="pelo"/>' +
            '<circle cx="6" cy="-55" r="2" class="ojo"/></g></g>';
    }

    /* ---------- Construcción del mundo ---------- */
    function construirMundo() {
        var r = azar(42), s = '';
        s += '<defs><clipPath id="j-redondo" clipPathUnits="objectBoundingBox"><rect width="1" height="1" rx=".23" ry=".23"/></clipPath></defs>';
        s += '<rect x="-3000" y="-3000" width="' + (W + 6000) + '" height="' + (H + 6000) + '" class="mar"/>';
        // Olas
        s += '<g class="olas">';
        for (var i = 0; i < 160; i++) {
            var x = r() * (W + 1200) - 600, y = r() * (H + 600) - 300;
            if (dentroDeIsla(x, y, -60)) continue;
            s += '<path d="M' + f(x) + ' ' + f(y) + 'q9 -7 18 0t18 0" class="ola"/>';
        }
        s += '</g>';
        // Islas: orilla, arena y hierba
        ISLAS.forEach(function (isla) {
            var d = contornoIsla(isla);
            s += '<path d="' + d + '" class="orilla" transform="translate(0 14)"/>';
            s += '<path d="' + d + '" class="arena"/>';
            s += '<path d="' + d + '" class="hierba" transform="translate(' + isla.cx + ' ' + isla.cy + ') scale(.93) translate(' + (-isla.cx) + ' ' + (-isla.cy) + ')"/>';
        });
        // Camino: base ancha (puentes sobre el agua) y trazo discontinuo encima
        var d = 'M' + f(NIVELES[0].x) + ' ' + f(NIVELES[0].y);
        curvas.forEach(function (c) { d += 'C' + f(c[1].x) + ' ' + f(c[1].y) + ' ' + f(c[2].x) + ' ' + f(c[2].y) + ' ' + f(c[3].x) + ' ' + f(c[3].y); });
        s += '<path d="' + d + '" class="camino-base"/><path d="' + d + '" class="camino"/>';
        // Árboles (por filas, para que los de delante tapen a los de detrás)
        var arboles = [];
        for (i = 0; i < 260 && arboles.length < 70; i++) {
            var ax = r() * W, ay = r() * H;
            if (!dentroDeIsla(ax, ay, 30)) continue;
            if (cercaDelCamino(ax, ay, 46)) continue;
            if (NIVELES.some(function (n) { return Math.abs(n.x - ax) < 130 && ay > n.y - 240 && ay < n.y + 100; })) continue;
            arboles.push({ x: ax, y: ay, s: 0.8 + r() * 0.5 });
        }
        var piezas = arboles.map(function (a) { return { y: a.y, html: arbol(a.x, a.y, a.s) }; });
        // Niveles (las etiquetas van en una capa encima de todo)
        var etiquetas = '';
        NIVELES.forEach(function (n, i) {
            var g = '<g class="nivel-mapa" data-nivel="' + i + '" transform="translate(' + n.x + ' ' + n.y + ')" tabindex="-1">' +
                '<ellipse cx="0" cy="0" rx="58" ry="20" class="plataforma"/>' +
                '<ellipse cx="0" cy="0" rx="58" ry="20" class="anillo"/>' +
                EDIFICIOS[n.tipo](n, azar(i * 31 + 7)) +
                '<rect x="-80" y="-260" width="160" height="330" class="zona"/></g>';
            piezas.push({ y: n.y, html: g });
            etiquetas += '<g class="nivel-mapa nivel-etiqueta" data-nivel="' + i + '" transform="translate(' + n.x + ' ' + (n.y + 46) + ')"><g class="etiqueta"><rect class="etiqueta-fondo" x="-60" y="-17" width="120" height="34" rx="10"/>' +
                '<text class="etiqueta-texto" y="1" lang="es">' + n.es + '</text><text class="etiqueta-texto" y="1" lang="en">' + n.en + '</text>' +
                '<g class="visto-marca" transform="translate(60 -17)"><circle r="11"/><path d="M-5 0l3.5 3.5L5.5 -4"/></g></g></g>';
        });
        piezas.sort(function (a, b) { return a.y - b.y; });
        s += piezas.map(function (p) { return p.html; }).join('');
        s += heroe() + etiquetas;
        // Nubes
        s += '<g class="nubes">';
        for (i = 0; i < 9; i++) {
            var nx = r() * W, ny = r() * H, ns = 0.7 + r() * 0.9;
            s += '<g class="nube" style="animation-delay:-' + f(r() * 60) + 's" transform="translate(' + f(nx) + ' ' + f(ny) + ') scale(' + f(ns) + ')">' +
                '<ellipse cx="0" cy="0" rx="70" ry="24"/><ellipse cx="-30" cy="-14" rx="34" ry="22"/><ellipse cx="22" cy="-18" rx="40" ry="26"/></g>';
        }
        return s + '</g>';
    }

    /* ---------- Interfaz ---------- */
    var ICONOS = {
        izq: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        der: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        cerrar: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
        estrella: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/></svg>'
    };
    function sub(n) { return typeof n.sub === 'string' ? { es: n.sub, en: n.sub } : n.sub; }

    var juego, capa, camara, heroeEl, panel, cuerpoPanel, devueltas = [];
    var actual = 0, destino = 0, posDist = 0, abiertoNivel = -1, abrirAlLlegar = false;
    var vistos = {};
    try { vistos = JSON.parse(guardado('niveles-vistos') || '{}') || {}; } catch (e) { vistos = {}; }
    var cam = { x: NIVELES[0].x, y: NIVELES[0].y, s: 1 };
    var ultimo = 0, enMarcha = false;
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function crear() {
        juego = document.createElement('div');
        juego.className = 'juego';
        juego.id = 'juego';
        juego.setAttribute('role', 'application');
        juego.setAttribute('aria-label', 'Rodrigo Dávila · modo juego');
        juego.innerHTML =
            '<svg class="juego-mundo" aria-hidden="true"><g class="juego-camara">' + construirMundo() + '</g></svg>' +
            '<div class="hud hud-arriba">' +
                '<p class="hud-marca"><span class="marca-sello" aria-hidden="true">RD</span><span>Rodrigo Dávila</span></p>' +
                '<div class="hud-botones">' +
                    '<p class="hud-estrellas" aria-live="polite">' + ICONOS.estrella + '<span data-j-cuenta></span></p>' +
                    '<button type="button" class="hud-boton" data-j-idioma><span lang="es">EN</span><span lang="en">ES</span></button>' +
                    '<button type="button" class="hud-boton hud-clasica" data-j-clasica><span lang="es">Versión clásica</span><span lang="en">Classic version</span></button>' +
                '</div>' +
            '</div>' +
            '<div class="hud hud-abajo">' +
                '<button type="button" class="hud-paso" data-j-paso="-1" aria-label="Nivel anterior">' + ICONOS.izq + '</button>' +
                '<button type="button" class="hud-entrar" data-j-entrar><span class="hud-nivel" data-j-num></span><strong data-j-nombre></strong><span class="hud-accion"><span lang="es">Entrar</span><span lang="en">Enter</span></span></button>' +
                '<button type="button" class="hud-paso" data-j-paso="1" aria-label="Nivel siguiente">' + ICONOS.der + '</button>' +
            '</div>' +
            '<div class="juego-titulo" data-j-titulo>' +
                '<div class="titulo-caja">' +
                    '<p class="titulo-pixel"><span lang="es">Portfolio · modo juego</span><span lang="en">Portfolio · game mode</span></p>' +
                    '<h2>Rodrigo Dávila</h2>' +
                    '<p class="titulo-lead"><span lang="es">Manager de IA Generativa y creador de apps. Recorre el mapa: cada parada es un nivel de mi carrera.</span><span lang="en">Generative AI Manager and app maker. Walk the map: every stop is a level of my career.</span></p>' +
                    '<div class="titulo-botones"><button type="button" class="boton boton-lleno" data-j-empezar><span lang="es">Empezar</span><span lang="en">Start</span></button>' +
                    '<button type="button" class="boton" data-j-clasica><span lang="es">Ver versión clásica</span><span lang="en">See classic version</span></button></div>' +
                    '<p class="titulo-ayuda"><span lang="es">Toca un nivel o usa las flechas y Enter.</span><span lang="en">Tap a level or use the arrow keys and Enter.</span></p>' +
                '</div>' +
            '</div>' +
            '<div class="juego-panel" role="dialog" aria-modal="true" aria-labelledby="j-panel-titulo" hidden>' +
                '<div class="panel-caja">' +
                    '<div class="panel-cabeza">' +
                        '<div><p class="panel-num" data-j-panel-num></p><h2 id="j-panel-titulo" tabindex="-1" data-j-panel-titulo></h2></div>' +
                        '<button type="button" class="panel-cerrar" data-j-cerrar><span lang="es">Volver al mapa</span><span lang="en">Back to map</span>' + ICONOS.cerrar + '</button>' +
                    '</div>' +
                    '<div class="panel-cuerpo" data-j-cuerpo></div>' +
                    '<div class="panel-pie">' +
                        '<button type="button" class="boton" data-j-panel-paso="-1">' + ICONOS.izq + '<span lang="es">Nivel anterior</span><span lang="en">Previous level</span></button>' +
                        '<button type="button" class="boton boton-lleno" data-j-panel-paso="1"><span lang="es">Siguiente nivel</span><span lang="en">Next level</span>' + ICONOS.der + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(juego);
        capa = juego.querySelector('.juego-mundo');
        camara = juego.querySelector('.juego-camara');
        heroeEl = juego.querySelector('#j-heroe');
        panel = juego.querySelector('.juego-panel');
        cuerpoPanel = juego.querySelector('[data-j-cuerpo]');

        juego.querySelectorAll('[data-nivel]').forEach(function (g) {
            g.addEventListener('click', function () { irA(Number(g.getAttribute('data-nivel')), true); });
        });
        juego.querySelectorAll('[data-j-paso]').forEach(function (b) {
            b.addEventListener('click', function () { mover(Number(b.getAttribute('data-j-paso'))); });
        });
        juego.querySelector('[data-j-entrar]').addEventListener('click', function () {
            if (destino !== actual) return;
            abrir(actual);
        });
        juego.querySelectorAll('[data-j-panel-paso]').forEach(function (b) {
            b.addEventListener('click', function () {
                var n = abiertoNivel + Number(b.getAttribute('data-j-panel-paso'));
                if (n < 0 || n >= NIVELES.length) { cerrar(); return; }
                cerrar();
                irA(n, true);
            });
        });
        juego.querySelector('[data-j-cerrar]').addEventListener('click', cerrar);
        // Los enlaces internos del contenido llevan al nivel que les toca.
        cuerpoPanel.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute('href').slice(1);
            var n = NIVELES.findIndex(function (x) { return x.id === id || x.piezas.some(function (p) { return p.indexOf('#' + id) === 0; }); });
            if (n < 0) return;
            e.preventDefault();
            cerrar();
            irA(n, true);
        });
        juego.querySelectorAll('[data-j-clasica]').forEach(function (b) { b.addEventListener('click', salir); });
        juego.querySelector('[data-j-empezar]').addEventListener('click', empezar);
        juego.querySelector('[data-j-idioma]').addEventListener('click', function () {
            var b = document.querySelector('.barra [data-cambiar-idioma]');
            if (b) b.click();
            pintarHud();
        });
        document.addEventListener('keydown', teclas);
        window.addEventListener('resize', encuadrar);
        new MutationObserver(function () { medirEtiquetas(); pintarHud(); }).observe(raiz, { attributes: true, attributeFilter: ['data-lang'] });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirEtiquetas);
        medirEtiquetas();
    }

    function medirEtiquetas() {
        if (!juego) return;
        juego.querySelectorAll('.etiqueta').forEach(function (g) {
            var t = g.querySelector('.etiqueta-texto[lang="' + (raiz.getAttribute('data-lang') === 'en' ? 'en' : 'es') + '"]');
            var w = 0;
            try { w = t.getComputedTextLength(); } catch (e) {}
            if (!w) return;
            var ancho = w + 30;
            var fondo = g.querySelector('.etiqueta-fondo');
            fondo.setAttribute('x', f(-ancho / 2));
            fondo.setAttribute('width', f(ancho));
            g.querySelector('.visto-marca').setAttribute('transform', 'translate(' + f(ancho / 2) + ' -17)');
        });
    }

    function pintarHud() {
        var l = raiz.getAttribute('data-lang') === 'en' ? 'en' : 'es';
        var n = NIVELES[destino];
        juego.querySelector('[data-j-num]').textContent = (l === 'es' ? 'Nivel ' : 'Level ') + (destino + 1) + ' / ' + NIVELES.length;
        juego.querySelector('[data-j-nombre]').textContent = n[l];
        var total = Object.keys(vistos).length;
        juego.querySelector('[data-j-cuenta]').textContent = total + ' / ' + NIVELES.length;
        juego.querySelectorAll('[data-j-paso]').forEach(function (b) {
            var d = Number(b.getAttribute('data-j-paso'));
            b.disabled = destino + d < 0 || destino + d >= NIVELES.length;
            b.setAttribute('aria-label', d < 0 ? (l === 'es' ? 'Nivel anterior' : 'Previous level') : (l === 'es' ? 'Nivel siguiente' : 'Next level'));
        });
        juego.querySelectorAll('[data-nivel]').forEach(function (g) {
            var i = Number(g.getAttribute('data-nivel'));
            g.classList.toggle('activo', i === destino);
            g.classList.toggle('visitado', !!vistos[NIVELES[i].id]);
        });
    }

    /* ---------- Movimiento y cámara ---------- */
    function irA(i, entrar) {
        if (i < 0 || i >= NIVELES.length) return;
        destino = i;
        abrirAlLlegar = !!entrar;
        if (reducido) { posDist = distNivel(i); actual = i; }
        pintarHud();
        arrancar();
        if (reducido && entrar) abrir(i);
    }
    function mover(d) { if (abiertoNivel < 0) irA(destino + d, false); }

    function arrancar() {
        if (enMarcha) return;
        enMarcha = true;
        ultimo = performance.now();
        requestAnimationFrame(paso);
    }
    function paso(t) {
        var dt = Math.min(0.05, (t - ultimo) / 1000);
        ultimo = t;
        var objetivo = distNivel(destino);
        var falta = objetivo - posDist;
        var andando = Math.abs(falta) > 0.5;
        if (andando) {
            var v = Math.min(Math.abs(falta), Math.max(380, Math.abs(falta) * 2.2) * dt);
            posDist += Math.sign(falta) * v;
            heroeEl.setAttribute('data-dir', falta < 0 ? 'izq' : 'der');
        } else {
            posDist = objetivo;
            if (actual !== destino) {
                actual = destino;
                if (abrirAlLlegar) { abrirAlLlegar = false; abrir(actual); }
            }
        }
        heroeEl.classList.toggle('andando', andando);
        var p = puntoEn(posDist);
        heroeEl.setAttribute('transform', 'translate(' + f(p.x) + ' ' + f(p.y) + ')' + (heroeEl.getAttribute('data-dir') === 'izq' ? ' scale(-1.5 1.5)' : ' scale(1.5)'));
        // La cámara sigue al personaje con suavidad.
        var k = reducido ? 1 : 1 - Math.pow(0.002, dt);
        cam.x += (p.x - cam.x) * k;
        cam.y += (p.y - 120 - cam.y) * k;
        aplicarCamara();
        if (andando || Math.abs(p.x - cam.x) > 0.5 || Math.abs(p.y - 120 - cam.y) > 0.5) requestAnimationFrame(paso);
        else enMarcha = false;
    }
    function escala() {
        var vw = capa.clientWidth, vh = capa.clientHeight;
        return Math.min(vh / 1050, vw / 540, 1.15);
    }
    function aplicarCamara() {
        var vw = capa.clientWidth, vh = capa.clientHeight, s = escala();
        var tx = vw / 2 - cam.x * s, ty = vh / 2 - cam.y * s;
        tx = Math.min(tx, 0 + 120 * s); tx = Math.max(tx, vw - (W + 120) * s);
        if (H * s < vh) ty = Math.min(Math.max(ty, vh - (H + 120) * s), 80 * s);
        camara.setAttribute('transform', 'translate(' + f(tx) + ' ' + f(ty) + ') scale(' + f(s * 1000) / 1000 + ')');
    }
    function encuadrar() { aplicarCamara(); }

    /* ---------- Panel de nivel ---------- */
    function abrir(i) {
        var n = NIVELES[i];
        abiertoNivel = i;
        cuerpoPanel.innerHTML = '';
        n.piezas.forEach(function (sel) {
            var el = document.querySelector(sel);
            if (!el) return;
            var hueco = document.createComment('j');
            el.parentNode.insertBefore(hueco, el);
            devueltas.push({ el: el, hueco: hueco });
            var envoltorio = el.parentNode.tagName === 'OL' ? document.createElement('ol') : null;
            if (envoltorio) { envoltorio.className = el.parentNode.className; envoltorio.appendChild(el); cuerpoPanel.appendChild(envoltorio); }
            else cuerpoPanel.appendChild(el);
            el.querySelectorAll('.aparece').forEach(function (a) { a.classList.add('visto'); });
            if (el.classList.contains('aparece')) el.classList.add('visto');
        });
        var s = sub(n);
        juego.querySelector('[data-j-panel-num]').innerHTML = '<span lang="es">Nivel ' + (i + 1) + ' de ' + NIVELES.length + '</span><span lang="en">Level ' + (i + 1) + ' of ' + NIVELES.length + '</span> · ' +
            '<span lang="es">' + s.es + '</span><span lang="en">' + s.en + '</span>';
        juego.querySelector('[data-j-panel-titulo]').innerHTML = '<span lang="es">' + n.es + '</span><span lang="en">' + n.en + '</span>';
        juego.querySelector('[data-j-panel-paso="-1"]').hidden = i === 0;
        var sig = juego.querySelector('[data-j-panel-paso="1"]');
        sig.innerHTML = i === NIVELES.length - 1
            ? '<span lang="es">Volver al mapa</span><span lang="en">Back to map</span>'
            : '<span lang="es">Siguiente: ' + NIVELES[i + 1].es + '</span><span lang="en">Next: ' + NIVELES[i + 1].en + '</span>' + ICONOS.der;
        panel.hidden = false;
        panel.scrollTop = 0;
        juego.querySelector('.panel-caja').scrollTop = 0;
        requestAnimationFrame(function () { panel.classList.add('abierto'); });
        juego.querySelector('[data-j-panel-titulo]').focus({ preventScroll: true });
        // Los vídeos de las apps arrancan al verse.
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.preload = 'auto'; if (!reducido) v.play().catch(function () {}); });
        if (!vistos[n.id]) { vistos[n.id] = 1; guardar('niveles-vistos', JSON.stringify(vistos)); }
        pintarHud();
    }
    function cerrar() {
        if (abiertoNivel < 0) return;
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.pause(); });
        devueltas.forEach(function (d) { d.hueco.parentNode.insertBefore(d.el, d.hueco); d.hueco.remove(); });
        devueltas = [];
        cuerpoPanel.innerHTML = '';
        panel.classList.remove('abierto');
        panel.hidden = true;
        abiertoNivel = -1;
        juego.querySelector('[data-j-entrar]').focus({ preventScroll: true });
    }

    function teclas(e) {
        if (!raiz.classList.contains('en-juego')) return;
        if (e.target.closest && e.target.closest('input, textarea')) return;
        if (!juego.querySelector('[data-j-titulo]').hidden) {
            if (e.key === 'Enter') { e.preventDefault(); empezar(); }
            return;
        }
        if (abiertoNivel >= 0) { if (e.key === 'Escape') cerrar(); return; }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) { e.preventDefault(); if (destino === actual) abrir(actual); }
    }

    /* ---------- Entrar y salir del modo juego ---------- */
    function empezar() {
        var t = juego.querySelector('[data-j-titulo]');
        t.classList.add('fuera');
        setTimeout(function () { t.hidden = true; }, reducido ? 0 : 350);
        try { sessionStorage.setItem('juego-empezado', '1'); } catch (e) {}
    }
    function entrar() {
        if (!juego) crear();
        raiz.classList.add('en-juego');
        juego.hidden = false;
        guardar('modo', 'juego');
        var empezado = false;
        try { empezado = sessionStorage.getItem('juego-empezado') === '1'; } catch (e) {}
        juego.querySelector('[data-j-titulo]').hidden = empezado;
        posDist = distNivel(actual);
        var p = puntoEn(posDist);
        cam.x = p.x; cam.y = p.y - 120;
        pintarHud();
        arrancar();
        medirEtiquetas();
    }
    function salir() {
        cerrar();
        raiz.classList.remove('en-juego');
        juego.hidden = true;
        guardar('modo', 'clasico');
        window.scrollTo(0, 0);
    }

    document.querySelectorAll('[data-modo-juego]').forEach(function (b) {
        b.hidden = false;
        b.addEventListener('click', entrar);
    });

    // Se abre en modo juego salvo que el visitante prefiera la clásica
    // o llegue con un enlace a una sección concreta.
    var hash = location.hash.slice(1);
    if (hash === 'juego' || (!hash && guardado('modo') !== 'clasico')) entrar();
})();
