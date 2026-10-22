/* rodrigodavila.com · modo juego
   Un mundo en pixel art que se recorre andando, con aRDi, un hada que
   acompaña. Cada edificio es un nivel; las apps esperan en cofres dentro de
   el castillo de las apps. Las empresas tienen su propio contenido (todos los
   proyectos); el resto usa el mismo HTML de la versión clásica, que se mueve
   al panel y vuelve a su sitio al cerrarlo. */

(function () {
    'use strict';

    var raiz = document.documentElement;
    var T = 16;
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function guardado(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function idioma() { return raiz.getAttribute('data-lang') === 'en' ? 'en' : 'es'; }
    function bi(o) { return typeof o === 'string' ? o : '<span lang="es">' + o.es + '</span><span lang="en">' + o.en + '</span>'; }
    function texto(o) { return typeof o === 'string' ? o : o[idioma()]; }
    function azar(semilla) {
        var s = semilla;
        return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    }
    function hash(x, y) {
        var h = (x * 374761393 + y * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }

    /* ---------- Edificios del mundo ---------- */
    // ang: dónde está la puerta sobre el anillo del pueblo (0 = este, 90 = sur).
    // El edificio queda encima de su puerta y mira al sur, como en Kakariko.
    var NIVELES = [
        { id: 'inicio', ang: 150, tipo: 'casa', es: 'Inicio', en: 'Home', sub: 'Rodrigo Dávila', piezas: ['#inicio .portada-texto'],
            hada: { es: 'Esta es la casa de Rodrigo. Entra para saber quién es.', en: 'This is Rodrigo\'s home. Step in to meet him.' } },
        { id: 'chat', ang: 128, tipo: 'faro', es: 'Pregúntame', en: 'Ask me', sub: { es: 'Mi IA', en: 'My AI' }, piezas: ['#asistente .chat'],
            hada: { es: 'En el faro vive la IA de Rodrigo. ¡Pregúntale lo que quieras!', en: 'Rodrigo\'s AI lives in the lighthouse. Ask it anything!' } },
        { id: 'accenture-2017', ang: 205, tipo: 'oficina', pisos: 2, logo: 'accenture', es: 'Accenture', en: 'Accenture', sub: '2017 – 2018', carrera: true,
            hada: { es: 'Aquí empezó todo, en 2017: su primer código Java para BBVA.', en: 'It all began here in 2017: his first Java code for BBVA.' } },
        { id: 'altia', ang: 236, tipo: 'oficina', pisos: 3, logo: 'altia', es: 'Altia', en: 'Altia', sub: '2018 – 2021', carrera: true,
            hada: { es: 'En Altia trabajó para Cepsa, BMW y la Comunidad de Madrid.', en: 'At Altia he worked for Cepsa, BMW and the Madrid regional government.' } },
        { id: 'deloitte', ang: 268, tipo: 'oficina', pisos: 5, logo: 'deloitte', es: 'Deloitte', en: 'Deloitte', sub: '2021 – 2025', carrera: true,
            hada: { es: 'Deloitte: cuatro años y medio liderando proyectos para Santander, Acciona y Cruz Roja.', en: 'Deloitte: four and a half years leading projects for Santander, Acciona and the Red Cross.' } },
        { id: 'accenture', ang: 298, tipo: 'torre', es: 'Accenture · BBVA', en: 'Accenture · BBVA', sub: { es: '2025 – hoy', en: '2025 – now' }, carrera: true,
            hada: { es: '¡Mira los agentes dando vueltas! Aquí diseña sistemas multiagente para BBVA.', en: 'Look at those agents spinning! This is where he designs multi-agent systems for BBVA.' } },
        { id: 'habilidades', ang: 326, tipo: 'templo', es: 'Lo que sé hacer', en: 'What I can do', sub: { es: 'Habilidades', en: 'Skills' }, piezas: ['#capacidades .mapa', '.formacion'],
            hada: { es: 'El templo guarda todo lo que sabe hacer: IA, código, cloud y gestión.', en: 'The temple holds everything he can do: AI, code, cloud and management.' } },
        { id: 'trofeos', ang: 70, tipo: 'castillo', es: 'Apps desarrolladas', en: 'Apps I\'ve built', sala: true,
            hada: { es: 'El castillo de las apps: dentro, cada cofre guarda una app de Rodrigo.', en: 'The apps castle: inside, every chest holds one of Rodrigo\'s apps.' } },
        { id: 'webs', ang: 50, tipo: 'cartel', es: 'Webs', en: 'Websites', sub: { es: 'A medida', en: 'Custom' }, piezas: ['#webs .webs-rejilla'],
            hada: { es: 'También hace webs a medida: bodas, restaurantes y comercios.', en: 'He also builds custom websites: weddings, restaurants and shops.' } },
        { id: 'taller', ang: 98, tipo: 'taller', es: 'El taller', en: 'Workbench', sub: 'Zapeo · RunClap', piezas: ['#zapeo', '#runclap'],
            hada: { es: 'En el taller hay cosas cociéndose: Zapeo y RunClap.', en: 'Things are cooking in the workshop: Zapeo and RunClap.' } },
        { id: 'contacto', ang: 24, tipo: 'buzon', es: 'Contacto', en: 'Contact', sub: { es: '¿Hablamos?', en: 'Let\'s talk' }, piezas: ['#contacto .contacto-caja'],
            hada: { es: '¿Te ha gustado? Déjale un mensaje en el buzón.', en: 'Enjoyed it? Leave him a message in the mailbox.' } }
    ];
    var APPS = [
        { id: 'urbapadel', icono: 'urbapadel', es: 'UrbaPadel', en: 'UrbaPadel', sub: 'App', piezas: ['#urbapadel'],
            hada: { es: 'UrbaPadel: reservas de pádel para urbanizaciones. ¡La usan más de 150 vecinos!', en: 'UrbaPadel: padel court booking for residential communities. Over 150 residents use it!' } },
        { id: 'lullcam', icono: 'lullcam', es: 'LullCam', en: 'LullCam', sub: 'App', piezas: ['#lullcam'],
            hada: { es: 'LullCam: un vigilabebés sin nube y cifrado de extremo a extremo.', en: 'LullCam: a baby monitor with no cloud and end-to-end encryption.' } },
        { id: 'tumenu', icono: 'tumenu', es: 'TuMenu', en: 'TuMenu', sub: 'App', piezas: ['#tumenu'],
            hada: { es: 'TuMenu: el bar manda el menú por WhatsApp y la IA hace el resto.', en: 'TuMenu: the bar sends its menu over WhatsApp and AI does the rest.' } },
        { id: 'godafly', icono: 'godafly', es: 'GodaFly', en: 'GodaFly', sub: 'App', piezas: ['#godafly'],
            hada: { es: 'GodaFly conecta a gente que viaja sola en aeropuertos y escalas.', en: 'GodaFly connects people travelling alone at airports and layovers.' } },
        { id: 'mifilmoteca', icono: 'mifilmoteca', es: 'Mi Filmoteca', en: 'Mi Filmoteca', sub: 'App', piezas: ['#mifilmoteca'],
            hada: { es: 'Mi Filmoteca fue su primera app en las tiendas, en 2020.', en: 'Mi Filmoteca was his first app on the stores, back in 2020.' } }
    ];
    APPS.forEach(function (a) { a.app = true; });
    // Las 15 pantallas en orden: cada una da una gema.
    var PANTALLAS = [];
    NIVELES.forEach(function (n) { if (n.sala) APPS.forEach(function (a) { PANTALLAS.push(a); }); else PANTALLAS.push(n); });
    function pantalla(id) { for (var i = 0; i < PANTALLAS.length; i++) if (PANTALLAS[i].id === id) return i; return -1; }
    function nivelPorId(id) { for (var i = 0; i < NIVELES.length; i++) if (NIVELES[i].id === id) return NIVELES[i]; return null; }


    /* ---------- Carrera: todos los proyectos ---------- */
    var CARRERA = {
        'accenture-2017': {
            rol: { es: 'Programador junior', en: 'Junior developer' },
            fechas: { es: 'Septiembre de 2017 – noviembre de 2018', en: 'September 2017 – November 2018' },
            intro: { es: 'Mi primer trabajo en el sector, recién salido de la carrera: código Java en producción para uno de los grandes bancos.', en: 'My first job in the industry, straight out of university: Java code in production for one of the big banks.' },
            proyectos: [
                { cliente: 'BBVA', titulo: 'Reporting Engine',
                    texto: { es: 'Motor de informes del banco.', en: 'The bank\'s reporting engine.' },
                    puntos: { es: ['Creación y migración de procesos batch en Java.', 'Generación de informes.'], en: ['Building and migrating Java batch processes.', 'Report generation.'] },
                    tec: ['Java', 'Batch', { es: 'Informes', en: 'Reporting' }] }
            ]
        },
        altia: {
            rol: { es: 'Analista', en: 'Analyst' },
            fechas: { es: 'Noviembre de 2018 – marzo de 2021', en: 'November 2018 – March 2021' },
            intro: { es: 'Del código al análisis: empecé a llevar el análisis funcional, el plan del proyecto y las tareas del equipo.', en: 'From code to analysis: I started owning functional analysis, the project plan and the team\'s tasks.' },
            proyectos: [
                { cliente: 'Cepsa', titulo: { es: 'Contratos', en: 'Contracts' },
                    texto: { es: 'Aplicación de contratos de las estaciones de servicio de Cepsa.', en: 'Contract management for Cepsa\'s service stations.' },
                    puntos: { es: ['Control del plan de proyecto y liderazgo de las tareas del equipo de desarrollo.', 'Análisis funcional.', 'Desarrollo y evaluación de evolutivos en Java.', 'Soporte tras el arranque: control y resolución de incidencias.'],
                        en: ['Owned the project plan and led the development team\'s tasks.', 'Functional analysis.', 'Built and assessed new features in Java.', 'Post go-live support: tracking and fixing incidents.'] },
                    tec: ['Java', { es: 'Análisis funcional', en: 'Functional analysis' }] },
                { cliente: 'BMW · Madison', titulo: { es: 'App para eventos', en: 'Events app' },
                    texto: { es: 'Aplicación para iPad para los eventos de clientes de BMW.', en: 'iPad app for BMW customer events.' },
                    puntos: { es: ['Reuniones de gestión, liderando al equipo.', 'Desarrollo de la app en Objective-C y del backend en Java.', 'Despliegue del API, la app y el backend en AWS.'],
                        en: ['Management meetings, leading the team.', 'Built the app in Objective-C and the backend in Java.', 'Deployed the API, app and backend on AWS.'] },
                    tec: ['Objective-C', 'Java', 'AWS', 'iPad'] },
                { cliente: { es: 'Comunidad de Madrid', en: 'Madrid regional government' }, titulo: { es: 'Sanidad mortuoria', en: 'Mortuary health records' },
                    texto: { es: 'Aplicación de sanidad mortuoria.', en: 'Mortuary health application.' },
                    puntos: { es: ['Análisis técnico y modelo de datos.', 'Desarrollo en Java, JavaScript y SQL.'], en: ['Technical analysis and data model.', 'Development in Java, JavaScript and SQL.'] },
                    tec: ['Java', 'JavaScript', 'SQL'] }
            ]
        },
        deloitte: {
            rol: { es: 'Senior Consultant', en: 'Senior Consultant' },
            fechas: { es: 'Marzo de 2021 – septiembre de 2025', en: 'March 2021 – September 2025' },
            intro: { es: 'Cuatro años y medio liderando proyectos y equipos: cloud, pagos, energía y mi primer proyecto de IA Generativa. Allí también me certifiqué como Scrum Master (PSM I).', en: 'Four and a half years leading projects and teams: cloud, payments, energy and my first Generative AI project. I also became a certified Scrum Master (PSM I) there.' },
            proyectos: [
                { cliente: 'Santander', titulo: 'Global Cards',
                    texto: { es: 'La plataforma global de tarjetas del banco, cloud-native y migrada a AWS en países como Chile y Brasil.', en: 'The bank\'s global card platform, cloud-native and migrated to AWS in countries such as Chile and Brazil.' },
                    puntos: { es: ['Gestión del proyecto de desarrollo cloud-native.', 'Gestión de la migración a AWS de la plataforma global de tarjetas.', 'Arquitectura de microservicios y APIs para escalar con resiliencia.', 'Coordinación de un equipo ágil y de las entregas clave.', 'Cumplimiento de los estándares de seguridad y cifrado del sector financiero.'],
                        en: ['Managed the cloud-native development project.', 'Managed the migration of the global card platform to AWS.', 'Microservices and API architecture built to scale with resilience.', 'Coordinated an agile team and the key deliveries.', 'Kept to the financial sector\'s security and encryption standards.'] },
                    tec: ['AWS', { es: 'Microservicios', en: 'Microservices' }, 'APIs', 'Agile'] },
                { cliente: { es: 'Cruz Roja · pro bono', en: 'Red Cross · pro bono' }, titulo: { es: 'IA Generativa', en: 'Generative AI' },
                    texto: { es: 'Aplicación de entrevistas con IA Generativa en AWS.', en: 'A Generative AI interview app on AWS.' },
                    puntos: { es: ['Diseño de la arquitectura y su implantación.', 'Liderazgo del desarrollo en AWS.', 'Creación y validación de los prompts junto al cliente.'],
                        en: ['Designed and rolled out the architecture.', 'Led the development on AWS.', 'Wrote and validated the prompts with the client.'] },
                    tec: [{ es: 'IA Generativa', en: 'Generative AI' }, 'AWS', 'Prompt engineering'] },
                { cliente: 'Acciona', titulo: { es: 'Energía', en: 'Energy' },
                    texto: { es: 'Aplicación de gestión de la medida para las mediciones de energía.', en: 'A metering app to manage energy measurements.' },
                    puntos: { es: ['Arquitectura AWS definida con el cliente.', 'Control del proyecto.', 'Liderazgo del equipo de desarrollo.'],
                        en: ['AWS architecture defined with the client.', 'Project control.', 'Led the development team.'] },
                    tec: ['AWS', { es: 'Arquitectura', en: 'Architecture' }] },
                { cliente: 'PUCK', titulo: { es: 'Solución de IVA', en: 'VAT solution' },
                    texto: { es: 'IVA para tiendas online que venden en Reino Unido.', en: 'VAT for online shops selling into the UK.' },
                    puntos: { es: ['Proceso de pagos e impuestos de principio a fin, con happy path y unhappy path.', 'Plan de proyecto y roadmap para alinear negocio y tecnología.', 'Liderazgo del equipo de pagos en la integración con Stripe, Xero y soluciones fiscales.', 'Documentación funcional y coordinación entre equipos para cumplir con el IVA británico.'],
                        en: ['End-to-end payments and tax process, happy and unhappy paths included.', 'Project plan and roadmap to align business and technology.', 'Led the payments team integrating Stripe, Xero and tax solutions.', 'Functional documentation and cross-team coordination to meet UK VAT rules.'] },
                    tec: ['Stripe', 'Xero', { es: 'Pagos', en: 'Payments' }] }
            ]
        },
        accenture: {
            rol: { es: 'Manager de IA Generativa', en: 'Generative AI Manager' },
            fechas: { es: 'Septiembre de 2025 – hoy', en: 'September 2025 – now' },
            intro: { es: 'Vuelta a Accenture para liderar IA Generativa: sistemas multiagente para problemas grandes y adopción de IA en toda la organización.', en: 'Back at Accenture to lead Generative AI: multi-agent systems for big problems and AI adoption across the organisation.' },
            proyectos: [
                { cliente: 'BBVA', titulo: { es: 'Modernización del core bancario con IA', en: 'AI-driven core banking modernisation' }, grande: true,
                    texto: { es: 'El proyecto más complejo y con más impacto de mi carrera. La pregunta: ¿puede la IA acelerar la migración del core bancario de COBOL a Java? No bastaba con generar código: había que entender aplicaciones de décadas, su lógica de negocio, y llevarla a Java moderno con trazabilidad.',
                        en: 'The most complex and highest-impact project of my career. The question: can AI speed up migrating the core banking system from COBOL to Java? Generating code was not enough: it meant understanding decades-old applications and their business logic, and moving them to modern Java with traceability.' },
                    puntos: { es: ['Sistema multiagente diseñado desde cero: agentes de análisis, comprensión funcional, interpretación de COBOL, documentación, generación de Java y validación.', 'Un agente orquestador decide quién interviene, cuándo, con qué contexto y cómo se valida.', 'MCP para que el orquestador use herramientas internas del banco: documentación, repositorios y utilidades.', 'Cada agente con sus propias skills y solo las herramientas que necesita, para reducir contexto y ganar calidad.', 'Human-in-the-loop desde el principio: la IA acelera y las personas validan lo crítico.', 'Resultado: muy buena acogida en el banco, viabilidad demostrada y el proyecto sigue evolucionando.'],
                        en: ['Multi-agent system designed from scratch: agents for analysis, functional understanding, COBOL interpretation, documentation, Java generation and validation.', 'An orchestrator agent decides who acts, when, with what context and how the result is validated.', 'MCP so the orchestrator can use the bank\'s internal tools: documentation, repositories and utilities.', 'Each agent has its own skills and only the tools it needs, to cut context and raise quality.', 'Human-in-the-loop from day one: AI speeds things up and people validate what is critical.', 'Result: very well received by the bank, viability proven and the project keeps evolving.'] },
                    tec: ['Claude Opus', 'MCP', { es: 'Multiagente', en: 'Multi-agent' }, 'GitHub Copilot', 'VS Code', 'COBOL', 'Java'] },
                { cliente: 'Accenture', titulo: { es: 'Adopción de IA', en: 'AI adoption' },
                    texto: { es: 'Formaciones, workshops, demos en directo y evangelización para que miles de profesionales, técnicos, funcionales y responsables, entiendan qué puede y qué no puede hacer la IA y cómo usarla bien en su día a día.', en: 'Training, workshops, live demos and evangelism so thousands of people, technical, functional and managers, understand what AI can and cannot do and how to use it well every day.' },
                    tec: [{ es: 'Formación', en: 'Training' }, 'Workshops', 'Demos'] },
                { cliente: 'BBVA', titulo: { es: 'Interlocución con dirección', en: 'Working with leadership' },
                    texto: { es: 'Hago de puente entre negocio y tecnología: presento avances a responsables del banco, defino los siguientes pasos, valido decisiones técnicas y las alineo con negocio.', en: 'I bridge business and technology: I present progress to the bank\'s leaders, define next steps, validate technical decisions and align them with the business.' },
                    tec: [{ es: 'Estrategia', en: 'Strategy' }, { es: 'Comités', en: 'Steering' }] }
            ]
        }
    };

    function htmlCarrera(c) {
        var s = '<div class="mision-cabeza"><p class="mision-rol">' + bi(c.rol) + '</p><p class="mision-fechas">' + bi(c.fechas) + '</p>' +
            '<p class="mision-intro">' + bi(c.intro) + '</p></div><ol class="misiones">';
        c.proyectos.forEach(function (p) {
            s += '<li class="mision' + (p.grande ? ' mision-grande' : '') + '"><p class="mision-cliente">' + bi(p.cliente) + '</p>' +
                '<h3>' + bi(p.titulo) + '</h3><p class="mision-texto">' + bi(p.texto) + '</p>';
            if (p.puntos) {
                ['es', 'en'].forEach(function (l) {
                    s += '<ul class="mision-puntos" lang="' + l + '">' + p.puntos[l].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
                });
            }
            s += '<ul class="pila">' + p.tec.map(function (t) { return '<li>' + bi(t) + '</li>'; }).join('') + '</ul></li>';
        });
        return s + '</ol>';
    }


    /* ---------- Paleta del mundo ---------- */
    var C = {
        linea: '#232a38', hierba: '#5aa64a', hierba2: '#4c9440', hierba3: '#71bd5c',
        tierra: '#dcbb7c', tierra2: '#c9a466', tierraBorde: '#ad8a50',
        arena: '#efdca2', arena2: '#e2c98a', agua: '#3b86d1', agua2: '#5aa2e3', espuma: '#c4e8fb',
        madera: '#a8743f', madera2: '#7d5330', copaO: '#1b3f26', copa: '#2f7d3a', copa2: '#256b31', copaL: '#4fa64a', copaLL: '#7cc76a',
        tronco: '#6b4426', luz: '#ffd36b', acento: '#3a66f0', acento2: '#86a6ff', oro: '#e0b04a', gema: '#3ee6a0'
    };

    /* ---------- Escenas: el pueblo y la sala de las apps ---------- */
    var HIERBA = 0, AGUA = 1, CAMINO = 2, ARENA = 3, PUENTE = 4, FLORES = 5, MURO = 6, LOSA = 7, ALFOMBRA = 8, PUERTA = 9;
    function escena(mw, mh) {
        return { mw: mw, mh: mh, pw: mw * T, ph: mh * T, suelo: new Uint8Array(mw * mh), solido: new Uint8Array(mw * mh), objetos: [], img: null };
    }
    var mundo = escena(86, 52), sala = escena(22, 13), E = mundo;
    function ix(x, y) { return y * E.mw + x; }
    function dentro(x, y) { return x >= 0 && y >= 0 && x < E.mw && y < E.mh; }
    function costa(y) { return 79 + Math.round(1.5 * Math.sin(y * 0.17) + Math.sin(y * 0.41)); }
    // El pueblo: un anillo de camino alrededor de una plaza con fuente.
    var ANILLO = { x: 46, y: 30, rx: 22, ry: 13 }, PLAZA_R = 4.6, PLAZA = 10;
    var FAROLAS = [[41, 26], [52, 26], [41, 35], [52, 35]];
    NIVELES.forEach(function (n) {
        var a = n.ang * Math.PI / 180;
        n.x = Math.round(ANILLO.x + ANILLO.rx * Math.cos(a));
        n.y = Math.round(ANILLO.y + ANILLO.ry * Math.sin(a)) - 1;
    });

    var DIM = { casa: [64, 60, 36], torre: [64, 136, 30], templo: [80, 76, 40], castillo: [96, 88, 40], cartel: [76, 68, 14], taller: [68, 60, 36], faro: [36, 116, 24], buzon: [28, 44, 10] };
    NIVELES.forEach(function (n) {
        var d = n.tipo === 'oficina' ? [56, 50 + n.pisos * 12, 36] : DIM[n.tipo];
        n.w = d[0]; n.h = d[1]; n.fh = d[2];
        n.px = (n.x + 1) * T;           // centro de la puerta
        n.py = (n.y + 1) * T;           // pie del edificio
        n.entrada = { x: n.px, y: n.py + 8 };
        n.extra = { torre: 34, templo: 22, faro: 26, castillo: 10 }[n.tipo] || 0;
    });
    // Cofres de la sala, en arco frente a la pared
    APPS.forEach(function (a, i) {
        a.cx = 64 + i * 56; a.cy = 88 + (i === 2 ? -8 : i === 1 || i === 3 ? -4 : 0);
        a.frente = { x: a.cx, y: a.cy + 20 };
    });

    function generarMundo() {
        E = mundo;
        var x, y, suelo = E.suelo, solido = E.solido, reservado = new Uint8Array(E.mw * E.mh);
        for (y = 0; y < E.mh; y++) {
            var c = costa(y);
            for (x = 0; x < E.mw; x++) {
                var t = HIERBA;
                if (x >= c) t = AGUA;
                else if (x >= c - 3) t = ARENA;
                var lx = (x - 15) / 5.5, ly = (y - 43) / 3.2;
                if (lx * lx + ly * ly < 1) t = AGUA;
                var px2 = x - ANILLO.x, py2 = y - ANILLO.y;
                if (px2 * px2 + py2 * py2 < PLAZA_R * PLAZA_R) t = PLAZA;
                suelo[ix(x, y)] = t;
            }
        }
        function pinta(x, y) {
            for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
                var X = x + a, Y = y + b;
                if (!dentro(X, Y)) continue;
                var i = ix(X, Y);
                if (suelo[i] === PLAZA) continue;
                suelo[i] = suelo[i] === AGUA || suelo[i] === PUENTE ? PUENTE : CAMINO;
            }
        }
        function linea(x1, y1, x2, y2) {
            var dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), X = x1, Y = y1;
            pinta(X, Y);
            while (X !== x2 || Y !== y2) { if (X !== x2) X += dx; else Y += dy; pinta(X, Y); }
        }
        // Anillo, tres calles hasta la plaza y un muelle hacia el mar
        for (var ang = 0; ang < Math.PI * 2; ang += 0.01) pinta(Math.round(ANILLO.x + ANILLO.rx * Math.cos(ang)), Math.round(ANILLO.y + ANILLO.ry * Math.sin(ang)));
        NIVELES.forEach(function (n) { pinta(n.x, n.y + 1); });
        linea(ANILLO.x - ANILLO.rx, ANILLO.y, ANILLO.x - 4, ANILLO.y);
        linea(ANILLO.x, ANILLO.y - ANILLO.ry, ANILLO.x, ANILLO.y - 4);
        linea(ANILLO.x + 4, ANILLO.y, E.mw - 4, ANILLO.y);
        for (y = 0; y < E.mh; y++) for (x = 0; x < E.mw; x++) {
            var s = suelo[ix(x, y)];
            if (s === PLAZA) { for (var j2 = -1; j2 <= 1; j2++) for (var m2 = -1; m2 <= 1; m2++) if (dentro(x + m2, y + j2)) reservado[ix(x + m2, y + j2)] = 1; continue; }
            if (s !== CAMINO && s !== PUENTE) continue;
            for (var j = -2; j <= 2; j++) for (var m = -2; m <= 2; m++) if (dentro(x + m, y + j)) reservado[ix(x + m, y + j)] = 1;
        }
        NIVELES.forEach(function (n) {
            var x0 = Math.floor((n.px - n.w / 2) / T) - 2, x1 = Math.floor((n.px + n.w / 2) / T) + 2;
            var y0 = Math.floor((n.py - n.h - n.extra) / T) - 1, y1 = n.y + 3;
            for (var Y = y0; Y <= y1; Y++) for (var X = x0; X <= x1; X++) if (dentro(X, Y)) reservado[ix(X, Y)] = 1;
            var fx0 = Math.floor((n.px - n.w / 2 + 4) / T), fx1 = Math.floor((n.px + n.w / 2 - 5) / T);
            var fy0 = Math.floor((n.py - n.fh) / T), fy1 = Math.floor((n.py - 1) / T);
            for (Y = fy0; Y <= fy1; Y++) for (X = fx0; X <= fx1; X++) if (dentro(X, Y)) { solido[ix(X, Y)] = 1; if (suelo[ix(X, Y)] === CAMINO) suelo[ix(X, Y)] = HIERBA; }
        });
        // Fuente y farolas de la plaza
        for (y = ANILLO.y - 1; y <= ANILLO.y + 1; y++) for (x = ANILLO.x - 1; x <= ANILLO.x + 1; x++) solido[ix(x, y)] = 1;
        FAROLAS.forEach(function (f) { solido[ix(f[0], f[1])] = 1; });
        var r2 = azar(7), arboles = [], matas = [];
        for (y = 0; y < E.mh - 1; y += 2) for (x = 0; x < E.mw - 1; x += 2) {
            var ok = true;
            for (var a = 0; a < 2 && ok; a++) for (var b = 0; b < 2 && ok; b++) {
                var i2 = ix(x + a, y + b);
                if (suelo[i2] !== HIERBA || reservado[i2] || solido[i2]) ok = false;
            }
            if (!ok) continue;
            var borde = Math.min(x, y, E.mh - 2 - y);
            var n = Math.sin(x * 0.23) + Math.sin(y * 0.29 + 1.3) + Math.sin((x + y) * 0.13);
            var ex = (x + 1 - ANILLO.x) / (ANILLO.rx + 3), ey = (y + 1 - ANILLO.y) / (ANILLO.ry + 3), dentroPueblo = ex * ex + ey * ey < 1;
            var p = borde < 3 ? 0.97 : dentroPueblo ? 0.03 : n > 1.2 ? 0.75 : 0.12;
            if (r2() < p) { arboles.push({ x: x, y: y }); solido[ix(x, y + 1)] = 1; solido[ix(x + 1, y + 1)] = 1; }
        }
        for (y = 2; y < E.mh - 2; y++) for (x = 2; x < E.mw - 2; x++) {
            var i3 = ix(x, y);
            if (suelo[i3] !== HIERBA || reservado[i3] || solido[i3]) continue;
            var q = r2();
            if (q < 0.012) { matas.push({ x: x, y: y }); solido[i3] = 1; }
            else if (q < 0.07) suelo[i3] = FLORES;
        }
        return { arboles: arboles, matas: matas };
    }

    function generarSala() {
        E = sala;
        for (var y = 0; y < E.mh; y++) for (var x = 0; x < E.mw; x++) {
            var t = LOSA;
            if (y < 3 || x === 0 || x === E.mw - 1 || y === E.mh - 1) t = MURO;
            if ((x === 10 || x === 11) && y >= 7) t = y === E.mh - 1 ? PUERTA : ALFOMBRA;
            E.suelo[ix(x, y)] = t;
        }
        APPS.forEach(function (a) {
            for (var X = Math.floor((a.cx - 9) / T); X <= Math.floor((a.cx + 8) / T); X++) E.solido[ix(X, Math.floor((a.cy + 6) / T))] = 1;
        });
    }

    /* ---------- Dibujo en pixel art ---------- */
    function lienzo(w, h) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d');
        x.imageSmoothingEnabled = false;
        return { c: c, x: x };
    }
    function disco(x, cx, cy, r, color) {
        x.fillStyle = color;
        for (var dy = -r; dy <= r; dy++) { var w = Math.round(Math.sqrt(r * r - dy * dy)); x.fillRect(cx - w, cy + dy, w * 2, 1); }
    }
    // Letras de 3x5 para los rótulos de los edificios
    var FUENTE = {
        A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
        D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], I: ['###', '.#.', '.#.', '.#.', '###'],
        L: ['#..', '#..', '#..', '#..', '###'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
        R: ['##.', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
        V: ['#.#', '#.#', '#.#', '#.#', '.#.'], '>': ['#..', '.#.', '..#', '.#.', '#..']
    };
    function anchoTexto(t, s) { var w = 0; for (var i = 0; i < t.length; i++) w += (FUENTE[t[i]][0].length + 1) * s; return w - s; }
    function letras(x, X, Y, t, color, s) {
        s = s || 1;
        x.fillStyle = color;
        for (var i = 0; i < t.length; i++) {
            var g = FUENTE[t[i]];
            for (var f = 0; f < 5; f++) for (var c = 0; c < g[f].length; c++) if (g[f][c] === '#') x.fillRect(X + c * s, Y + f * s, s, s);
            X += (g[0].length + 1) * s;
        }
    }

    function pintarSuelo(esc2) {
        E = esc2;
        var L = lienzo(E.pw, E.ph), x = L.x, X, Y, suelo = E.suelo;
        function es(a, b) { return dentro(a, b) ? suelo[ix(a, b)] : HIERBA; }
        function verde(v) { return v === HIERBA || v === FLORES; }
        for (Y = 0; Y < E.mh; Y++) for (X = 0; X < E.mw; X++) {
            var t = suelo[ix(X, Y)], px = X * T, py = Y * T, k;
            if (t === HIERBA || t === FLORES) {
                x.fillStyle = C.hierba; x.fillRect(px, py, T, T);
                for (k = 0; k < 5; k++) {
                    var h1 = hash(X * 7 + k, Y * 13 + k), hy = Math.floor(hash(X + k * 3, Y - k) * 13);
                    x.fillStyle = h1 > 0.5 ? C.hierba2 : C.hierba3;
                    x.fillRect(px + Math.floor(h1 * 14), py + hy, 2, 1);
                    x.fillRect(px + Math.floor(h1 * 14) + 1, py + hy - 1, 1, 1);
                }
                if (t === FLORES) {
                    var col = ['#f6f2e8', '#ff8fa3', '#ffd36b'][Math.floor(hash(X, Y) * 3)];
                    for (k = 0; k < 3; k++) {
                        var fx = px + 2 + Math.floor(hash(X + k, Y * 3) * 11), fy = py + 2 + Math.floor(hash(X * 5, Y + k) * 11);
                        x.fillStyle = col; x.fillRect(fx - 1, fy, 3, 1); x.fillRect(fx, fy - 1, 1, 3);
                        x.fillStyle = '#e8a33a'; x.fillRect(fx, fy, 1, 1);
                    }
                }
            } else if (t === CAMINO) {
                x.fillStyle = C.tierra; x.fillRect(px, py, T, T);
                for (k = 0; k < 4; k++) { x.fillStyle = C.tierra2; x.fillRect(px + Math.floor(hash(X * 3 + k, Y) * 14), py + Math.floor(hash(X, Y * 3 + k) * 14), 2, 1); }
                x.fillStyle = C.tierraBorde;
                if (verde(es(X, Y - 1))) { x.fillRect(px, py, T, 1); x.fillStyle = C.hierba; for (k = 0; k < T; k += 3) x.fillRect(px + k, py, 1, 1 + (k % 2)); x.fillStyle = C.tierraBorde; }
                if (verde(es(X, Y + 1))) x.fillRect(px, py + T - 1, T, 1);
                if (verde(es(X - 1, Y))) x.fillRect(px, py, 1, T);
                if (verde(es(X + 1, Y))) x.fillRect(px + T - 1, py, 1, T);
            } else if (t === ARENA) {
                x.fillStyle = C.arena; x.fillRect(px, py, T, T);
                for (k = 0; k < 4; k++) { x.fillStyle = C.arena2; x.fillRect(px + Math.floor(hash(X * 5 + k, Y) * 15), py + Math.floor(hash(X, Y * 5 + k) * 15), 1, 1); }
            } else if (t === AGUA) {
                x.fillStyle = C.agua; x.fillRect(px, py, T, T);
                for (k = 0; k < 2; k++) { x.fillStyle = C.agua2; x.fillRect(px + Math.floor(hash(X * 9 + k, Y) * 10), py + Math.floor(hash(X, Y * 9 + k) * 14), 5, 1); }
                x.fillStyle = C.espuma;
                function tierra(v) { return v !== AGUA && v !== PUENTE; }
                if (tierra(es(X, Y - 1))) x.fillRect(px, py, T, 2);
                if (tierra(es(X - 1, Y))) x.fillRect(px, py, 2, T);
                if (tierra(es(X + 1, Y))) x.fillRect(px + T - 2, py, 2, T);
                if (tierra(es(X, Y + 1))) x.fillRect(px, py + T - 1, T, 1);
            } else if (t === PUENTE) {
                x.fillStyle = C.agua; x.fillRect(px, py, T, T);
                x.fillStyle = C.madera; x.fillRect(px, py + 1, T, T - 2);
                x.fillStyle = C.madera2;
                for (k = 0; k < T; k += 4) x.fillRect(px + k, py + 1, 1, T - 2);
                if (es(X, Y - 1) !== PUENTE) { x.fillStyle = C.linea; x.fillRect(px, py, T, 2); }
                if (es(X, Y + 1) !== PUENTE) { x.fillStyle = C.linea; x.fillRect(px, py + T - 2, T, 2); }
            } else if (t === PLAZA) {
                // Adoquines en filas desplazadas
                x.fillStyle = '#b9b2a2'; x.fillRect(px, py, T, T);
                for (k = 0; k < 4; k++) {
                    var off2 = (Y * 4 + k) % 2 ? 4 : 0;
                    for (var cc2 = -1; cc2 < 2; cc2++) {
                        var bx2 = px + off2 + cc2 * 8, by2 = py + k * 4;
                        x.fillStyle = hash(X * 4 + cc2, Y * 4 + k) > 0.5 ? '#cfc8b8' : '#c4bdac';
                        x.fillRect(Math.max(px, bx2 + 1), by2 + 1, Math.min(px + T, bx2 + 8) - Math.max(px, bx2 + 1), 3);
                    }
                }
                if (verde(es(X, Y - 1))) { x.fillStyle = '#8f8878'; x.fillRect(px, py, T, 1); }
                if (verde(es(X, Y + 1))) { x.fillStyle = '#8f8878'; x.fillRect(px, py + T - 1, T, 1); }
                if (verde(es(X - 1, Y))) { x.fillStyle = '#8f8878'; x.fillRect(px, py, 1, T); }
                if (verde(es(X + 1, Y))) { x.fillStyle = '#8f8878'; x.fillRect(px + T - 1, py, 1, T); }
            } else if (t === MURO) {
                var lado = X === 0 || X === E.mw - 1 || Y === E.mh - 1;
                x.fillStyle = lado ? '#3e414d' : '#5a5e6d'; x.fillRect(px, py, T, T);
                x.fillStyle = lado ? '#33363f' : '#4a4d5a';
                for (k = 0; k < T; k += 6) x.fillRect(px, py + k, T, 1);
                var off = (Math.floor(Y * T / 6)) % 2 ? 4 : 0;
                for (k = 0; k < 3; k++) x.fillRect(px + (off + k * 8) % T, py + (k * 6) % T, 1, 6);
                if (!lado) { x.fillStyle = '#6c7081'; x.fillRect(px + 2 + Math.floor(hash(X, Y) * 10), py + 2, 3, 1); }
                if (Y === 2 && !lado) { x.fillStyle = '#2b2d36'; x.fillRect(px, py + T - 3, T, 3); }
            } else if (t === LOSA) {
                x.fillStyle = (X + Y) % 2 ? '#8f8a7c' : '#857f71'; x.fillRect(px, py, T, T);
                x.fillStyle = '#6f6a5d'; x.fillRect(px, py, T, 1); x.fillRect(px, py, 1, T);
                x.fillStyle = '#a19c8d'; x.fillRect(px + 3, py + 3, 2, 1);
            } else if (t === ALFOMBRA) {
                x.fillStyle = '#a3352c'; x.fillRect(px, py, T, T);
                x.fillStyle = '#8a2b24'; for (k = 2; k < T; k += 5) x.fillRect(px + 2, py + k, T - 4, 1);
                x.fillStyle = C.oro;
                if (X === 10) x.fillRect(px, py, 2, T); else x.fillRect(px + T - 2, py, 2, T);
            } else if (t === PUERTA) {
                x.fillStyle = '#14151b'; x.fillRect(px, py, T, T);
                x.fillStyle = '#a3352c'; x.fillRect(px, py, T, 4);
            }
        }
        return L.c;
    }

    function spriteArbol() {
        var L = lienzo(32, 34), x = L.x;
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(5, 29, 22, 4); x.fillRect(3, 30, 26, 2);
        x.fillStyle = C.linea; x.fillRect(12, 22, 8, 10);
        x.fillStyle = C.tronco; x.fillRect(13, 22, 6, 9);
        x.fillStyle = '#82552f'; x.fillRect(14, 23, 2, 7);
        disco(x, 16, 13, 14, C.copaO);
        disco(x, 16, 13, 13, C.copa2);
        disco(x, 15, 12, 11, C.copa);
        disco(x, 12, 9, 7, C.copaL);
        disco(x, 10, 7, 3, C.copaLL);
        x.fillStyle = C.copa2;
        [[20, 16], [9, 17], [22, 9], [16, 20], [6, 12]].forEach(function (p) { x.fillRect(p[0], p[1], 3, 2); });
        x.fillStyle = C.copaLL; x.fillRect(19, 7, 2, 1); x.fillRect(7, 14, 2, 1);
        return L.c;
    }
    function spriteMata() {
        var L = lienzo(16, 16), x = L.x;
        x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(2, 13, 12, 2);
        disco(x, 8, 8, 7, C.copaO); disco(x, 8, 8, 6, C.copa); disco(x, 6, 6, 3, C.copaL);
        x.fillStyle = '#ff8fa3'; x.fillRect(10, 9, 1, 1); x.fillRect(5, 10, 1, 1);
        return L.c;
    }

    // Edificios: cada uno devuelve su lienzo y las ventanas que se encienden de noche.
    function spriteEdificio(n, i) {
        var L = lienzo(n.w, n.h), x = L.x, luces = [], r = azar(i * 53 + 11);
        function p(X, Y, w, h, c) { x.fillStyle = c; x.fillRect(X, Y, w, h); }
        function caja(X, Y, w, h, c) { p(X, Y, w, h, C.linea); p(X + 1, Y + 1, w - 2, h - 2, c); }
        function luz(X, Y, w, h) { p(X, Y, w, h, C.luz); luces.push([X, Y, w, h]); }
        function tejado(cx, y0, y1, base, ancho, color, oscuro) {
            for (var y = y0; y <= y1; y++) {
                var hw = Math.round(base + (y - y0) * ancho);
                p(cx - hw - 1, y, hw * 2 + 2, 1, C.linea);
                p(cx - hw, y, hw * 2, 1, (y - y0) % 4 === 3 ? oscuro : color);
            }
            p(cx - Math.round(base + (y1 - y0) * ancho) - 1, y1 + 1, Math.round(base + (y1 - y0) * ancho) * 2 + 2, 1, C.linea);
        }
        function almenas(X, Y, w, c) { for (var k = 0; k < w; k += 6) caja(X + k, Y, 4, 5, c); }
        var W = n.w, H = n.h;
        p(4, H - 4, W - 8, 4, 'rgba(0,0,0,.22)');
        if (n.tipo === 'casa') {
            caja(44, 4, 8, 14, '#8b8f9c');
            caja(8, 28, 48, 29, '#f1e3c2');
            p(9, 51, 46, 5, '#d9c49c');
            tejado(32, 6, 27, 9, 1.05, '#c8463a', '#a3352c');
            caja(27, 38, 10, 19, '#7a4a28'); p(34, 47, 1, 2, C.luz);
            caja(13, 34, 10, 9, C.luz); luces.push([14, 35, 8, 7]); p(17, 35, 1, 7, C.linea); p(14, 38, 8, 1, C.linea);
            caja(41, 34, 10, 9, C.luz); luces.push([42, 35, 8, 7]); p(45, 35, 1, 7, C.linea); p(42, 38, 8, 1, C.linea);
            p(22, 56, 20, 2, '#b9a27a');
        } else if (n.tipo === 'oficina') {
            caja(4, 8, 48, H - 12, '#cfd8e8');
            p(40, 9, 11, H - 14, '#b9c4da');
            caja(2, 4, 52, 7, '#8d9bb5');
            p(40, 0, 2, 5, C.linea);
            for (var f = 0; f < n.pisos; f++) for (var c = 0; c < 4; c++) {
                var X = 9 + c * 10, Y = 14 + f * 12;
                p(X, Y, 7, 8, C.linea);
                if (r() > 0.4) luz(X + 1, Y + 1, 5, 6); else p(X + 1, Y + 1, 5, 6, '#5f86c4');
                p(X + 1, Y + 1, 2, 1, '#ffffff55');
            }
            // Rótulo con el logo de la empresa
            caja(3, H - 33, 50, 11, '#1b1f2a');
            if (n.logo === 'accenture') {
                var wa = anchoTexto('ACCENTURE', 1);
                letras(x, 28 - Math.round((wa + 4) / 2) + 4, H - 30, 'ACCENTURE', '#ffffff');
                letras(x, 28 - Math.round((wa + 4) / 2), H - 30, '>', '#a100ff');
            } else if (n.logo === 'deloitte') {
                var wd = anchoTexto('DELOITTE', 1);
                letras(x, 28 - Math.round((wd + 3) / 2), H - 30, 'DELOITTE', '#ffffff');
                p(28 - Math.round((wd + 3) / 2) + wd + 1, H - 27, 2, 2, '#86bc25');
            } else {
                var wl = anchoTexto('ALTIA', 1);
                letras(x, 28 - Math.round(wl / 2), H - 30, 'ALTIA', '#ffffff');
                p(28 - Math.round(wl / 2) - 4, H - 29, 2, 3, '#e4572e'); p(28 + Math.round(wl / 2) + 2, H - 29, 2, 3, '#e4572e');
            }
            caja(21, H - 21, 14, 18, '#6fa8dc'); p(28, H - 20, 1, 16, C.linea); p(23, H - 19, 3, 2, '#ffffff88');
            p(18, H - 4, 20, 2, '#9aa3b5');
        } else if (n.tipo === 'torre') {
            caja(10, 22, 44, 112, '#1f3b73');
            p(42, 23, 11, 110, '#18305f');
            for (var yy = 44; yy < 108; yy += 8) for (var cc = 0; cc < 5; cc++) {
                if (r() > 0.45) luz(14 + cc * 8, yy, 4, 5); else p(14 + cc * 8, yy, 4, 5, '#4f7fd6');
            }
            // Rótulo BBVA arriba y marca de Accenture en la base
            caja(13, 25, 38, 16, '#004481');
            letras(x, 32 - Math.round(anchoTexto('BBVA', 2) / 2), 28, 'BBVA', '#ffffff', 2);
            caja(18, 14, 28, 10, '#2c4f93');
            p(31, 0, 2, 15, C.linea);
            caja(10, 108, 44, 8, '#1b1f2a');
            letras(x, 32 - Math.round((anchoTexto('ACCENTURE', 1) + 4) / 2), 110, '>', '#a100ff');
            letras(x, 32 - Math.round((anchoTexto('ACCENTURE', 1) + 4) / 2) + 4, 110, 'ACCENTURE', '#ffffff');
            caja(10, 115, 44, 19, '#2c4f93');
            caja(25, 119, 14, 15, '#9cd0ff'); p(31, 120, 1, 13, C.linea);
        } else if (n.tipo === 'templo') {
            caja(4, 64, 72, 9, '#cfc8b6');
            caja(10, 57, 60, 8, '#ddd6c4');
            p(12, 26, 56, 32, '#6f6a5d');
            for (var k = 0; k < 4; k++) { var cx = 14 + k * 16; caja(cx, 25, 9, 34, '#efe9da'); p(cx + 6, 26, 2, 32, '#d3ccbb'); }
            caja(8, 19, 64, 8, '#e6dfcd');
            tejado(40, 3, 18, 2, 2.15, '#e6dfcd', '#d3ccbb');
            p(37, 10, 6, 4, '#7fe0ff');
        } else if (n.tipo === 'castillo') {
            // Torres laterales, cuerpo central con puerta en arco y copa dorada
            caja(0, 14, 24, H - 16, '#cfc8b6'); caja(72, 14, 24, H - 16, '#cfc8b6');
            almenas(0, 9, 24, '#cfc8b6'); almenas(72, 9, 24, '#cfc8b6');
            caja(22, 30, 52, H - 32, '#ddd6c4');
            almenas(22, 25, 52, '#ddd6c4');
            for (var b = 0; b < 4; b++) { p(24, 36 + b * 12, 48, 1, '#c3bba8'); p(2, 22 + b * 14, 20, 1, '#b9b19e'); p(74, 22 + b * 14, 20, 1, '#b9b19e'); }
            caja(8, 26, 8, 12, '#2b2d36'); caja(80, 26, 8, 12, '#2b2d36');
            luz(9, 27, 6, 4); luz(81, 27, 6, 4);
            p(10, 40, 4, 26, '#a3352c'); p(10, 66, 2, 3, '#a3352c'); p(12, 66, 2, 2, '#a3352c');
            p(82, 40, 4, 26, '#a3352c'); p(82, 66, 2, 3, '#a3352c'); p(84, 66, 2, 2, '#a3352c');
            // copa
            p(42, 36, 12, 2, C.linea); p(43, 38, 10, 6, C.oro); p(45, 44, 6, 2, C.oro); p(47, 46, 2, 3, C.oro); p(44, 49, 8, 2, C.oro);
            p(40, 38, 3, 4, C.oro); p(53, 38, 3, 4, C.oro); p(45, 39, 2, 3, '#fff3c4');
            // puerta en arco
            for (var yd = 0; yd < 30; yd++) {
                var hw = yd < 6 ? Math.round(Math.sqrt(36 - (6 - yd) * (6 - yd)) + 5) : 11;
                p(48 - hw - 1, H - 32 + yd, hw * 2 + 2, 1, C.linea);
                p(48 - hw, H - 32 + yd, hw * 2, 1, '#3b2a1e');
            }
            luz(42, H - 22, 12, 4);
            p(36, H - 3, 24, 2, '#b9b19e');
        } else if (n.tipo === 'cartel') {
            caja(10, 40, 6, 26, C.madera2); caja(60, 40, 6, 26, C.madera2);
            caja(2, 4, 72, 42, C.madera);
            p(3, 5, 70, 2, '#c38c52');
            p(7, 9, 62, 32, '#20242c');
        } else if (n.tipo === 'taller') {
            caja(6, 26, 52, 32, '#b07a45');
            for (var pl = 30; pl < 56; pl += 4) p(7, pl, 50, 1, '#9a6838');
            tejado(32, 8, 26, 6, 1.4, '#5d6b7a', '#4a5664');
            caja(13, 36, 22, 22, '#3b2a1e');
            luz(15, 38, 18, 4);
            caja(40, 34, 12, 10, C.luz); luces.push([41, 35, 10, 8]); p(46, 35, 1, 8, C.linea);
        } else if (n.tipo === 'faro') {
            caja(1, 104, 34, 11, '#8d939c');
            for (var y = 24; y < 104; y++) {
                var hw2 = Math.round(8 + (y - 24) / 80 * 6);
                p(18 - hw2 - 1, y, hw2 * 2 + 2, 1, C.linea);
                p(18 - hw2, y, hw2 * 2, 1, Math.floor((y - 24) / 14) % 2 ? '#f3f3f3' : '#d6453a');
            }
            caja(6, 18, 24, 7, '#3a3f4b');
            caja(10, 8, 16, 11, C.luz); luces.push([11, 9, 14, 9]);
            caja(12, 2, 12, 7, '#d6453a');
            caja(15, 92, 7, 12, '#5a3a22');
        } else if (n.tipo === 'buzon') {
            caja(12, 22, 5, 20, C.madera2);
            caja(2, 6, 24, 18, C.acento);
            p(4, 4, 20, 3, C.linea); p(5, 5, 18, 2, C.acento);
            p(8, 12, 12, 2, C.linea);
            p(4, 8, 6, 1, '#ffffff66');
        }
        return { c: L.c, luces: luces };
    }

    /* ---------- Personaje ---------- */
    function dibujaHeroe(x, X, Y, dir, paso, trofeo) {
        var bob = paso ? -1 : 0, partes = [];
        function parte(px, py, w, h, c) { partes.push([px, py, w, h, c]); }
        var pa = paso === 1 ? -1 : 0, pb = paso === 2 ? -1 : 0;
        if (dir === 'izq' || dir === 'der') {
            parte(X - 3 + (paso === 1 ? -1 : 0), Y - 5, 3, 5, '#2b2f3d');
            parte(X + (paso === 2 ? 1 : 0), Y - 5, 3, 5, '#2b2f3d');
        } else {
            parte(X - 4, Y - 5 + pa, 3, 5 - pa, '#2b2f3d');
            parte(X + 1, Y - 5 + pb, 3, 5 - pb, '#2b2f3d');
        }
        if (dir === 'izq') parte(X + 3, Y - 12 + bob, 4, 7, '#f5a524');
        if (dir === 'der') parte(X - 7, Y - 12 + bob, 4, 7, '#f5a524');
        parte(X - 5, Y - 12 + bob, 10, 8, C.acento);
        if (trofeo) {
            parte(X - 8, Y - 26, 2, 14, '#2446b8'); parte(X + 6, Y - 26, 2, 14, '#2446b8');
        } else if (dir === 'abajo' || dir === 'arriba') {
            var sw = paso === 1 ? 1 : paso === 2 ? -1 : 0;
            parte(X - 7, Y - 11 + bob + sw, 2, 6, '#2446b8');
            parte(X + 5, Y - 11 + bob - sw, 2, 6, '#2446b8');
        } else {
            var ax = paso === 1 ? -1 : paso === 2 ? 1 : 0;
            parte(X - 1 + ax, Y - 11 + bob, 3, 6, '#2446b8');
        }
        if (dir === 'arriba') parte(X - 4, Y - 12 + bob, 8, 6, '#f5a524');
        parte(X - 5, Y - 21 + bob, 10, 9, '#f1c7a3');
        x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X - 6, Y - 1, 12, 3);
        partes.forEach(function (q) { x.fillStyle = C.linea; x.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2); });
        partes.forEach(function (q) { x.fillStyle = q[4]; x.fillRect(q[0], q[1], q[2], q[3]); });
        if (trofeo) { x.fillStyle = '#f1c7a3'; x.fillRect(X - 8, Y - 28, 2, 2); x.fillRect(X + 6, Y - 28, 2, 2); }
        x.fillStyle = '#2446b8'; x.fillRect(X - 5, Y - 6 + bob, 10, 2);
        x.fillStyle = '#3b2416';
        var hy = Y - 21 + bob;
        if (dir === 'arriba') x.fillRect(X - 5, hy, 10, 8);
        else if (dir === 'abajo') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 1, 3); x.fillRect(X + 4, hy + 3, 1, 3); x.fillRect(X - 2, hy + 3, 3, 1); }
        else if (dir === 'izq') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X, hy + 3, 5, 4); }
        else { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 5, 4); }
        x.fillStyle = '#1d2433';
        if (dir === 'abajo') { x.fillRect(X - 3, hy + 4, 1, 2); x.fillRect(X + 2, hy + 4, 1, 2); x.fillStyle = trofeo ? '#7a3b2e' : '#e8a08a'; x.fillRect(X - 1, hy + 7, 2, trofeo ? 2 : 1); }
        if (dir === 'izq') x.fillRect(X - 4, hy + 4, 1, 2);
        if (dir === 'der') x.fillRect(X + 3, hy + 4, 1, 2);
    }

    /* ---------- Estado ---------- */
    var juego, lienzoEl, ctx, mini, miniCtx, miniBase, imgArbol, imgMata, iconos = {}, websImgs = [];
    var heroe = { x: 0, y: 0, dir: 'abajo', dist: 0, moviendo: false, arriba: 0, trofeo: null };
    var hada = { x: 0, y: 0, vx: 0, vy: 0, estela: [] };
    var mapaCam = { x: 0, y: 0 }, cam = { x: 0, y: 0 }, esc = 3, escObj = 3, escBase = 3, dpr = 1;
    var teclas = {}, mando = { x: 0, y: 0 }, ruta = [], alLlegar = null, objetivo = null, marca = null;
    var sel = 0, cerca = null, abierta = -1, vistaMapa = false, enMarcha = false, ultimo = 0, reloj = 0, bloqueo = 0;
    var devueltas = [], cuerpoPanel, panel, globo, globoTexto, cola = [], dicho = {}, quieto = 0, consejo = 0, frase = null;
    var particulas = [], oscuro = true, cw = 0, ch = 0, miniReloj = 0, abriendo = null;
    var vistos = {};
    try { vistos = JSON.parse(guardado('gemas') || '{}') || {}; } catch (e) { vistos = {}; }
    var tactil = window.matchMedia('(pointer: coarse)').matches;
    function total() { return PANTALLAS.filter(function (p) { return vistos[p.id]; }).length; }
    function appsAbiertas() { return APPS.filter(function (a) { return vistos[a.id]; }).length; }

    function libreCasilla(tx, ty) {
        if (!dentro(tx, ty)) return false;
        var i = ix(tx, ty), s = E.suelo[i];
        return !E.solido[i] && s !== AGUA && s !== MURO;
    }
    function librePx(x, y) { return libreCasilla(Math.floor(x / T), Math.floor(y / T)); }
    function libreEn(x, y) { return librePx(x - 5, y - 4) && librePx(x + 4, y - 4) && librePx(x - 5, y) && librePx(x + 4, y); }

    /* ---------- Rutas (A*) ---------- */
    function buscarRuta(ax, ay, bx, by) {
        var MW = E.mw, MH = E.mh;
        var sx = Math.floor(ax / T), sy = Math.floor(ay / T), ex = Math.floor(bx / T), ey = Math.floor(by / T);
        if (!libreCasilla(ex, ey)) {
            var mejor = null, md = 1e9;
            for (var dy = -5; dy <= 5; dy++) for (var dx = -5; dx <= 5; dx++) {
                if (libreCasilla(ex + dx, ey + dy) && dx * dx + dy * dy < md) { md = dx * dx + dy * dy; mejor = [ex + dx, ey + dy]; }
            }
            if (!mejor) return null;
            ex = mejor[0]; ey = mejor[1]; bx = ex * T + 8; by = ey * T + 10;
        }
        var N = MW * MH, g = new Float32Array(N).fill(1e9), de = new Int32Array(N).fill(-1), cerrado = new Uint8Array(N);
        var monton = [], ini = ix(sx, sy), fin = ix(ex, ey);
        function h(i) { var x = i % MW, y = (i / MW) | 0, a = Math.abs(x - ex), b = Math.abs(y - ey); return Math.max(a, b) + 0.414 * Math.min(a, b); }
        function meter(i, f) {
            monton.push([f, i]);
            var k = monton.length - 1;
            while (k > 0) { var pd = (k - 1) >> 1; if (monton[pd][0] <= monton[k][0]) break; var t = monton[pd]; monton[pd] = monton[k]; monton[k] = t; k = pd; }
        }
        function sacar() {
            var top = monton[0], ult = monton.pop();
            if (monton.length) {
                monton[0] = ult;
                var k = 0;
                for (;;) {
                    var l = k * 2 + 1, r = l + 1, m = k;
                    if (l < monton.length && monton[l][0] < monton[m][0]) m = l;
                    if (r < monton.length && monton[r][0] < monton[m][0]) m = r;
                    if (m === k) break;
                    var t = monton[m]; monton[m] = monton[k]; monton[k] = t; k = m;
                }
            }
            return top[1];
        }
        g[ini] = 0; meter(ini, h(ini));
        var vecinos = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
        var vueltas = 0;
        while (monton.length && vueltas++ < 40000) {
            var c = sacar();
            if (c === fin) break;
            if (cerrado[c]) continue;
            cerrado[c] = 1;
            var cx = c % MW, cy = (c / MW) | 0;
            for (var v = 0; v < 8; v++) {
                var nx = cx + vecinos[v][0], ny = cy + vecinos[v][1];
                if (!libreCasilla(nx, ny)) continue;
                if (vecinos[v][2] > 1 && (!libreCasilla(cx + vecinos[v][0], cy) || !libreCasilla(cx, cy + vecinos[v][1]))) continue;
                var ni = ix(nx, ny), ng = g[c] + vecinos[v][2];
                if (ng < g[ni]) { g[ni] = ng; de[ni] = c; meter(ni, ng + h(ni)); }
            }
        }
        if (de[fin] < 0 && fin !== ini) return null;
        var camino = [], k = fin;
        while (k !== ini && k >= 0) { camino.push({ x: (k % MW) * T + 8, y: ((k / MW) | 0) * T + 10 }); k = de[k]; }
        camino.reverse();
        if (camino.length) camino[camino.length - 1] = { x: bx, y: by };
        else camino.push({ x: bx, y: by });
        var suave = [], desde = { x: ax, y: ay }, i = 0;
        while (i < camino.length) {
            var j = camino.length - 1;
            while (j > i && !lineaLibre(desde, camino[j])) j--;
            suave.push(camino[j]); desde = camino[j]; i = j + 1;
        }
        return suave;
    }
    function lineaLibre(a, b) {
        var d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 4);
        for (var i = 1; i <= n; i++) {
            var t = i / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
            if (!librePx(x - 6, y - 5) || !librePx(x + 5, y - 5) || !librePx(x - 6, y + 1) || !librePx(x + 5, y + 1)) return false;
        }
        return true;
    }
    function irAPunto(x, y, luego) {
        var r = buscarRuta(heroe.x, heroe.y, x, y);
        ruta = r || [];
        alLlegar = r ? luego || null : null;
        marca = r && !luego ? { x: ruta[ruta.length - 1].x, y: ruta[ruta.length - 1].y, t: 0 } : null;
        if (r && !ruta.length && luego) { alLlegar = null; luego(); }
        arrancar();
    }
    // Ir a una pantalla (edificio o cofre), pasando por la puerta de la sala si hace falta.
    function irA(i, entrar) {
        if (i < 0 || i >= PANTALLAS.length) return;
        sel = i;
        objetivo = { i: i, entrar: entrar };
        pintarHud();
        seguirObjetivo();
    }
    function seguirObjetivo() {
        if (!objetivo) return;
        var p = PANTALLAS[objetivo.i], entrar = objetivo.entrar;
        if (p.app) {
            if (E === mundo) { var t = nivelPorId('trofeos'); irAPunto(t.entrada.x, t.entrada.y, entrarSala); }
            else irAPunto(p.frente.x, p.frente.y, function () { objetivo = null; heroe.dir = 'arriba'; if (entrar) abrirCofre(p); });
        } else if (E === sala) {
            irAPunto(sala.pw / 2, sala.ph - 2, null);
        } else {
            irAPunto(p.entrada.x, p.entrada.y, function () { objetivo = null; heroe.dir = 'arriba'; if (entrar) abrir(pantalla(p.id)); });
        }
    }

    /* ---------- aRDi: bocadillos ---------- */
    function decir(t, prioridad) {
        if (prioridad) cola = [];
        cola.push(t);
        if (!globo.classList.contains('visible') || prioridad) siguienteFrase();
    }
    function siguienteFrase() {
        var t = cola.shift();
        if (!t) { frase = null; globo.classList.remove('visible'); return; }
        frase = { t: t, n: reducido ? 1e9 : 0, vida: 0 };
        globo.classList.add('visible');
        globoTexto.textContent = reducido ? texto(t) : '';
    }
    function avanzarFrase(dt) {
        if (!frase) return;
        var full = texto(frase.t);
        if (frase.n < full.length) {
            frase.n += dt * 48;
            globoTexto.textContent = full.slice(0, Math.floor(frase.n));
        } else {
            globoTexto.textContent = full;
            frase.vida += dt;
            if (frase.vida > 2.4 + full.length * 0.045) siguienteFrase();
        }
    }
    function pulsarGlobo() {
        if (!frase) return;
        var full = texto(frase.t);
        if (frase.n < full.length) { frase.n = full.length; globoTexto.textContent = full; }
        else siguienteFrase();
    }
    function frasesIntro() {
        return [
            { es: '¡Hola! Soy aRDi y te acompaño por la carrera de Rodrigo.', en: 'Hi! I\'m aRDi, and I\'ll guide you through Rodrigo\'s career.' },
            tactil
                ? { es: 'Usa el mando o toca el mapa para moverte.', en: 'Use the pad or tap the map to move.' }
                : { es: 'Muévete con WASD o las flechas, o haz clic en el mapa.', en: 'Move with WASD or the arrow keys, or click on the map.' },
            tactil
                ? { es: 'Junto a una puerta, pulsa A para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press A to go in. There are 15 gems!' }
                : { es: 'Junto a una puerta, pulsa E para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press E to go in. There are 15 gems!' }
        ];
    }
    var CONSEJOS = [
        { es: 'El minimapa de la esquina te lleva a cualquier sitio: tócalo.', en: 'The minimap in the corner takes you anywhere: tap it.' },
        { es: 'Las flechas de arriba te llevan al nivel siguiente.', en: 'The arrows at the top take you to the next level.' },
        { es: 'En el faro puedes preguntarle cosas a su IA.', en: 'At the lighthouse you can ask his AI anything.' },
        { es: 'Las gemas que flotan marcan lo que te queda por ver.', en: 'Floating gems mark what you still have to see.' }
    ];

    /* ---------- Construcción ---------- */
    function crear() {
        var gen = generarMundo();
        generarSala();
        mundo.img = pintarSuelo(mundo);
        sala.img = pintarSuelo(sala);
        E = mundo;
        imgArbol = spriteArbol();
        imgMata = spriteMata();
        gen.arboles.forEach(function (a) { mundo.objetos.push({ img: imgArbol, x: a.x * T, y: a.y * T - 2, base: (a.y + 2) * T - 3, w: 32, h: 34 }); });
        gen.matas.forEach(function (m) { mundo.objetos.push({ img: imgMata, x: m.x * T, y: m.y * T, base: m.y * T + 14, w: 16, h: 16 }); });
        var fcx = (ANILLO.x + 0.5) * T, fcy = (ANILLO.y + 0.5) * T;
        mundo.objetos.push({ fuente: true, x: fcx - 26, y: fcy - 34, base: fcy + 14, w: 52, h: 52 });
        FAROLAS.forEach(function (f) { mundo.objetos.push({ farola: true, x: f[0] * T, y: f[1] * T - 18, base: f[1] * T + 14, w: 16, h: 34, cx: f[0] * T + 8, cy: f[1] * T + 14 }); });
        NIVELES.forEach(function (n, i) {
            var s = spriteEdificio(n, i);
            n.sprite = s;
            mundo.objetos.push({ img: s.c, x: n.px - n.w / 2, y: n.py - n.h, base: n.py, w: n.w, h: n.h, nivel: n });
        });
        APPS.forEach(function (a) {
            var im = new Image(); im.src = 'img/apps/' + a.icono + '-icono.webp'; iconos[a.icono] = im;
            sala.objetos.push({ cofre: a, x: a.cx - 12, y: a.cy - 30, base: a.cy + 6, w: 24, h: 40 });
        });
        ['boda-finca', 'tumenu', 'urbapadel', 'godafly', 'lullcam'].forEach(function (w) { var im = new Image(); im.src = 'img/webs/' + w + '.webp'; websImgs.push(im); });

        juego = document.createElement('div');
        juego.className = 'juego';
        juego.id = 'juego';
        juego.setAttribute('role', 'application');
        juego.setAttribute('aria-label', 'Rodrigo Dávila · modo juego');
        var inventario = PANTALLAS.map(function (p, i) {
            return '<li><button type="button" data-j-ir="' + i + '"><i class="inv-gema" data-gema="' + i + '"></i><span>' + bi(p) + '</span></button></li>';
        }).join('');
        juego.innerHTML =
            '<canvas class="juego-lienzo" aria-hidden="true"></canvas>' +
            '<div class="hada-globo" data-j-globo aria-live="polite"><p class="hada-nombre">aRDi</p><p class="hada-texto" data-j-globo-texto></p></div>' +
            '<div class="fundido" data-j-fundido></div>' +
            '<div class="hud hud-arriba">' +
                '<p class="hud-marca"><span class="marca-sello" aria-hidden="true">RD</span><span>Rodrigo Dávila</span></p>' +
                '<div class="hud-gemas-caja"><button type="button" class="hud-gemas" data-j-gemas aria-expanded="false"><i class="gema-icono" aria-hidden="true"></i><span class="gemas-cuenta" data-j-cuenta></span><span class="gemas-txt"><span lang="es">gemas</span><span lang="en">gems</span></span></button>' +
                    '<div class="inventario" data-j-inventario hidden><p class="inventario-titulo"><span lang="es">Tus gemas</span><span lang="en">Your gems</span></p><ol>' + inventario + '</ol>' +
                    '<button type="button" class="inventario-reinicio" data-j-reinicio><span lang="es">Empezar de cero</span><span lang="en">Start over</span></button></div></div>' +
                '<div class="hud-botones">' +
                    '<button type="button" class="hud-boton" data-j-mapa><span lang="es">Mapa</span><span lang="en">Map</span></button>' +
                    '<button type="button" class="hud-boton" data-j-idioma><span lang="es">EN</span><span lang="en">ES</span></button>' +
                    '<button type="button" class="hud-boton hud-clasica" data-j-clasica><span lang="es">Versión clásica</span><span lang="en">Classic version</span></button>' +
                '</div>' +
            '</div>' +
            '<canvas class="minimapa" data-j-mini aria-label="Minimapa"></canvas>' +
            '<div class="hud-niveles">' +
                '<button type="button" class="hud-paso" data-j-paso="-1" aria-label="Anterior">◀</button>' +
                '<button type="button" class="hud-entrar" data-j-entrar><span class="hud-nivel" data-j-num></span><strong data-j-nombre></strong><span class="hud-accion" data-j-accion></span></button>' +
                '<button type="button" class="hud-paso" data-j-paso="1" aria-label="Siguiente">▶</button>' +
            '</div>' +
            '<p class="hud-ayuda"><span lang="es"><kbd>WASD</kbd> moverte · <kbd>E</kbd> entrar · <kbd>M</kbd> mapa · o haz clic</span><span lang="en"><kbd>WASD</kbd> move · <kbd>E</kbd> enter · <kbd>M</kbd> map · or click</span></p>' +
            '<div class="mando" data-j-mando aria-hidden="true"><span class="mando-bola"></span></div>' +
            '<button type="button" class="boton-a" data-j-a><span>A</span><small data-j-a-texto></small></button>' +
            '<p class="mapa-aviso">' + (tactil
                ? '<span lang="es">Toca un nivel para ir · arrastra para mirar</span><span lang="en">Tap a level to go · drag to look around</span>'
                : '<span lang="es">Haz clic en un nivel para ir · M o Esc para volver</span><span lang="en">Click a level to go there · M or Esc to go back</span>') + '</p>' +
            '<div class="juego-titulo" data-j-titulo>' +
                '<div class="titulo-caja">' +
                    '<p class="titulo-pixel"><span lang="es">Portfolio · modo aventura</span><span lang="en">Portfolio · adventure mode</span></p>' +
                    '<h2>Rodrigo Dávila</h2>' +
                    '<p class="titulo-lead"><span lang="es">Manager de IA Generativa y creador de apps. Recorre el mundo con aRDi: cada edificio es un nivel de mi carrera y cada cofre, una app.</span><span lang="en">Generative AI Manager and app maker. Explore the world with aRDi: every building is a level of my career and every chest, an app.</span></p>' +
                    '<div class="titulo-botones"><button type="button" class="boton boton-lleno" data-j-empezar><span lang="es">Empezar</span><span lang="en">Start</span></button>' +
                    '<button type="button" class="boton" data-j-clasica><span lang="es">Ver versión clásica</span><span lang="en">See classic version</span></button></div>' +
                    '<p class="titulo-ayuda"><span lang="es">Pulsa Enter para empezar</span><span lang="en">Press Enter to start</span></p>' +
                '</div>' +
            '</div>' +
            '<div class="juego-panel" role="dialog" aria-modal="true" aria-labelledby="j-panel-titulo" hidden>' +
                '<div class="panel-caja">' +
                    '<div class="panel-cabeza">' +
                        '<div><p class="panel-num" data-j-panel-num></p><h2 id="j-panel-titulo" tabindex="-1" data-j-panel-titulo></h2></div>' +
                        '<button type="button" class="panel-cerrar" data-j-cerrar><span lang="es">Volver al mapa</span><span lang="en">Back to map</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
                    '</div>' +
                    '<div class="panel-cuerpo" data-j-cuerpo></div>' +
                    '<div class="panel-pie">' +
                        '<button type="button" class="boton" data-j-panel-paso="-1"><span aria-hidden="true">◀ </span><span lang="es">Anterior</span><span lang="en">Previous</span></button>' +
                        '<button type="button" class="boton boton-lleno" data-j-panel-paso="1"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(juego);
        lienzoEl = juego.querySelector('.juego-lienzo');
        ctx = lienzoEl.getContext('2d');
        mini = juego.querySelector('[data-j-mini]');
        miniCtx = mini.getContext('2d');
        panel = juego.querySelector('.juego-panel');
        cuerpoPanel = juego.querySelector('[data-j-cuerpo]');
        globo = juego.querySelector('[data-j-globo]');
        globoTexto = juego.querySelector('[data-j-globo-texto]');
        if (tactil) juego.classList.add('tactil');

        var n0 = NIVELES[0];
        heroe.x = n0.entrada.x; heroe.y = n0.entrada.y + 6;
        hada.x = heroe.x + 14; hada.y = heroe.y - 30;
        cam.x = heroe.x; cam.y = heroe.y - 16;

        // Toque o clic sobre el mapa: lleva al personaje; en el mapa completo, arrastrar lo desplaza.
        var inicio = null;
        lienzoEl.addEventListener('pointerdown', function (e) { inicio = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY }; });
        lienzoEl.addEventListener('pointercancel', function () { inicio = null; });
        lienzoEl.addEventListener('pointerup', function (e) {
            if (!inicio) return;
            var lejos = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12;
            inicio = null;
            if (lejos || abierta >= 0 || abriendo) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            if (vistaMapa) cerrarMapa();
            tocar(w.x, w.y);
        });
        lienzoEl.addEventListener('pointermove', function (e) {
            if (vistaMapa && inicio) {
                var v = vistaRect();
                mapaCam.x = Math.max(Math.min(v.w / 2, E.pw / 2), Math.min(Math.max(E.pw - v.w / 2, E.pw / 2), mapaCam.x - (e.clientX - inicio.ux) * dpr / esc));
                mapaCam.y = Math.max(Math.min(v.h / 2, E.ph / 2), Math.min(Math.max(E.ph - v.h / 2, E.ph / 2), mapaCam.y - (e.clientY - inicio.uy) * dpr / esc));
                cam.x = mapaCam.x; cam.y = mapaCam.y;
                inicio.ux = e.clientX; inicio.uy = e.clientY;
                return;
            }
            if (tactil) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            lienzoEl.style.cursor = cosaEn(w.x, w.y) ? 'pointer' : 'crosshair';
        });
        mini.addEventListener('click', function (e) {
            if (abierta >= 0 || abriendo) return;
            var r = mini.getBoundingClientRect();
            var wx = (e.clientX - r.left) / r.width * mundo.pw, wy = (e.clientY - r.top) / r.height * mundo.ph;
            var mejor = null, md = 60;
            NIVELES.forEach(function (n) { var d = Math.hypot(n.px - wx, n.py - 20 - wy); if (d < md) { md = d; mejor = n; } });
            if (mejor) { irANivel(mejor); return; }
            if (E === mundo) irAPunto(wx, wy);
        });

        // Mando táctil
        var mandoEl = juego.querySelector('[data-j-mando]'), bola = mandoEl.querySelector('.mando-bola'), idMando = null;
        function moverMando(e) {
            var r = mandoEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), max = r.width * 0.36;
            if (d > max) { dx *= max / d; dy *= max / d; }
            bola.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            mando.x = dx / max; mando.y = dy / max;
            if (Math.hypot(mando.x, mando.y) < 0.2) { mando.x = 0; mando.y = 0; }
            arrancar();
        }
        mandoEl.addEventListener('pointerdown', function (e) { idMando = e.pointerId; mandoEl.setPointerCapture(e.pointerId); mandoEl.classList.add('activo'); ruta = []; moverMando(e); });
        mandoEl.addEventListener('pointermove', function (e) { if (e.pointerId === idMando) moverMando(e); });
        function soltar(e) { if (e.pointerId !== idMando) return; idMando = null; mando.x = 0; mando.y = 0; bola.style.transform = ''; mandoEl.classList.remove('activo'); }
        mandoEl.addEventListener('pointerup', soltar);
        mandoEl.addEventListener('pointercancel', soltar);
        juego.querySelector('[data-j-a]').addEventListener('click', accion);

        juego.querySelectorAll('[data-j-paso]').forEach(function (b) {
            b.addEventListener('click', function () { irA(sel + Number(b.getAttribute('data-j-paso')), false); });
        });
        juego.querySelector('[data-j-entrar]').addEventListener('click', accion);
        juego.querySelectorAll('[data-j-panel-paso]').forEach(function (b) {
            b.addEventListener('click', function () {
                var n = abierta + Number(b.getAttribute('data-j-panel-paso'));
                if (n < 0 || n >= PANTALLAS.length) { cerrar(); return; }
                saltarA(n);
            });
        });
        juego.querySelector('[data-j-cerrar]').addEventListener('click', cerrar);
        juego.querySelector('[data-j-mapa]').addEventListener('click', function () { if (vistaMapa) cerrarMapa(); else abrirMapa(); });
        var inv = juego.querySelector('[data-j-inventario]'), botonGemas = juego.querySelector('[data-j-gemas]');
        botonGemas.addEventListener('click', function () { inv.hidden = !inv.hidden; botonGemas.setAttribute('aria-expanded', String(!inv.hidden)); });
        inv.addEventListener('click', function (e) {
            if (e.target.closest('[data-j-reinicio]')) {
                vistos = {}; guardar('gemas', '{}');
                APPS.forEach(function (a) { a.abierto = false; });
                inv.hidden = true; botonGemas.setAttribute('aria-expanded', 'false');
                decir({ es: '¡Gemas a cero! A por las 15 otra vez.', en: 'Gems reset! Go get all 15 again.' }, true);
                pintarHud();
                return;
            }
            var b = e.target.closest('[data-j-ir]');
            if (!b) return;
            inv.hidden = true; botonGemas.setAttribute('aria-expanded', 'false');
            irA(Number(b.getAttribute('data-j-ir')), true);
        });
        globo.addEventListener('click', pulsarGlobo);
        cuerpoPanel.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute('href').slice(1);
            var n = PANTALLAS.findIndex(function (x) { return x.id === id || (x.piezas || []).some(function (p) { return p.indexOf('#' + id) === 0; }); });
            if (n < 0) return;
            e.preventDefault();
            saltarA(n);
        });
        juego.querySelectorAll('[data-j-clasica]').forEach(function (b) { b.addEventListener('click', salir); });
        juego.querySelector('[data-j-empezar]').addEventListener('click', empezar);
        juego.querySelector('[data-j-idioma]').addEventListener('click', function () {
            var b = document.querySelector('.barra [data-cambiar-idioma]');
            if (b) b.click();
            pintarHud();
        });
        document.addEventListener('keydown', tecla);
        document.addEventListener('keyup', function (e) { teclas[e.key.toLowerCase()] = false; });
        window.addEventListener('blur', function () { teclas = {}; });
        window.addEventListener('resize', medir);
        new MutationObserver(function () { pintarHud(); mirarTema(); }).observe(raiz, { attributes: true, attributeFilter: ['data-lang', 'data-theme'] });
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', mirarTema);
        mirarTema();
        // Base del minimapa: el suelo del mundo reducido
        var mb = lienzo(mundo.mw * 2, mundo.mh * 2);
        mb.x.imageSmoothingEnabled = true;
        mb.x.drawImage(mundo.img, 0, 0, mundo.mw * 2, mundo.mh * 2);
        miniBase = mb.c;
        medir();
    }

    function tocar(x, y) {
        var c = cosaEn(x, y);
        if (c && c.app) { irA(pantalla(c.id), true); return; }
        if (c) { irANivel(c); return; }
        if (E === sala && y > sala.ph - 20) { irAPunto(sala.pw / 2, sala.ph - 2); return; }
        objetivo = null;
        irAPunto(x, y);
    }
    function irANivel(n) {
        if (n.sala) {
            if (E === sala) return;
            objetivo = null;
            irAPunto(n.entrada.x, n.entrada.y, entrarSala);
            return;
        }
        irA(pantalla(n.id), true);
    }

    function mirarTema() {
        var t = raiz.getAttribute('data-theme');
        oscuro = t ? t === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    function medir() {
        if (!juego) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        cw = Math.round(lienzoEl.clientWidth * dpr); ch = Math.round(lienzoEl.clientHeight * dpr);
        lienzoEl.width = cw; lienzoEl.height = ch;
        var vw = lienzoEl.clientWidth, vh = lienzoEl.clientHeight;
        // Se ven unas 48 casillas de ancho en escritorio y unas 22 en un móvil vertical.
        var zoom = Math.max(1.1, Math.min(vw / (48 * T), vh / (28 * T)));
        escBase = Math.max(1, Math.round(zoom * dpr));
        escObj = escalaActual();
        esc = escObj;
        var mw = Math.round(mini.clientWidth * dpr), mh = Math.round(mini.clientHeight * dpr);
        if (mw && (mini.width !== mw || mini.height !== mh)) { mini.width = mw; mini.height = mh; }
        arrancar();
    }
    function escalaActual() {
        if (vistaMapa) return ch > cw ? ch / mundo.ph * 0.92 : Math.min(cw / mundo.pw, ch / mundo.ph) * 0.96;
        // En vertical la sala no cabe entera: se ve un trozo y la cámara sigue al personaje.
        if (E === sala) return Math.max(escBase, Math.min(cw / (sala.pw * (cw < ch ? 0.6 : 1) + 48 * dpr), ch / (sala.ph + 150 * dpr)));
        return escBase;
    }

    function cosaEn(x, y) {
        if (E === sala) {
            for (var k = 0; k < APPS.length; k++) { var a = APPS[k]; if (Math.abs(x - a.cx) < 16 && y > a.cy - 34 && y < a.cy + 12) return a; }
            return null;
        }
        for (var i = 0; i < NIVELES.length; i++) {
            var n = NIVELES[i];
            if (x > n.px - n.w / 2 - 4 && x < n.px + n.w / 2 + 4 && y > n.py - n.h - n.extra - 8 && y < n.py + (vistaMapa ? 44 : 16)) return n;
        }
        return null;
    }
    function vistaRect() {
        var vw = cw / esc, vh = ch / esc;
        var l = cam.x - vw / 2, t = cam.y - vh / 2;
        if (vw < E.pw) l = Math.max(0, Math.min(E.pw - vw, l)); else l = (E.pw - vw) / 2;
        // En móvil la cámara puede pasar del borde de abajo para que los mandos no tapen al personaje
        var abajo = tactil && E === mundo && !vistaMapa ? 170 * dpr / esc : 0;
        if (vh < E.ph + abajo) t = Math.max(0, Math.min(E.ph + abajo - vh, t)); else t = (E.ph - vh) / 2;
        return { l: l, t: t, w: vw, h: vh };
    }
    function aMundo(sx, sy) { var v = vistaRect(); return { x: v.l + sx / esc, y: v.t + sy / esc }; }

    function abrirMapa() {
        if (abierta >= 0 || E !== mundo) return;
        mapaCam.x = ch > cw ? heroe.x : mundo.pw / 2; mapaCam.y = mundo.ph / 2;
        vistaMapa = true; escObj = escalaActual(); ruta = [];
        juego.classList.add('en-mapa');
        arrancar();
    }
    function cerrarMapa() {
        vistaMapa = false; escObj = escalaActual();
        juego.classList.remove('en-mapa');
        arrancar();
    }

    /* ---------- Cambiar de escena ---------- */
    function fundido(fn) {
        var f = juego.querySelector('[data-j-fundido]');
        if (reducido) { fn(); return; }
        bloqueo = 1;
        f.classList.add('negro');
        setTimeout(function () { fn(); f.classList.remove('negro'); bloqueo = 0; }, 260);
    }
    function ponerEscena(s, x, y, dir) {
        E = s;
        heroe.x = x; heroe.y = y; heroe.dir = dir;
        hada.x = x + 14; hada.y = y - 30; hada.vx = 0; hada.vy = 0; hada.estela = [];
        ruta = []; marca = null; alLlegar = null;
        escObj = escalaActual(); esc = escObj;
        cam.x = x; cam.y = y - 16;
        juego.classList.toggle('en-sala', s === sala);
        pintarHud();
    }
    function entrarSala() {
        fundido(function () {
            ponerEscena(sala, sala.pw / 2, sala.ph - 10, 'arriba');
            if (!dicho.sala) { dicho.sala = 1; decir({ es: '¡Las apps de Rodrigo! Cada cofre guarda una. Acércate y ábrelos.', en: 'Rodrigo\'s apps! Every chest holds one. Walk up and open them.' }, true); }
            setTimeout(seguirObjetivo, 300);
        });
    }
    function salirSala() {
        var t = nivelPorId('trofeos');
        fundido(function () {
            ponerEscena(mundo, t.entrada.x, t.entrada.y + 6, 'abajo');
            setTimeout(seguirObjetivo, 300);
        });
    }

    /* ---------- HUD ---------- */
    function pintarHud() {
        if (!juego) return;
        var l = idioma();
        var accion = cerca ? (cerca.app ? (vistos[cerca.id] ? (l === 'es' ? 'Ver' : 'View') : (l === 'es' ? 'Abrir' : 'Open')) : (l === 'es' ? 'Entrar' : 'Enter')) : (l === 'es' ? 'Ir' : 'Go');
        var nombre, num;
        if (cerca && cerca.sala) { nombre = cerca[l]; num = appsAbiertas() + ' / 5 ' + (l === 'es' ? 'cofres' : 'chests'); }
        else {
            var p = cerca ? PANTALLAS[pantalla(cerca.id)] : PANTALLAS[sel];
            nombre = p[l]; num = (l === 'es' ? 'Nivel ' : 'Level ') + (pantalla(p.id) + 1) + ' / ' + PANTALLAS.length;
        }
        juego.querySelector('[data-j-num]').textContent = num;
        juego.querySelector('[data-j-nombre]').textContent = nombre;
        juego.querySelector('[data-j-accion]').textContent = accion;
        juego.querySelector('[data-j-a-texto]').textContent = accion;
        juego.querySelector('[data-j-a]').classList.toggle('listo', !!cerca);
        juego.querySelector('[data-j-entrar]').classList.toggle('listo', !!cerca);
        juego.querySelector('[data-j-cuenta]').textContent = total() + ' / ' + PANTALLAS.length;
        juego.querySelectorAll('[data-gema]').forEach(function (g) {
            var lleno = !!vistos[PANTALLAS[Number(g.getAttribute('data-gema'))].id];
            g.classList.toggle('llena', lleno);
            g.closest('li').classList.toggle('hecho', lleno);
        });
        juego.querySelectorAll('[data-j-paso]').forEach(function (b) {
            var d = Number(b.getAttribute('data-j-paso'));
            b.disabled = sel + d < 0 || sel + d >= PANTALLAS.length;
        });
    }
    function accion() {
        if (vistaMapa) { cerrarMapa(); return; }
        if (abriendo || bloqueo) return;
        if (cerca) {
            if (cerca.sala) entrarSala();
            else if (cerca.app) abrirCofre(cerca);
            else abrir(pantalla(cerca.id));
        } else irA(sel, true);
    }

    /* ---------- Cofres ---------- */
    function abrirCofre(a) {
        if (vistos[a.id]) { abrir(pantalla(a.id)); return; }
        abriendo = { a: a, t: 0 };
        teclas = {}; ruta = []; objetivo = null;
        heroe.dir = 'abajo';
        a.abierto = true;
        decir({ es: '¡Has encontrado ' + a.es + '!', en: 'You found ' + a.en + '!' }, true);
        for (var k = 0; k < 30; k++) particulas.push({ x: a.cx, y: a.cy - 6, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 60, v: 1 + Math.random() * 0.6, c: ['#ffd36b', '#fff3c4', '#3ee6a0', '#ffffff'][k % 4] });
    }

    /* ---------- Bucle ---------- */
    function arrancar() {
        if (enMarcha || !juego || juego.hidden || abierta >= 0) return;
        enMarcha = true;
        ultimo = performance.now();
        requestAnimationFrame(paso);
    }
    function paso(t) {
        if (!enMarcha) return;
        if (juego.hidden || abierta >= 0 || document.hidden) { enMarcha = false; return; }
        var dt = Math.min(0.05, (t - ultimo) / 1000);
        ultimo = t; reloj += dt;
        actualizar(dt);
        if (abierta >= 0) { enMarcha = false; return; }
        dibujar();
        miniReloj -= dt;
        if (miniReloj <= 0) { miniReloj = 0.12; dibujarMini(); }
        requestAnimationFrame(paso);
    }

    function actualizar(dt) {
        var ix2 = 0, iy2 = 0;
        var libre = !vistaMapa && !abriendo && !bloqueo && juego.querySelector('[data-j-titulo]').hidden;
        if (libre) {
            if (teclas.a || teclas.arrowleft) ix2 -= 1;
            if (teclas.d || teclas.arrowright) ix2 += 1;
            if (teclas.w || teclas.arrowup) iy2 -= 1;
            if (teclas.s || teclas.arrowdown) iy2 += 1;
            if (mando.x || mando.y) { ix2 = mando.x; iy2 = mando.y; }
        }
        var vel = 92, vx = 0, vy = 0;
        if (ix2 || iy2) {
            ruta = []; alLlegar = null; objetivo = null; marca = null;
            var m = Math.hypot(ix2, iy2), k = Math.min(1, m) / m;
            vx = ix2 * k * vel; vy = iy2 * k * vel;
        } else if (ruta.length && libre) {
            var obj = ruta[0], dx = obj.x - heroe.x, dy = obj.y - heroe.y, d = Math.hypot(dx, dy);
            if (d < 3) { ruta.shift(); if (!ruta.length) { marca = null; var f = alLlegar; alLlegar = null; if (f) f(); } }
            else { vx = dx / d * 124; vy = dy / d * 124; }
        }
        var x0 = heroe.x, y0 = heroe.y;
        if (vx) {
            var nx = heroe.x + vx * dt;
            if (libreEn(nx, heroe.y)) heroe.x = nx;
            else if (!vy) { if (libreEn(nx, heroe.y - 5)) heroe.y -= Math.abs(vx) * dt; else if (libreEn(nx, heroe.y + 5)) heroe.y += Math.abs(vx) * dt; }
        }
        if (vy) {
            var ny = heroe.y + vy * dt;
            if (libreEn(heroe.x, ny)) heroe.y = ny;
            else if (!vx) { if (libreEn(heroe.x - 5, ny)) heroe.x -= Math.abs(vy) * dt; else if (libreEn(heroe.x + 5, ny)) heroe.x += Math.abs(vy) * dt; }
        }
        var mov = Math.hypot(heroe.x - x0, heroe.y - y0);
        heroe.moviendo = mov > 0.01;
        if (vx || vy) heroe.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'izq' : 'der') : (vy < 0 ? 'arriba' : 'abajo');
        heroe.dist += mov;
        if (ruta.length && !heroe.moviendo && libre) {
            heroe.atasco = (heroe.atasco || 0) + dt;
            if (heroe.atasco > 0.5) { heroe.atasco = 0; var fin = ruta[ruta.length - 1], luego = alLlegar; irAPunto(fin.x, fin.y, luego); }
        } else heroe.atasco = 0;

        // Salir de la sala por la puerta
        if (E === sala && heroe.y > sala.ph - 5 && !bloqueo) { salirSala(); return; }

        // ¿Junto a una puerta o un cofre?
        var antes = cerca;
        cerca = null;
        if (E === mundo) NIVELES.forEach(function (n) { if (Math.hypot(heroe.x - n.entrada.x, heroe.y - n.entrada.y) < 18) cerca = n; });
        else APPS.forEach(function (a) { if (Math.hypot(heroe.x - a.frente.x, heroe.y - a.frente.y) < 16) cerca = a; });
        if (cerca !== antes) { if (cerca && !cerca.sala) sel = pantalla(cerca.id); pintarHud(); }
        // Empujar hacia la puerta también entra
        if (cerca && !cerca.app && iy2 < -0.5 && Math.abs(ix2) < 0.5 && heroe.y < cerca.entrada.y + 2) {
            heroe.arriba += dt;
            if (heroe.arriba > 0.18) { heroe.arriba = 0; teclas = {}; if (cerca.sala) entrarSala(); else abrir(pantalla(cerca.id)); return; }
        } else heroe.arriba = 0;

        // Cofre abriéndose: el personaje levanta la app y luego se abre su pantalla.
        if (abriendo) {
            abriendo.t += dt;
            heroe.trofeo = abriendo.t > 0.35 ? abriendo.a : null;
            if (abriendo.t > (reducido ? 0.2 : 1.7)) { var a2 = abriendo.a; abriendo = null; heroe.trofeo = null; abrir(pantalla(a2.id)); return; }
        }

        // aRDi comenta lo que tienes cerca
        if (E === mundo) NIVELES.forEach(function (n) {
            if (dicho[n.id]) return;
            if (Math.hypot(heroe.x - n.entrada.x, heroe.y - (n.py - 20)) < 90) { dicho[n.id] = 1; decir(n.hada); }
        });
        else APPS.forEach(function (a) {
            if (dicho[a.id] || vistos[a.id]) return;
            if (Math.hypot(heroe.x - a.frente.x, heroe.y - a.frente.y) < 30) { dicho[a.id] = 1; decir(a.hada); }
        });
        quieto = heroe.moviendo ? 0 : quieto + dt;
        if (quieto > 14 && !frase && juego.querySelector('[data-j-titulo]').hidden) { quieto = 0; decir(CONSEJOS[consejo++ % CONSEJOS.length]); }
        avanzarFrase(dt);

        // aRDi: muelle hacia un punto junto al personaje
        var lado = heroe.dir === 'izq' ? 1 : -1;
        var tx = heroe.x + lado * 16 + Math.sin(reloj * 1.3) * 6, ty = heroe.y - 30 + Math.sin(reloj * 3.1) * 4;
        var ax = (tx - hada.x) * 30 - hada.vx * 7, ay = (ty - hada.y) * 30 - hada.vy * 7;
        hada.vx += ax * dt; hada.vy += ay * dt;
        hada.x += hada.vx * dt; hada.y += hada.vy * dt;
        if (!reducido) {
            hada.estela.push({ x: hada.x + (Math.random() - 0.5) * 3, y: hada.y + (Math.random() - 0.5) * 3, v: 1 });
            if (hada.estela.length > 22) hada.estela.shift();
            hada.estela.forEach(function (p) { p.v -= dt * 1.8; p.y += dt * 6; });
        }
        particulas.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.v -= dt; });
        particulas = particulas.filter(function (p) { return p.v > 0; });
        if (marca) marca.t += dt;

        var kz = reducido ? 1 : 1 - Math.exp(-dt * 7);
        esc += (escObj - esc) * kz;
        if (Math.abs(escObj - esc) < 0.002) esc = escObj;
        var cx = vistaMapa ? mapaCam.x : heroe.x, cy = vistaMapa ? mapaCam.y : heroe.y - 16;
        var kc = reducido ? 1 : 1 - Math.exp(-dt * 6);
        cam.x += (cx - cam.x) * kc; cam.y += (cy - cam.y) * kc;
        var v = vistaRect();
        // El bocadillo va debajo del personaje, salvo si este está en la parte baja de la pantalla
        var gx = (heroe.x - v.l) * esc / dpr, gy = (heroe.y + 8 - v.t) * esc / dpr, arriba = gy > ch / dpr * 0.62;
        if (arriba) gy = (heroe.y - 34 - v.t) * esc / dpr;
        globo.classList.toggle('arriba', arriba);
        globo.style.transform = 'translate(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px)';
    }

    function dibujar() {
        var x = ctx, v = vistaRect(), i;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.imageSmoothingEnabled = esc < 1.5;
        x.fillStyle = E === sala ? '#0d0e13' : tactil ? C.copaO : C.agua; x.fillRect(0, 0, cw, ch);
        var ox = Math.round(-v.l * esc), oy = Math.round(-v.t * esc);
        x.setTransform(esc, 0, 0, esc, ox, oy);
        var sl = Math.max(0, Math.floor(v.l)), st = Math.max(0, Math.floor(v.t));
        var sw = Math.min(E.pw - sl, Math.ceil(v.w) + 2), sh = Math.min(E.ph - st, Math.ceil(v.h) + 2);
        x.drawImage(E.img, sl, st, sw, sh, sl, st, sw, sh);
        if (!reducido && E === mundo) {
            var fase = Math.floor(reloj * 2);
            for (var ty = Math.floor(v.t / T); ty <= Math.floor((v.t + v.h) / T); ty++) for (var tx = Math.floor(v.l / T); tx <= Math.floor((v.l + v.w) / T); tx++) {
                if (!dentro(tx, ty) || E.suelo[ix(tx, ty)] !== AGUA) continue;
                var hh = hash(tx * 3 + fase, ty * 7 - fase);
                if (hh < 0.12) { x.fillStyle = C.espuma; x.fillRect(tx * T + Math.floor(hh * 90), ty * T + 4 + Math.floor(hh * 60), 4, 1); }
            }
        }
        if (E === sala) pared(x);
        if (marca && !vistaMapa) {
            var rr = 4 + (marca.t * 10) % 5;
            x.fillStyle = '#ffffffcc';
            x.fillRect(marca.x - rr, marca.y, 2, 1); x.fillRect(marca.x + rr - 2, marca.y, 2, 1);
            x.fillRect(marca.x - 1, marca.y - rr / 2, 2, 1); x.fillRect(marca.x - 1, marca.y + rr / 2, 2, 1);
        }
        var lista = [];
        for (i = 0; i < E.objetos.length; i++) {
            var o = E.objetos[i];
            if (o.x + o.w < v.l - 40 || o.x > v.l + v.w + 40 || o.y + o.h < v.t - 60 || o.y > v.t + v.h + 60) continue;
            lista.push(o);
        }
        lista.push({ base: heroe.y, heroe: true });
        lista.sort(function (a, b) { return a.base - b.base; });
        lista.forEach(function (o) {
            if (o.heroe) {
                var fr = heroe.moviendo ? [1, 0, 2, 0][Math.floor(heroe.dist / 7) % 4] : 0;
                dibujaHeroe(x, Math.round(heroe.x), Math.round(heroe.y), heroe.trofeo ? 'abajo' : heroe.dir, fr, !!heroe.trofeo);
                if (heroe.trofeo) icono(x, heroe.trofeo, Math.round(heroe.x) - 8, Math.round(heroe.y) - 46, 16);
                return;
            }
            if (o.cofre) { cofre(x, o.cofre); return; }
            if (o.fuente) { fuente(x, o.x + 26, o.base - 14); return; }
            if (o.farola) { farola(x, o.cx, o.cy); return; }
            x.drawImage(o.img, Math.round(o.x), Math.round(o.y));
            if (o.nivel) extras(x, o.nivel);
        });
        particulas.forEach(function (p) { x.globalAlpha = Math.max(0, p.v); x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
        x.globalAlpha = 1;
        // Gemas flotantes en lo que falta por ver
        if (E === mundo) NIVELES.forEach(function (n) {
            var falta = n.sala ? appsAbiertas() < APPS.length : !vistos[n.id];
            if (!falta) return;
            var gy = n.py - n.h - n.extra - 14 + (reducido ? 0 : Math.sin(reloj * 3 + n.x) * 2);
            gemaMundo(x, n.px, gy, reloj + n.x);
        });
        // Flecha sobre el destino
        var ns = cerca || (E === mundo ? PANTALLAS[sel] : null);
        if (ns && !vistaMapa && ns.px) {
            var by = Math.round(ns.py - ns.h - ns.extra - 32 + Math.sin(reloj * 5) * 2);
            flecha(x, ns.px, by, !!cerca);
        } else if (ns && ns.app && E === sala && !vistaMapa) flecha(x, ns.cx, ns.cy - 44 + Math.sin(reloj * 5) * 2, !!cerca);
        else if (E === sala && PANTALLAS[sel].app && !vistaMapa) flecha(x, PANTALLAS[sel].cx, PANTALLAS[sel].cy - 44 + Math.sin(reloj * 5) * 2, false);
        // Noche (fuera) o antorchas (dentro)
        x.setTransform(1, 0, 0, 1, 0, 0);
        if (oscuro && E === mundo) {
            x.globalCompositeOperation = 'multiply';
            x.fillStyle = '#5b67a8'; x.fillRect(0, 0, cw, ch);
            x.globalCompositeOperation = 'source-over';
            x.setTransform(esc, 0, 0, esc, ox, oy);
            NIVELES.forEach(function (n) {
                var lx = n.px - n.w / 2, ly = n.py - n.h;
                if (lx > v.l + v.w || lx + n.w < v.l || ly > v.t + v.h || n.py < v.t) return;
                x.fillStyle = C.luz;
                n.sprite.luces.forEach(function (q) { x.fillRect(lx + q[0], ly + q[1], q[2], q[3]); });
            });
            x.globalCompositeOperation = 'lighter';
            NIVELES.forEach(function (n) { brillo(x, n.px, n.py - 6, 26, 'rgba(255,190,90,.16)'); });
            FAROLAS.forEach(function (f) { brillo(x, f[0] * T + 8, f[1] * T - 15, 30, 'rgba(255,200,110,.3)'); brillo(x, f[0] * T + 8, f[1] * T + 12, 26, 'rgba(255,190,90,.14)'); });
            var f = nivelPorId('chat');
            if (!reducido) { x.fillStyle = 'rgba(255,230,150,.16)'; haz(x, f.px, f.py - f.h + 13, reloj * 1.4); }
            x.globalCompositeOperation = 'source-over';
        }
        x.setTransform(esc, 0, 0, esc, ox, oy);
        if (E === sala) {
            x.globalCompositeOperation = 'lighter';
            [92, 148, 204, 260].forEach(function (tx2, k) { brillo(x, tx2, 26, 40 + Math.sin(reloj * 9 + k) * 2, 'rgba(255,170,70,.22)'); });
            x.globalCompositeOperation = 'source-over';
        }
        x.globalCompositeOperation = 'lighter';
        brillo(x, hada.x, hada.y, oscuro ? 34 : 18, oscuro ? 'rgba(130,200,255,.42)' : 'rgba(150,215,255,.35)');
        x.globalCompositeOperation = 'source-over';
        hada.estela.forEach(function (p) { if (p.v > 0) { x.globalAlpha = p.v * 0.7; x.fillStyle = '#d6f1ff'; x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } });
        x.globalAlpha = 1;
        var hx = Math.round(hada.x), hy = Math.round(hada.y), ala = Math.floor(reloj * 14) % 2;
        x.fillStyle = '#ffffffaa';
        x.fillRect(hx - 5, hy - 3 - ala, 3, 2 + ala); x.fillRect(hx + 3, hy - 3 - ala, 3, 2 + ala);
        x.fillStyle = '#9fdcff'; x.fillRect(hx - 2, hy - 2, 4, 4);
        x.fillStyle = '#ffffff'; x.fillRect(hx - 1, hy - 1, 2, 2);
        x.setTransform(1, 0, 0, 1, 0, 0);
        etiquetas(x, v);
    }

    function flecha(x, px, by, listo) {
        by = Math.round(by);
        x.fillStyle = C.linea; x.beginPath(); x.moveTo(px - 6, by - 1); x.lineTo(px + 6, by - 1); x.lineTo(px, by + 7); x.fill();
        x.fillStyle = listo ? C.luz : '#ffffff'; x.beginPath(); x.moveTo(px - 4, by); x.lineTo(px + 4, by); x.lineTo(px, by + 5); x.fill();
    }
    function gemaMundo(x, cx, cy, t) {
        var w = reducido ? 4 : Math.max(1, Math.round(Math.abs(Math.cos(t * 2.2)) * 4));
        cx = Math.round(cx); cy = Math.round(cy);
        x.fillStyle = C.linea;
        x.fillRect(cx - w - 1, cy - 4, w * 2 + 2, 9); x.fillRect(cx - w, cy - 6, w * 2, 13);
        x.fillStyle = C.gema;
        x.fillRect(cx - w, cy - 4, w * 2, 9); x.fillRect(cx - w + 1, cy - 5, Math.max(0, w * 2 - 2), 11);
        x.fillStyle = '#c9fbe5'; x.fillRect(cx - Math.max(1, w - 1), cy - 3, 1, 4);
    }
    function icono(x, a, X, Y, s) {
        var im = iconos[a.icono];
        x.fillStyle = C.linea; redondo(x, X - 1, Y - 1, s + 2, s + 2, 4); x.fill();
        if (im && im.complete && im.naturalWidth) {
            x.save(); redondo(x, X, Y, s, s, 3); x.clip();
            x.imageSmoothingEnabled = true;
            x.drawImage(im, X, Y, s, s);
            x.restore();
            x.imageSmoothingEnabled = esc < 1.5;
        }
    }
    function pared(x) {
        // Estandartes con el icono de cada app y antorchas entre ellos
        APPS.forEach(function (a) {
            var bx = a.cx - 10;
            x.fillStyle = C.linea; x.fillRect(bx - 1, 3, 22, 34);
            x.fillStyle = vistos[a.id] ? '#2f5bd8' : '#6a2a8a'; x.fillRect(bx, 4, 20, 30);
            x.fillStyle = C.oro; x.fillRect(bx, 4, 20, 2); x.fillRect(bx, 32, 20, 2);
            x.fillStyle = C.linea; x.beginPath(); x.moveTo(bx, 36); x.lineTo(bx + 10, 41); x.lineTo(bx + 20, 36); x.fill();
            x.fillStyle = vistos[a.id] ? '#2f5bd8' : '#6a2a8a'; x.beginPath(); x.moveTo(bx + 1, 34); x.lineTo(bx + 10, 39); x.lineTo(bx + 19, 34); x.fill();
            icono(x, a, bx + 3, 10, 14);
        });
        [92, 148, 204, 260].forEach(function (tx2, k) {
            x.fillStyle = C.linea; x.fillRect(tx2 - 2, 22, 4, 12);
            x.fillStyle = '#7d5330'; x.fillRect(tx2 - 1, 23, 2, 10);
            var fl = reducido ? 0 : Math.floor(reloj * 10 + k) % 3;
            x.fillStyle = '#ff7a2f'; x.fillRect(tx2 - 3, 15 - fl, 6, 7 + fl);
            x.fillStyle = '#ffd36b'; x.fillRect(tx2 - 2, 17 - fl, 4, 5 + fl);
            x.fillStyle = '#fff3c4'; x.fillRect(tx2 - 1, 19, 2, 2);
        });
    }
    function cofre(x, a) {
        var X = Math.round(a.cx - 10), Y = Math.round(a.cy - 10), abierto = !!vistos[a.id] || a.abierto;
        // tarima
        x.fillStyle = '#6f6a5d'; x.fillRect(X - 4, Y + 12, 28, 6);
        x.fillStyle = '#a19c8d'; x.fillRect(X - 3, Y + 12, 26, 2);
        x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X - 1, Y + 16, 22, 2);
        if (abierto) {
            x.fillStyle = C.linea; x.fillRect(X, Y - 7, 20, 9);
            x.fillStyle = '#6b4426'; x.fillRect(X + 1, Y - 6, 18, 7);
            x.fillStyle = C.oro; x.fillRect(X + 3, Y - 6, 2, 7); x.fillRect(X + 15, Y - 6, 2, 7);
        }
        x.fillStyle = C.linea; x.fillRect(X, Y, 20, 16);
        x.fillStyle = '#8a5a2b'; x.fillRect(X + 1, Y + 1, 18, 14);
        if (abierto) { x.fillStyle = '#2a1a10'; x.fillRect(X + 2, Y + 1, 16, 3); }
        else { x.fillStyle = '#a8743f'; x.fillRect(X + 1, Y + 1, 18, 5); x.fillStyle = C.linea; x.fillRect(X + 1, Y + 6, 18, 1); }
        x.fillStyle = C.oro; x.fillRect(X + 3, Y + 1, 2, 14); x.fillRect(X + 15, Y + 1, 2, 14);
        x.fillStyle = C.luz; x.fillRect(X + 8, Y + 5, 4, 5);
        x.fillStyle = C.linea; x.fillRect(X + 9, Y + 7, 2, 2);
        if (abierto) {
            x.globalCompositeOperation = 'lighter';
            brillo(x, a.cx, Y, 14 + (reducido ? 0 : Math.sin(reloj * 4) * 2), 'rgba(255,220,120,.25)');
            x.globalCompositeOperation = 'source-over';
        } else if (!reducido && Math.floor(reloj * 2 + a.cx) % 4 === 0) {
            x.fillStyle = '#ffffff'; x.fillRect(X + 17, Y + 2, 2, 2);
        }
    }

    function fuente(x, cx, cy) {
        // Pilón de piedra, agua y un surtidor con gotas
        cx = Math.round(cx); cy = Math.round(cy);
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(cx - 24, cy + 10, 48, 4);
        for (var dy = -13; dy <= 13; dy++) {
            var w = Math.round(24 * Math.sqrt(1 - (dy * dy) / 196));
            x.fillStyle = C.linea; x.fillRect(cx - w - 1, cy + dy, w * 2 + 2, 1);
            x.fillStyle = dy > 8 ? '#9a9383' : '#cfc8b6'; x.fillRect(cx - w, cy + dy, w * 2, 1);
        }
        for (dy = -9; dy <= 7; dy++) {
            var w2 = Math.round(19 * Math.sqrt(1 - (dy * dy) / 100));
            x.fillStyle = dy < -7 ? '#2f6fb3' : C.agua; x.fillRect(cx - w2, cy + dy - 1, w2 * 2, 1);
        }
        var f = reducido ? 0 : reloj * 6;
        x.fillStyle = C.agua2;
        for (var k = 0; k < 3; k++) { var rr = (f + k * 4) % 12 + 4; x.fillRect(cx - rr, cy - 1, 2, 1); x.fillRect(cx + rr - 2, cy - 1, 2, 1); }
        x.fillStyle = C.linea; x.fillRect(cx - 4, cy - 18, 8, 17);
        x.fillStyle = '#ddd6c4'; x.fillRect(cx - 3, cy - 17, 6, 15);
        x.fillStyle = C.linea; x.fillRect(cx - 7, cy - 21, 14, 4);
        x.fillStyle = '#e6dfcd'; x.fillRect(cx - 6, cy - 20, 12, 2);
        x.fillStyle = C.espuma; x.fillRect(cx - 1, cy - 30, 2, 9);
        for (k = 0; k < 6; k++) {
            var t = ((reducido ? 0.5 : reloj * 1.6) + k / 6) % 1, lado = k % 2 ? 1 : -1;
            x.fillStyle = k % 3 ? C.espuma : '#ffffff';
            x.fillRect(Math.round(cx + lado * (2 + t * 12)), Math.round(cy - 30 + t * 26 + t * t * 6 - 12 * Math.sin(t * Math.PI)), 2, 2);
        }
    }
    function farola(x, cx, cy) {
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(cx - 4, cy - 1, 8, 3);
        x.fillStyle = C.linea; x.fillRect(cx - 2, cy - 26, 4, 26); x.fillRect(cx - 4, cy - 3, 8, 3);
        x.fillStyle = '#4a5160'; x.fillRect(cx - 1, cy - 25, 2, 24);
        x.fillStyle = C.linea; x.fillRect(cx - 5, cy - 34, 10, 9);
        x.fillStyle = oscuro ? C.luz : '#fff3c4'; x.fillRect(cx - 4, cy - 33, 8, 7);
        x.fillStyle = C.linea; x.fillRect(cx - 3, cy - 36, 6, 2);
    }
    function brillo(x, cx, cy, r, color) {
        var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    function extras(x, n) {
        var t = reloj, top = n.py - n.h, i = n.x, bob = reducido ? 0 : Math.round(Math.sin(t * 2.4 + i) * 2);
        if (n.tipo === 'oficina') {
            x.fillStyle = Math.floor(t * 1.5 + i) % 2 ? '#ff5a4a' : '#7a2a24';
            x.fillRect(n.px - n.w / 2 + 40, top - 1, 2, 2);
        } else if (n.tipo === 'torre') {
            var cx = n.px, cy = top - 12, pts = [];
            for (var k = 0; k < 6; k++) {
                var a = (reducido ? 0 : t * 0.9) + k * Math.PI / 3;
                pts.push({ x: cx + Math.cos(a) * 26, y: cy + Math.sin(a) * 9, z: Math.sin(a) });
            }
            x.fillStyle = '#86a6ff88';
            pts.forEach(function (p) { linea(x, cx, cy, p.x, p.y); });
            pts.filter(function (p) { return p.z < 0; }).forEach(function (p, k2) { agente(x, p, k2, t); });
            x.fillStyle = C.linea; x.fillRect(cx - 4, cy - 4, 8, 8);
            x.fillStyle = C.luz; x.fillRect(cx - 3, cy - 3, 6, 6);
            x.fillStyle = '#fff3c4'; x.fillRect(cx - 2, cy - 2, 2, 2);
            pts.filter(function (p) { return p.z >= 0; }).forEach(function (p, k2) { agente(x, p, k2 + 3, t); });
        } else if (n.tipo === 'templo') {
            var cy2 = top - 8 + bob;
            x.fillStyle = C.linea;
            x.beginPath(); x.moveTo(n.px, cy2 - 9); x.lineTo(n.px + 6, cy2); x.lineTo(n.px, cy2 + 9); x.lineTo(n.px - 6, cy2); x.fill();
            x.fillStyle = '#7fe0ff';
            x.beginPath(); x.moveTo(n.px, cy2 - 7); x.lineTo(n.px + 4, cy2); x.lineTo(n.px, cy2 + 7); x.lineTo(n.px - 4, cy2); x.fill();
            x.fillStyle = '#e4fbff'; x.fillRect(n.px - 2, cy2 - 3, 2, 3);
        } else if (n.tipo === 'castillo') {
            [n.px - 36, n.px + 36].forEach(function (fx, k) {
                var on = Math.floor(t * 2 + k) % 2;
                x.fillStyle = C.linea; x.fillRect(fx, top - 14, 1, 14);
                x.fillStyle = '#c8463a'; x.fillRect(fx + 1, top - 14 + on, 8, 5);
            });
        } else if (n.tipo === 'cartel') {
            var w = websImgs[Math.floor(t / 3) % websImgs.length];
            if (w && w.complete && w.naturalWidth) {
                x.save(); x.beginPath(); x.rect(n.px - n.w / 2 + 7, top + 9, 62, 32); x.clip();
                x.imageSmoothingEnabled = true;
                var s = 62 / w.naturalWidth;
                x.drawImage(w, n.px - n.w / 2 + 7, top + 9, 62, w.naturalHeight * s);
                x.restore();
                x.imageSmoothingEnabled = esc < 1.5;
            }
        } else if (n.tipo === 'taller') {
            var gx = n.px + 26, gy = top + 10;
            x.save(); x.translate(gx, gy); x.rotate(reducido ? 0 : t * 1.2);
            x.fillStyle = C.linea;
            for (var d = 0; d < 8; d++) { x.rotate(Math.PI / 4); x.fillRect(-3, -11, 6, 5); }
            disco(x, 0, 0, 8, C.linea); disco(x, 0, 0, 7, '#c9ced8'); disco(x, 0, 0, 3, '#5d6b7a');
            x.restore();
        } else if (n.tipo === 'faro') {
            if (!reducido && !oscuro) { x.fillStyle = 'rgba(255,240,170,.18)'; haz(x, n.px, top + 13, t * 1.4); }
            var bx = n.px + 12, byy = top - 16 + bob;
            x.fillStyle = C.linea; x.fillRect(bx - 1, byy - 1, 26, 15); x.fillRect(bx + 2, byy + 13, 4, 4);
            x.fillStyle = '#ffffff'; x.fillRect(bx, byy, 24, 13); x.fillRect(bx + 3, byy + 13, 2, 2);
            for (var pd = 0; pd < 3; pd++) { x.fillStyle = Math.floor(t * 3) % 3 === pd ? C.acento : '#9aa6c7'; x.fillRect(bx + 5 + pd * 6, byy + 5, 3, 3); }
        } else if (n.tipo === 'buzon') {
            var arriba = Math.floor(t * 0.8 + i) % 3 !== 0;
            x.fillStyle = C.linea; x.fillRect(n.px + 12, top + 4, 2, 14);
            x.fillStyle = '#e4572e'; x.fillRect(n.px + 14, top + (arriba ? 4 : 12), 7, 5);
        }
    }
    function haz(x, lx, ly, ang) {
        for (var s = 0; s < 2; s++) {
            var a = ang + s * Math.PI;
            x.beginPath(); x.moveTo(lx, ly);
            x.lineTo(lx + Math.cos(a - 0.16) * 150, ly + Math.sin(a - 0.16) * 60);
            x.lineTo(lx + Math.cos(a + 0.16) * 150, ly + Math.sin(a + 0.16) * 60);
            x.fill();
        }
    }
    function agente(x, p, k, t) {
        var on = Math.floor(t * 2 + k) % 3 === 0;
        x.fillStyle = C.linea; x.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
        x.fillStyle = on ? C.luz : C.acento2; x.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
    }
    function linea(x, ax, ay, bx, by) {
        var n = Math.ceil(Math.hypot(bx - ax, by - ay) / 2);
        for (var i = 0; i <= n; i += 2) x.fillRect(Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n), 1, 1);
    }
    function redondo(x, X, Y, w, h, r) {
        x.beginPath();
        x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
        x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
    }

    function etiquetas(x, v) {
        var l = idioma(), fs = Math.round((vistaMapa ? 12 : 12) * dpr);
        x.font = fs + 'px Silkscreen, Geist, sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        var cosas = E === mundo ? NIVELES : APPS;
        cosas.forEach(function (n) {
            var sx, sy;
            if (E === mundo) {
                sx = (n.px - v.l) * esc;
                sy = vistaMapa ? (n.py - v.t) * esc + 12 * dpr : (n.py - n.h - n.extra - v.t) * esc - 52 * dpr;
            } else { sx = (n.cx - v.l) * esc; sy = (n.cy + 22 - v.t) * esc + 4 * dpr; }
            if (sx < -200 || sx > cw + 200 || sy < -50 || sy > ch + 50) return;
            var activo = n === cerca || (!cerca && PANTALLAS[sel] === n);
            if (E === mundo && !vistaMapa && !activo && Math.hypot(n.px - heroe.x, n.py - heroe.y) > 170) return;
            if (E === sala && cw < ch && !activo && Math.abs(n.cx - heroe.x) > 40) return;
            var hecho = n.sala ? appsAbiertas() === APPS.length : vistos[n.id];
            var num = n.sala ? '' : (pantalla(n.id) + 1) + ' ';
            var txt = (vistaMapa ? num : '') + n[l] + (n.sala ? ' ' + appsAbiertas() + '/5' : '');
            var w = x.measureText(txt).width + 18 * dpr + (hecho ? 12 * dpr : 0), h = fs + 12 * dpr;
            var X = Math.round(sx - w / 2), Y = Math.round(sy - h / 2);
            x.fillStyle = '#121620'; x.fillRect(X - dpr, Y - dpr, w + 2 * dpr, h + 2 * dpr);
            x.fillStyle = activo ? C.acento : '#232a38'; x.fillRect(X, Y, w, h);
            x.fillStyle = '#ffffff';
            x.fillText(txt, sx + (hecho ? 6 * dpr : 0), sy + dpr);
            if (hecho) gemaEtiqueta(x, X + 9 * dpr, sy, 4 * dpr);
        });
    }
    function gemaEtiqueta(x, cx, cy, r) {
        x.fillStyle = '#121620';
        x.beginPath(); x.moveTo(cx, cy - r - 1); x.lineTo(cx + r * 0.75 + 1, cy); x.lineTo(cx, cy + r + 1); x.lineTo(cx - r * 0.75 - 1, cy); x.fill();
        x.fillStyle = C.gema;
        x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.75, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.75, cy); x.fill();
    }

    function dibujarMini() {
        if (!mini.width || vistaMapa) return;
        var x = miniCtx, W = mini.width, H = mini.height, sx = W / mundo.pw, sy = H / mundo.ph;
        x.imageSmoothingEnabled = true;
        x.drawImage(miniBase, 0, 0, W, H);
        if (oscuro) { x.globalCompositeOperation = 'multiply'; x.fillStyle = '#7b86bd'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
        var r = Math.max(2, Math.round(2.5 * dpr));
        NIVELES.forEach(function (n) {
            var hecho = n.sala ? appsAbiertas() === APPS.length : vistos[n.id];
            x.fillStyle = C.linea; x.fillRect(n.px * sx - r - 1, (n.py - 12) * sy - r - 1, r * 2 + 2, r * 2 + 2);
            x.fillStyle = hecho ? C.gema : n.sala ? C.oro : '#ffffff';
            x.fillRect(n.px * sx - r, (n.py - 12) * sy - r, r * 2, r * 2);
        });
        var hx = E === mundo ? heroe.x : nivelPorId('trofeos').px, hy = E === mundo ? heroe.y : nivelPorId('trofeos').py;
        if (E === mundo) {
            var v = vistaRect();
            x.strokeStyle = '#ffffffaa'; x.lineWidth = dpr;
            x.strokeRect(v.l * sx, v.t * sy, v.w * sx, v.h * sy);
        }
        if (Math.floor(reloj * 3) % 2 === 0 || reducido) {
            x.fillStyle = '#ffffff'; x.fillRect(hx * sx - r - 1, hy * sy - r - 1, r * 2 + 2, r * 2 + 2);
            x.fillStyle = C.acento; x.fillRect(hx * sx - r, hy * sy - r, r * 2, r * 2);
        }
    }

    /* ---------- Panel ---------- */
    function sub(n) { return typeof n.sub === 'string' ? { es: n.sub, en: n.sub } : n.sub; }
    function abrir(i) {
        if (abierta >= 0 || i < 0) return;
        var n = PANTALLAS[i];
        abierta = i; sel = i;
        ruta = []; alLlegar = null; marca = null; teclas = {};
        cuerpoPanel.innerHTML = '';
        if (n.carrera) cuerpoPanel.innerHTML = htmlCarrera(CARRERA[n.id]);
        else n.piezas.forEach(function (s) {
            var el = document.querySelector(s);
            if (!el) return;
            var hueco = document.createComment('j');
            el.parentNode.insertBefore(hueco, el);
            devueltas.push({ el: el, hueco: hueco });
            var tag = el.parentNode.tagName;
            var envoltorio = tag === 'OL' || tag === 'UL' ? document.createElement(tag.toLowerCase()) : null;
            if (envoltorio) { envoltorio.className = el.parentNode.className; envoltorio.appendChild(el); cuerpoPanel.appendChild(envoltorio); }
            else cuerpoPanel.appendChild(el);
            el.querySelectorAll('.aparece').forEach(function (a) { a.classList.add('visto'); });
            if (el.classList.contains('aparece')) el.classList.add('visto');
        });
        juego.querySelector('[data-j-panel-num]').innerHTML = '<span lang="es">Nivel ' + (i + 1) + ' de ' + PANTALLAS.length + '</span><span lang="en">Level ' + (i + 1) + ' of ' + PANTALLAS.length + '</span> · ' + bi(sub(n));
        juego.querySelector('[data-j-panel-titulo]').innerHTML = bi(n);
        juego.querySelector('[data-j-panel-paso="-1"]').hidden = i === 0;
        var sig = juego.querySelector('[data-j-panel-paso="1"]');
        sig.innerHTML = i === PANTALLAS.length - 1
            ? '<span lang="es">Volver al mapa</span><span lang="en">Back to map</span>'
            : '<span lang="es">Siguiente<span class="sig-nombre">: ' + PANTALLAS[i + 1].es + '</span></span><span lang="en">Next<span class="sig-nombre">: ' + PANTALLAS[i + 1].en + '</span></span><span aria-hidden="true"> ▶</span>';
        panel.hidden = false;
        juego.querySelector('.panel-caja').scrollTop = 0;
        requestAnimationFrame(function () { panel.classList.add('abierto'); });
        juego.querySelector('[data-j-panel-titulo]').focus({ preventScroll: true });
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.preload = 'auto'; if (!reducido) v.play().catch(function () {}); });
        if (!vistos[n.id]) { vistos[n.id] = 1; guardar('gemas', JSON.stringify(vistos)); n.nueva = true; }
        enMarcha = false;
        pintarHud();
    }
    function vaciarPanel() {
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.pause(); });
        devueltas.forEach(function (d) { d.hueco.parentNode.insertBefore(d.el, d.hueco); d.hueco.remove(); });
        devueltas = [];
        cuerpoPanel.innerHTML = '';
    }
    // Desde el panel, pasar a otra pantalla directamente (el personaje aparece allí).
    function saltarA(i) {
        var p = PANTALLAS[i];
        vaciarPanel();
        abierta = -1;
        if (p.app) { if (E !== sala) ponerEscena(sala, p.frente.x, p.frente.y, 'arriba'); else { heroe.x = p.frente.x; heroe.y = p.frente.y; } }
        else { if (E !== mundo) ponerEscena(mundo, p.entrada.x, p.entrada.y + 6, 'abajo'); heroe.x = p.entrada.x; heroe.y = p.entrada.y + 6; }
        cam.x = heroe.x; cam.y = heroe.y - 16; hada.x = heroe.x + 14; hada.y = heroe.y - 30;
        recompensas();
        abrir(i);
    }
    function recompensas() {
        PANTALLAS.forEach(function (p) {
            if (!p.nueva) return;
            p.nueva = false;
            var n = total();
            if (n === PANTALLAS.length) decir({ es: '¡Las 15 gemas! Ya conoces a Rodrigo. ¿Le escribes? El buzón está al este, junto al muelle.', en: 'All 15 gems! Now you know Rodrigo. Want to write to him? The mailbox is east, by the pier.' }, true);
            else decir({ es: '¡Gema conseguida! Llevas ' + n + ' de 15.', en: 'Gem found! That\'s ' + n + ' of 15.' }, true);
            for (var k = 0; k < 26; k++) particulas.push({ x: heroe.x, y: heroe.y - 20, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 70, v: 1 + Math.random() * 0.6, c: ['#3ee6a0', '#ffd36b', '#9fdcff', '#ffffff'][k % 4] });
        });
    }
    function cerrar() {
        if (abierta < 0) return;
        var p = PANTALLAS[abierta];
        vaciarPanel();
        panel.classList.remove('abierto');
        panel.hidden = true;
        abierta = -1;
        if (p.app) { heroe.x = p.frente.x; heroe.y = p.frente.y + 4; }
        else { heroe.x = p.entrada.x; heroe.y = p.entrada.y + 6; }
        heroe.dir = 'abajo';
        recompensas();
        pintarHud();
        arrancar();
        juego.querySelector('[data-j-entrar]').focus({ preventScroll: true });
    }

    function tecla(e) {
        if (!raiz.classList.contains('en-juego')) return;
        var k = e.key.toLowerCase();
        if (e.target.closest && e.target.closest('input, textarea, select')) return;
        if (!juego.querySelector('[data-j-titulo]').hidden) {
            if (k === 'enter') { e.preventDefault(); empezar(); }
            return;
        }
        if (abierta >= 0) { if (k === 'escape') cerrar(); return; }
        var inv = juego.querySelector('[data-j-inventario]');
        if (k === 'escape' && !inv.hidden) { inv.hidden = true; return; }
        if (vistaMapa && (k === 'escape' || k === 'm')) { e.preventDefault(); cerrarMapa(); return; }
        if (k === 'm') { abrirMapa(); return; }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
            e.preventDefault(); teclas[k] = true; arrancar(); return;
        }
        if (k === 'e' || ((k === 'enter' || k === ' ') && !e.target.closest('button'))) { e.preventDefault(); accion(); }
        if (k === 'pageup') { e.preventDefault(); irA(sel - 1, false); }
        if (k === 'pagedown') { e.preventDefault(); irA(sel + 1, false); }
    }

    /* ---------- Entrar y salir del modo juego ---------- */
    function empezar() {
        var t = juego.querySelector('[data-j-titulo]');
        t.classList.add('fuera');
        setTimeout(function () { t.hidden = true; }, reducido ? 0 : 350);
        var ya = false;
        try { ya = sessionStorage.getItem('juego-empezado') === '1'; sessionStorage.setItem('juego-empezado', '1'); } catch (e) {}
        if (!ya) frasesIntro().forEach(function (f) { decir(f); });
        arrancar();
    }
    function entrar() {
        if (!juego) crear();
        raiz.classList.add('en-juego');
        juego.hidden = false;
        guardar('modo', 'juego');
        var empezado = false;
        try { empezado = sessionStorage.getItem('juego-empezado') === '1'; } catch (e) {}
        juego.querySelector('[data-j-titulo]').hidden = empezado;
        medir();
        pintarHud();
        arrancar();
    }
    function salir() {
        cerrar();
        raiz.classList.remove('en-juego');
        juego.hidden = true;
        enMarcha = false;
        guardar('modo', 'clasico');
        window.scrollTo(0, 0);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) arrancar(); });

    document.querySelectorAll('[data-modo-juego]').forEach(function (b) {
        b.hidden = false;
        b.addEventListener('click', entrar);
    });

    // Se abre en modo juego salvo que el visitante prefiera la clásica
    // o llegue con un enlace a una sección concreta.
    var hashUrl = location.hash.slice(1);
    if (hashUrl === 'juego' || (!hashUrl && guardado('modo') !== 'clasico')) entrar();
})();
