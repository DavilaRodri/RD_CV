/* rodrigodavila.com
   - Idioma ES/EN y tema claro/oscuro
   - Apps con sus capturas y vídeo (solo se reproduce mientras se ve)
   - Asistente: preguntas rápidas con respuesta escrita (de perfil.md) y,
     para lo demás, IA en Cloudflare con plan B que busca en perfil.md. */

(function () {
    'use strict';

    // URL del Worker de Cloudflare (ver cloudflare-worker/).
    var ASISTENTE_URL = 'https://steep-shadow-ce98.tronquitomagdaleno13.workers.dev';
    var PERFIL_URL = 'perfil.md';
    var INICIO_CARRERA = new Date(2017, 8, 1);

    var raiz = document.documentElement;
    var idioma = function () { return raiz.getAttribute('data-lang') === 'en' ? 'en' : 'es'; };

    /* ---------- Años y fecha ---------- */
    var hoy = new Date();
    var anios = hoy.getFullYear() - INICIO_CARRERA.getFullYear() - (hoy.getMonth() < INICIO_CARRERA.getMonth() ? 1 : 0);
    document.querySelectorAll('[data-anios]').forEach(function (el) { el.textContent = anios; });
    document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = hoy.getFullYear(); });

    /* ---------- Idioma ---------- */
    function aplicarIdioma(l) {
        raiz.setAttribute('data-lang', l);
        raiz.setAttribute('lang', l);
        try { localStorage.setItem('idioma', l); } catch (e) {}
        document.querySelectorAll('[data-placeholder-' + l + ']').forEach(function (el) {
            el.setAttribute('placeholder', el.getAttribute('data-placeholder-' + l));
        });
        document.querySelectorAll('[data-label-' + l + ']').forEach(function (el) {
            el.setAttribute('aria-label', el.getAttribute('data-label-' + l));
        });
        if (perfil) pintarRapidas();
        if (typeof pintarDonde === 'function') pintarDonde();
    }
    document.querySelectorAll('[data-cambiar-idioma]').forEach(function (b) {
        b.addEventListener('click', function () { aplicarIdioma(idioma() === 'es' ? 'en' : 'es'); });
    });

    /* ---------- Tema ---------- */
    function temaOscuro() {
        var t = raiz.getAttribute('data-theme');
        if (t) return t === 'dark';
        return !window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    function pintarColorBarra() {
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', temaOscuro() ? '#0b0c0e' : '#f7f7f5');
    }
    document.querySelectorAll('[data-cambiar-tema]').forEach(function (b) {
        b.addEventListener('click', function () {
            var oscuro = !temaOscuro();
            raiz.setAttribute('data-theme', oscuro ? 'dark' : 'light');
            try { localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro'); } catch (e) {}
            pintarColorBarra();
        });
    });
    pintarColorBarra();

    /* ---------- Barra con borde al bajar ---------- */
    var barra = document.querySelector('.barra');
    function bordeBarra() { barra.classList.toggle('con-borde', window.scrollY > 8); }
    window.addEventListener('scroll', bordeBarra, { passive: true });
    bordeBarra();

    /* ---------- Copiar email ---------- */
    document.querySelectorAll('[data-copiar]').forEach(function (b) {
        var original = b.innerHTML;
        b.addEventListener('click', function () {
            var hecho = function () {
                b.innerHTML = '<span lang="es">Copiado</span><span lang="en">Copied</span>';
                setTimeout(function () { b.innerHTML = original; }, 1800);
            };
            if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copiar')).then(hecho, function () {});
        });
    });

    /* ---------- Apariciones ---------- */
    var aparecen = document.querySelectorAll('.aparece');
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                var hermanos = Array.prototype.filter.call(
                    e.target.closest('section, article, header') ? e.target.closest('section, article, header').querySelectorAll('.aparece') : [],
                    function (x) { return !x.classList.contains('visto'); });
                var i = Math.max(0, hermanos.indexOf(e.target));
                e.target.style.setProperty('--i', Math.min(i, 6));
                e.target.classList.add('visto');
                obs.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        aparecen.forEach(function (el) { obs.observe(el); });
    } else {
        aparecen.forEach(function (el) { el.classList.add('visto'); });
    }

    /* ---------- Mapa de capacidades: dónde he usado cada cosa ---------- */
    var mapa = document.querySelector('[data-mapa]');
    var donde = document.querySelector('[data-mapa-donde]');
    var chipActivo = null;
    function pintarDonde() {
        if (!chipActivo) return;
        var l = idioma();
        var nombre = chipActivo.querySelector('[lang="' + l + '"]') || chipActivo;
        donde.innerHTML = '<strong>' + escapar(nombre.textContent) + '</strong> · ' + escapar(chipActivo.getAttribute('data-donde-' + l));
        donde.classList.add('visible');
        clearTimeout(pintarDonde.reloj);
        pintarDonde.reloj = setTimeout(function () { donde.classList.remove('visible'); }, 4500);
    }
    if (mapa) {
        mapa.querySelectorAll('button').forEach(function (b) {
            b.setAttribute('aria-pressed', 'false');
            b.addEventListener('click', function () {
                if (chipActivo) chipActivo.setAttribute('aria-pressed', 'false');
                chipActivo = b;
                b.setAttribute('aria-pressed', 'true');
                pintarDonde();
            });
        });
    }

    // Vídeos: solo se reproducen mientras se ven.
    document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
        v.closest('.movil-pantalla').addEventListener('click', function () { v.paused ? v.play() : v.pause(); });
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!('IntersectionObserver' in window)) { v.play().catch(function () {}); return; }
        new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(function () {}); } else { v.pause(); }
            });
        }, { threshold: 0.3 }).observe(v);
    });

    /* ---------- Asistente ---------- */
    var registro = document.querySelector('[data-chat-registro]');
    var rapidas = document.querySelector('[data-chat-rapidas]');
    var form = document.querySelector('[data-chat-form]');
    var entrada = form.querySelector('input');
    var historial = [];
    var ocupado = false;
    var perfil = null;            // { secciones: [{titulo, texto}], rapidas: {es: [...], en: [...]} }

    var TEXTOS = {
        es: {
            escribiendo: 'Escribiendo',
            sinConexion: 'Ahora mismo no puedo conectar con el asistente. Esto es lo que dice mi perfil sobre eso:',
            nada: 'Eso no lo tengo en mi perfil. Si quieres, escríbeme a rdavila92@gmail.com y te respondo yo.',
            caido: 'Ahora mismo no puedo responder. Escríbeme a rdavila92@gmail.com y te respondo yo.'
        },
        en: {
            escribiendo: 'Typing',
            sinConexion: "I can't reach the assistant right now. Here is what my profile says about it:",
            nada: "That isn't in my profile. Email me at rdavila92@gmail.com and I'll answer myself.",
            caido: "I can't answer right now. Email me at rdavila92@gmail.com and I'll answer myself."
        }
    };

    // perfil.md: "## Sección" = tema; "### Pregunta" dentro de "Preguntas rápidas" / "Quick questions" = botón.
    function leerPerfil(md) {
        var secciones = [];
        var r = { es: [], en: [] };
        var actual = null, grupo = null, pregunta = null;
        md.replace(/\r\n?/g, '\n').split('\n').forEach(function (linea) {
            var h2 = /^##\s+(.+)$/.exec(linea);
            var h3 = /^###\s+(.+)$/.exec(linea);
            if (h2) {
                var t = h2[1].trim();
                grupo = /^preguntas r[aá]pidas/i.test(t) ? 'es' : /^quick questions/i.test(t) ? 'en' : null;
                pregunta = null;
                actual = grupo ? null : { titulo: t, texto: '' };
                if (actual) secciones.push(actual);
                return;
            }
            if (h3 && grupo) {
                pregunta = { pregunta: h3[1].trim(), respuesta: '' };
                r[grupo].push(pregunta);
                return;
            }
            if (h3 && actual) {
                // Cada "###" del perfil es un trozo propio para el plan B.
                actual = { titulo: secciones[secciones.length - 1].titulo.split(' · ')[0] + ' · ' + h3[1].trim(), texto: '' };
                secciones.push(actual);
                return;
            }
            if (grupo && pregunta) { pregunta.respuesta += linea + '\n'; return; }
            if (actual) actual.texto += linea + '\n';
        });
        r.es.forEach(function (q) { q.respuesta = q.respuesta.trim(); });
        r.en.forEach(function (q) { q.respuesta = q.respuesta.trim(); });
        return { secciones: secciones, rapidas: r };
    }

    function pintarRapidas() {
        rapidas.innerHTML = '';
        (perfil.rapidas[idioma()] || []).forEach(function (q) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = q.pregunta;
            b.addEventListener('click', function () { preguntar(q.pregunta, q.respuesta); });
            rapidas.appendChild(b);
        });
    }

    // Markdown mínimo y seguro: párrafos, listas, negrita y enlaces.
    function escapar(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function enLinea(s) {
        s = escapar(s);
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        s = s.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, function (m, pre, url) {
            var limpio = url.replace(/[.,;:]+$/, '');
            var resto = url.slice(limpio.length);
            var visible = limpio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            try { visible = decodeURI(visible); } catch (e) {}
            return pre + '<a href="' + limpio + '" target="_blank" rel="noopener">' + visible + '</a>' + resto;
        });
        s = s.replace(/(^|[\s(])([\w.+-]+@[\w-]+\.[\w.]+[a-z])/gi, '$1<a href="mailto:$2">$2</a>');
        return s;
    }
    function markdown(md) {
        var html = '', lista = null;
        var lineas = String(md).replace(/\r\n?/g, '\n').split('\n');
        var parrafo = [];
        function cierraParrafo() { if (parrafo.length) { html += '<p>' + enLinea(parrafo.join(' ')) + '</p>'; parrafo = []; } }
        function cierraLista() { if (lista) { html += '</' + lista + '>'; lista = null; } }
        lineas.forEach(function (l) {
            var t = l.trim();
            var ul = /^[-*•]\s+(.+)$/.exec(t);
            var ol = /^\d+[.)]\s+(.+)$/.exec(t);
            if (ul || ol) {
                cierraParrafo();
                var tipo = ul ? 'ul' : 'ol';
                if (lista !== tipo) { cierraLista(); html += '<' + tipo + '>'; lista = tipo; }
                html += '<li>' + enLinea((ul || ol)[1]) + '</li>';
            } else if (!t) {
                cierraParrafo(); cierraLista();
            } else {
                cierraLista();
                parrafo.push(t.replace(/^#+\s*/, ''));
            }
        });
        cierraParrafo(); cierraLista();
        return html;
    }

    function añadir(clase, html) {
        var d = document.createElement('div');
        d.className = clase;
        d.innerHTML = html;
        registro.appendChild(d);
        return d;
    }
    // Desplaza el registro del chat (no la página) hasta el principio del mensaje.
    function verAbajo(el) {
        var destino = el.offsetTop - 12;
        var maximo = registro.scrollHeight - registro.clientHeight;
        registro.scrollTo({ top: Math.min(Math.max(destino, 0), maximo), behavior: 'smooth' });
    }
    function ocupar(si) {
        ocupado = si;
        rapidas.querySelectorAll('button').forEach(function (b) { b.disabled = si; });
        form.querySelector('button').disabled = si;
    }

    // Quita tildes, signos y palabras vacías para comparar preguntas.
    var VACIAS = 'a al de del el la las los lo un una unos unas y o e en con por para que como cual cuales me te se mi mis tu tus su sus es son has ha he hay muy mas pero sobre the a an of to in on and or is are you your do does did what how which who about me my i'.split(' ');
    function palabras(s) {
        return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ')
            .split(/\s+/).filter(function (w) { return w.length > 2 && VACIAS.indexOf(w) < 0; });
    }
    function parecido(a, b) {
        var A = palabras(a), B = palabras(b);
        if (!A.length || !B.length) return 0;
        var comunes = A.filter(function (w) { return B.some(function (v) { return v === w || (w.length > 4 && v.length > 4 && (v.indexOf(w.slice(0, 5)) === 0)); }); });
        return comunes.length / Math.max(A.length, B.length);
    }

    // Plan B sin IA: la sección del perfil que más se parece a la pregunta.
    function buscarEnPerfil(pregunta) {
        var mejor = null, nota = 0;
        var claves = palabras(pregunta);
        perfil.secciones.forEach(function (s) {
            var texto = palabras(s.titulo + ' ' + s.texto);
            var n = 0;
            claves.forEach(function (w) {
                texto.forEach(function (v) { if (v === w || (w.length > 4 && v.indexOf(w.slice(0, 5)) === 0)) n++; });
            });
            n = n / Math.sqrt(texto.length + 10);
            if (n > nota) { nota = n; mejor = s; }
        });
        if (!mejor || nota < 0.1) return null;
        var titulo = mejor.titulo.indexOf(' · ') > 0 ? '**' + mejor.titulo.split(' · ')[1] + '**\n\n' : '';
        var texto = titulo + mejor.texto.trim();
        return texto.length > 1400 ? texto.slice(0, texto.lastIndexOf('\n\n', 1400)) : texto;
    }

    function preguntar(texto, respuestaEscrita) {
        if (ocupado || !texto) return;
        var l = idioma();
        registro.closest('.chat').classList.add('en-marcha');
        añadir('msg-tu', escapar(texto));

        // 1. Respuesta escrita por Rodrigo (botón o pregunta casi igual).
        if (!respuestaEscrita && perfil) {
            var todas = perfil.rapidas.es.concat(perfil.rapidas.en);
            var mejor = null, nota = 0;
            todas.forEach(function (q) { var p = parecido(texto, q.pregunta); if (p > nota) { nota = p; mejor = q; } });
            if (mejor && nota >= 0.75) respuestaEscrita = mejor.respuesta;
        }
        if (respuestaEscrita) {
            ocupar(true);
            var pensando = añadir('msg-yo escribiendo', TEXTOS[l].escribiendo + '<span>.</span><span>.</span><span>.</span>');
            verAbajo(pensando);
            setTimeout(function () {
                pensando.className = 'msg-yo';
                pensando.innerHTML = markdown(respuestaEscrita);
                historial.push({ role: 'user', content: texto }, { role: 'assistant', content: respuestaEscrita });
                ocupar(false);
                verAbajo(pensando);
            }, 450);
            return;
        }

        // 2. IA con el perfil; si falla, 3. búsqueda en el perfil.
        ocupar(true);
        var caja = añadir('msg-yo escribiendo', TEXTOS[l].escribiendo + '<span>.</span><span>.</span><span>.</span>');
        verAbajo(caja);
        var control = 'AbortController' in window ? new AbortController() : null;
        var reloj = setTimeout(function () { if (control) control.abort(); }, 20000);

        fetch(ASISTENTE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: texto, lang: l, history: historial.slice(-12) }),
            signal: control ? control.signal : undefined
        })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
            .then(function (d) {
                if (!d || !d.answer) throw new Error('Sin respuesta');
                caja.className = 'msg-yo';
                caja.innerHTML = markdown(d.answer);
                historial.push({ role: 'user', content: texto }, { role: 'assistant', content: d.answer });
            })
            .catch(function () {
                caja.className = 'msg-yo';
                var encontrado = perfil ? buscarEnPerfil(texto) : null;
                caja.innerHTML = encontrado
                    ? '<p class="aviso">' + escapar(TEXTOS[l].sinConexion) + '</p>' + markdown(encontrado)
                    : markdown(perfil ? TEXTOS[l].nada : TEXTOS[l].caido);
            })
            .then(function () { clearTimeout(reloj); ocupar(false); verAbajo(caja); });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var t = entrada.value.trim();
        if (!t || ocupado) return;
        entrada.value = '';
        preguntar(t);
    });

    fetch(PERFIL_URL, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
        .then(function (md) { perfil = leerPerfil(md); pintarRapidas(); })
        .catch(function () { perfil = null; });

    aplicarIdioma(idioma());
})();
