/* rodrigodavila.com · modo juego
   Un mundo en pixel art que se recorre andando, con un hada que acompaña.
   Cada edificio es un nivel: al entrar se abre su pantalla. Las empresas
   tienen su propio contenido (todos los proyectos); el resto usa el mismo
   HTML de la versión clásica, que se mueve al panel y vuelve a su sitio
   al cerrarlo. La versión clásica sigue siendo la página en sí. */

(function () {
    'use strict';

    var raiz = document.documentElement;
    var T = 16, MW = 128, MH = 80, PW = MW * T, PH = MH * T;
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

    /* ---------- Niveles ---------- */
    // x, y: casilla de la puerta. El edificio queda encima y el camino sale hacia abajo.
    var NIVELES = [
        { id: 'inicio', x: 14, y: 58, tipo: 'casa', es: 'Inicio', en: 'Home', sub: 'Rodrigo Dávila', piezas: ['#inicio .portada-texto'],
            hada: { es: 'Esta es la casa de Rodrigo. Entra para saber quién es.', en: 'This is Rodrigo\'s home. Step in to meet him.' } },
        { id: 'accenture-2017', x: 26, y: 44, tipo: 'oficina', pisos: 2, color: '#a100ff', es: 'Accenture', en: 'Accenture', sub: '2017 – 2018', carrera: true,
            hada: { es: 'Aquí empezó todo, en 2017: su primer código Java para BBVA.', en: 'It all began here in 2017: his first Java code for BBVA.' } },
        { id: 'altia', x: 38, y: 58, tipo: 'oficina', pisos: 3, color: '#e4572e', es: 'Altia', en: 'Altia', sub: '2018 – 2021', carrera: true,
            hada: { es: 'En Altia trabajó para Cepsa, BMW y la Comunidad de Madrid.', en: 'At Altia he worked for Cepsa, BMW and the Madrid regional government.' } },
        { id: 'deloitte', x: 50, y: 42, tipo: 'oficina', pisos: 5, color: '#86bc25', es: 'Deloitte', en: 'Deloitte', sub: '2021 – 2025', carrera: true,
            hada: { es: 'Deloitte: cuatro años y medio liderando proyectos para Santander, Acciona y Cruz Roja.', en: 'Deloitte: four and a half years leading projects for Santander, Acciona and the Red Cross.' } },
        { id: 'accenture', x: 62, y: 58, tipo: 'torre', es: 'Accenture · BBVA', en: 'Accenture · BBVA', sub: { es: '2025 – hoy', en: '2025 – now' }, carrera: true,
            hada: { es: '¡Mira los agentes dando vueltas! Aquí diseña sistemas multiagente para BBVA.', en: 'Look at those agents spinning! This is where he designs multi-agent systems for BBVA.' } },
        { id: 'habilidades', x: 46, y: 24, tipo: 'templo', es: 'Lo que sé hacer', en: 'What I can do', sub: { es: 'Habilidades', en: 'Skills' }, piezas: ['#capacidades .mapa', '.formacion'],
            hada: { es: 'El templo guarda todo lo que sabe hacer: IA, código, cloud y gestión.', en: 'The temple holds everything he can do: AI, code, cloud and management.' } },
        { id: 'urbapadel', x: 84, y: 60, tipo: 'app', icono: 'urbapadel', es: 'UrbaPadel', en: 'UrbaPadel', sub: 'App', piezas: ['#urbapadel'],
            hada: { es: 'UrbaPadel: reservas de pádel para urbanizaciones. ¡La usan más de 150 vecinos!', en: 'UrbaPadel: padel court booking for residential communities. Over 150 residents use it!' } },
        { id: 'lullcam', x: 88, y: 46, tipo: 'app', icono: 'lullcam', es: 'LullCam', en: 'LullCam', sub: 'App', piezas: ['#lullcam'],
            hada: { es: 'LullCam: un vigilabebés sin nube y cifrado de extremo a extremo.', en: 'LullCam: a baby monitor with no cloud and end-to-end encryption.' } },
        { id: 'tumenu', x: 98, y: 60, tipo: 'app', icono: 'tumenu', es: 'TuMenu', en: 'TuMenu', sub: 'App', piezas: ['#tumenu'],
            hada: { es: 'TuMenu: el bar manda el menú por WhatsApp y la IA hace el resto.', en: 'TuMenu: the bar sends its menu over WhatsApp and AI does the rest.' } },
        { id: 'godafly', x: 100, y: 44, tipo: 'app', icono: 'godafly', es: 'GodaFly', en: 'GodaFly', sub: 'App', piezas: ['#godafly'],
            hada: { es: 'GodaFly conecta a gente que viaja sola en aeropuertos y escalas.', en: 'GodaFly connects people travelling alone at airports and layovers.' } },
        { id: 'mifilmoteca', x: 90, y: 30, tipo: 'app', icono: 'mifilmoteca', es: 'Mi Filmoteca', en: 'Mi Filmoteca', sub: 'App', piezas: ['#mifilmoteca'],
            hada: { es: 'Mi Filmoteca fue su primera app en las tiendas, en 2020.', en: 'Mi Filmoteca was his first app on the stores, back in 2020.' } },
        { id: 'webs', x: 102, y: 18, tipo: 'cartel', es: 'Webs', en: 'Websites', sub: { es: 'A medida', en: 'Custom' }, piezas: ['#webs .webs-rejilla'],
            hada: { es: 'También hace webs a medida: bodas, restaurantes y comercios.', en: 'He also builds custom websites: weddings, restaurants and shops.' } },
        { id: 'taller', x: 110, y: 30, tipo: 'taller', es: 'El taller', en: 'Workbench', sub: 'Zapeo · RunClap', piezas: ['#zapeo', '#runclap'],
            hada: { es: 'En el taller hay cosas cociéndose: Zapeo y RunClap.', en: 'Things are cooking in the workshop: Zapeo and RunClap.' } },
        { id: 'chat', x: 116, y: 46, tipo: 'faro', es: 'Pregúntame', en: 'Ask me', sub: { es: 'Mi IA', en: 'My AI' }, piezas: ['#asistente .chat'],
            hada: { es: 'En el faro vive su IA. ¡Pregúntale lo que quieras!', en: 'His AI lives in the lighthouse. Ask it anything!' } },
        { id: 'contacto', x: 108, y: 64, tipo: 'buzon', es: 'Contacto', en: 'Contact', sub: { es: '¿Hablamos?', en: 'Let\'s talk' }, piezas: ['#contacto .contacto-caja'],
            hada: { es: '¿Te ha gustado? Déjale un mensaje en el buzón.', en: 'Enjoyed it? Leave him a message in the mailbox.' } }
    ];

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
        tronco: '#6b4426', luz: '#ffd36b', acento: '#3a66f0', acento2: '#86a6ff'
    };

    /* ---------- Mapa ---------- */
    var HIERBA = 0, AGUA = 1, CAMINO = 2, ARENA = 3, PUENTE = 4, FLORES = 5;
    var suelo = new Uint8Array(MW * MH), solido = new Uint8Array(MW * MH), reservado = new Uint8Array(MW * MH);
    function ix(x, y) { return y * MW + x; }
    function dentro(x, y) { return x >= 0 && y >= 0 && x < MW && y < MH; }
    function costa(y) { return 121 + Math.round(2 * Math.sin(y * 0.17) + Math.sin(y * 0.41)); }
    function rio(y) { return Math.round(74 + 2.5 * Math.sin(y * 0.13)); }

    var DIM = { casa: [64, 60, 36], torre: [64, 136, 30], templo: [80, 76, 40], app: [48, 40, 20], cartel: [76, 68, 14], taller: [68, 60, 36], faro: [36, 116, 24], buzon: [28, 44, 10] };
    NIVELES.forEach(function (n) {
        var d = n.tipo === 'oficina' ? [56, 40 + n.pisos * 12, 36] : DIM[n.tipo];
        n.w = d[0]; n.h = d[1]; n.fh = d[2];
        n.px = (n.x + 1) * T;           // centro de la puerta
        n.py = (n.y + 1) * T;           // pie del edificio
        n.entrada = { x: n.px, y: n.py + 8 };
        n.extra = { app: 40, torre: 34, templo: 22, faro: 26 }[n.tipo] || 0;
    });

    function generarMapa() {
        var x, y;
        for (y = 0; y < MH; y++) {
            var c = costa(y), r = rio(y);
            for (x = 0; x < MW; x++) {
                var t = HIERBA;
                if (x >= c) t = AGUA;
                else if (x >= c - 3) t = ARENA;
                if (x >= r - 1 && x <= r + 1) t = AGUA;
                var lx = (x - 30) / 7, ly = (y - 16) / 4;
                if (lx * lx + ly * ly < 1) t = AGUA;
                suelo[ix(x, y)] = t;
            }
        }
        // Caminos entre niveles consecutivos, de dos casillas de ancho
        function pinta(x, y) {
            for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
                var X = x + a, Y = y + b;
                if (!dentro(X, Y)) continue;
                var i = ix(X, Y);
                suelo[i] = suelo[i] === AGUA || suelo[i] === PUENTE ? PUENTE : CAMINO;
            }
        }
        function linea(x1, y1, x2, y2) {
            var dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), X = x1, Y = y1;
            pinta(X, Y);
            while (X !== x2 || Y !== y2) { if (X !== x2) X += dx; else Y += dy; pinta(X, Y); }
        }
        for (var k = 0; k < NIVELES.length - 1; k++) {
            var A = NIVELES[k], B = NIVELES[k + 1];
            if (B.y <= A.y) { linea(A.x, A.y + 1, A.x, A.y + 2); linea(A.x, A.y + 2, B.x, A.y + 2); linea(B.x, A.y + 2, B.x, B.y + 1); }
            else { linea(A.x, A.y + 1, A.x, B.y + 2); linea(A.x, B.y + 2, B.x, B.y + 2); linea(B.x, B.y + 2, B.x, B.y + 1); }
        }
        // Zonas libres: caminos y alrededor de los edificios
        for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
            var s = suelo[ix(x, y)];
            if (s !== CAMINO && s !== PUENTE) continue;
            for (var j = -2; j <= 2; j++) for (var m = -2; m <= 2; m++) if (dentro(x + m, y + j)) reservado[ix(x + m, y + j)] = 1;
        }
        NIVELES.forEach(function (n) {
            var x0 = Math.floor((n.px - n.w / 2) / T) - 2, x1 = Math.floor((n.px + n.w / 2) / T) + 2;
            var y0 = Math.floor((n.py - n.h - n.extra) / T) - 1, y1 = n.y + 3;
            for (var Y = y0; Y <= y1; Y++) for (var X = x0; X <= x1; X++) if (dentro(X, Y)) reservado[ix(X, Y)] = 1;
            // Huella sólida del edificio
            var fx0 = Math.floor((n.px - n.w / 2 + 4) / T), fx1 = Math.floor((n.px + n.w / 2 - 5) / T);
            var fy0 = Math.floor((n.py - n.fh) / T), fy1 = Math.floor((n.py - 1) / T);
            for (Y = fy0; Y <= fy1; Y++) for (X = fx0; X <= fx1; X++) if (dentro(X, Y)) { solido[ix(X, Y)] = 1; if (suelo[ix(X, Y)] === CAMINO) suelo[ix(X, Y)] = HIERBA; }
        });
        // Árboles en rejilla de 2x2 (bosque espeso en los bordes, arboledas dentro)
        var r = azar(7), arboles = [], matas = [];
        for (y = 0; y < MH - 1; y += 2) for (x = 0; x < MW - 1; x += 2) {
            var ok = true;
            for (var a = 0; a < 2 && ok; a++) for (var b = 0; b < 2 && ok; b++) {
                var i2 = ix(x + a, y + b);
                if (suelo[i2] !== HIERBA || reservado[i2] || solido[i2]) ok = false;
            }
            if (!ok) continue;
            var borde = Math.min(x, y, MH - 2 - y);
            var n = Math.sin(x * 0.21) + Math.sin(y * 0.27 + 1.3) + Math.sin((x + y) * 0.11);
            var p = borde < 5 ? 0.97 : n > 1.25 ? 0.75 : 0.05;
            if (r() < p) { arboles.push({ x: x, y: y }); solido[ix(x, y + 1)] = 1; solido[ix(x + 1, y + 1)] = 1; }
        }
        for (y = 2; y < MH - 2; y++) for (x = 2; x < MW - 2; x++) {
            var i3 = ix(x, y);
            if (suelo[i3] !== HIERBA || reservado[i3] || solido[i3]) continue;
            var q = r();
            if (q < 0.012) { matas.push({ x: x, y: y }); solido[i3] = 1; }
            else if (q < 0.07) suelo[i3] = FLORES;
        }
        return { arboles: arboles, matas: matas };
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

    function pintarSuelo() {
        var L = lienzo(PW, PH), x = L.x, X, Y;
        function es(a, b) { return dentro(a, b) ? suelo[ix(a, b)] : HIERBA; }
        for (Y = 0; Y < MH; Y++) for (X = 0; X < MW; X++) {
            var t = suelo[ix(X, Y)], px = X * T, py = Y * T, k;
            if (t === HIERBA || t === FLORES) {
                x.fillStyle = C.hierba; x.fillRect(px, py, T, T);
                for (k = 0; k < 5; k++) {
                    var h1 = hash(X * 7 + k, Y * 13 + k);
                    x.fillStyle = h1 > 0.5 ? C.hierba2 : C.hierba3;
                    x.fillRect(px + Math.floor(h1 * 14), py + Math.floor(hash(X + k * 3, Y - k) * 13), 2, 1);
                    x.fillRect(px + Math.floor(h1 * 14) + 1, py + Math.floor(hash(X + k * 3, Y - k) * 13) - 1, 1, 1);
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
                var gN = es(X, Y - 1), gS = es(X, Y + 1), gO = es(X - 1, Y), gE = es(X + 1, Y);
                function verde(v) { return v === HIERBA || v === FLORES; }
                if (verde(gN)) { x.fillRect(px, py, T, 1); x.fillStyle = C.hierba; for (k = 0; k < T; k += 3) x.fillRect(px + k, py, 1, 1 + (k % 2)); x.fillStyle = C.tierraBorde; }
                if (verde(gS)) x.fillRect(px, py + T - 1, T, 1);
                if (verde(gO)) x.fillRect(px, py, 1, T);
                if (verde(gE)) x.fillRect(px + T - 1, py, 1, T);
            } else if (t === ARENA) {
                x.fillStyle = C.arena; x.fillRect(px, py, T, T);
                for (k = 0; k < 4; k++) { x.fillStyle = C.arena2; x.fillRect(px + Math.floor(hash(X * 5 + k, Y) * 15), py + Math.floor(hash(X, Y * 5 + k) * 15), 1, 1); }
            } else if (t === AGUA) {
                x.fillStyle = C.agua; x.fillRect(px, py, T, T);
                for (k = 0; k < 2; k++) { x.fillStyle = C.agua2; x.fillRect(px + Math.floor(hash(X * 9 + k, Y) * 10), py + Math.floor(hash(X, Y * 9 + k) * 14), 5, 1); }
                x.fillStyle = C.espuma;
                if (es(X, Y - 1) !== AGUA && es(X, Y - 1) !== PUENTE) { x.fillRect(px, py, T, 2); }
                if (es(X - 1, Y) !== AGUA && es(X - 1, Y) !== PUENTE) x.fillRect(px, py, 2, T);
                if (es(X + 1, Y) !== AGUA && es(X + 1, Y) !== PUENTE) x.fillRect(px + T - 2, py, 2, T);
                if (es(X, Y + 1) !== AGUA && es(X, Y + 1) !== PUENTE) x.fillRect(px, py + T - 1, T, 1);
            } else if (t === PUENTE) {
                x.fillStyle = C.agua; x.fillRect(px, py, T, T);
                x.fillStyle = C.madera; x.fillRect(px, py + 1, T, T - 2);
                x.fillStyle = C.madera2;
                for (k = 0; k < T; k += 4) x.fillRect(px + k, py + 1, 1, T - 2);
                if (es(X, Y - 1) !== PUENTE) { x.fillStyle = C.linea; x.fillRect(px, py, T, 2); }
                if (es(X, Y + 1) !== PUENTE) { x.fillStyle = C.linea; x.fillRect(px, py + T - 2, T, 2); }
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
            p(5, H - 28, 46, 6, n.color);
            p(5, H - 22, 46, 1, C.linea);
            caja(21, H - 21, 14, 18, '#6fa8dc'); p(28, H - 20, 1, 16, C.linea); p(23, H - 19, 3, 2, '#ffffff88');
            p(18, H - 4, 20, 2, '#9aa3b5');
        } else if (n.tipo === 'torre') {
            caja(10, 22, 44, 112, '#1f3b73');
            p(42, 23, 11, 110, '#18305f');
            for (var yy = 30; yy < 112; yy += 8) for (var cc = 0; cc < 5; cc++) {
                if (r() > 0.45) luz(14 + cc * 8, yy, 4, 5); else p(14 + cc * 8, yy, 4, 5, '#4f7fd6');
            }
            p(11, 110, 42, 4, '#a100ff');
            caja(18, 14, 28, 10, '#2c4f93');
            p(31, 0, 2, 15, C.linea);
            caja(10, 114, 44, 20, '#2c4f93');
            caja(25, 118, 14, 16, '#9cd0ff'); p(31, 119, 1, 14, C.linea);
        } else if (n.tipo === 'templo') {
            caja(4, 64, 72, 9, '#cfc8b6');
            caja(10, 57, 60, 8, '#ddd6c4');
            p(12, 26, 56, 32, '#6f6a5d');
            for (var k = 0; k < 4; k++) { var cx = 14 + k * 16; caja(cx, 25, 9, 34, '#efe9da'); p(cx + 6, 26, 2, 32, '#d3ccbb'); }
            caja(8, 19, 64, 8, '#e6dfcd');
            tejado(40, 3, 18, 2, 2.15, '#e6dfcd', '#d3ccbb');
            p(37, 10, 6, 4, '#7fe0ff');
        } else if (n.tipo === 'app') {
            caja(4, 26, 40, 12, '#b9b3a5');
            caja(9, 18, 30, 10, '#d4cec0');
            p(20, 30, 8, 4, '#8a8476'); p(23, 29, 2, 6, '#8a8476');
            p(10, 19, 28, 1, '#ece7da');
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
                var hw = Math.round(8 + (y - 24) / 80 * 6);
                p(18 - hw - 1, y, hw * 2 + 2, 1, C.linea);
                p(18 - hw, y, hw * 2, 1, Math.floor((y - 24) / 14) % 2 ? '#f3f3f3' : '#d6453a');
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

    /* ---------- Personaje y hada ---------- */
    function dibujaHeroe(x, X, Y, dir, paso) {
        var bob = paso ? -1 : 0, partes = [];
        function parte(px, py, w, h, c) { partes.push([px, py, w, h, c]); }
        var pa = paso === 1 ? -1 : 0, pb = paso === 2 ? -1 : 0;
        // piernas
        if (dir === 'izq' || dir === 'der') {
            parte(X - 3 + (paso === 1 ? -1 : 0), Y - 5, 3, 5, '#2b2f3d');
            parte(X + (paso === 2 ? 1 : 0), Y - 5, 3, 5, '#2b2f3d');
        } else {
            parte(X - 4, Y - 5 + pa, 3, 5 - pa, '#2b2f3d');
            parte(X + 1, Y - 5 + pb, 3, 5 - pb, '#2b2f3d');
        }
        // mochila detrás
        if (dir === 'izq') parte(X + 3, Y - 12 + bob, 4, 7, '#f5a524');
        if (dir === 'der') parte(X - 7, Y - 12 + bob, 4, 7, '#f5a524');
        // cuerpo y brazos
        parte(X - 5, Y - 12 + bob, 10, 8, C.acento);
        if (dir === 'abajo' || dir === 'arriba') {
            var sw = paso === 1 ? 1 : paso === 2 ? -1 : 0;
            parte(X - 7, Y - 11 + bob + sw, 2, 6, '#2446b8');
            parte(X + 5, Y - 11 + bob - sw, 2, 6, '#2446b8');
        } else {
            var ax = paso === 1 ? -1 : paso === 2 ? 1 : 0;
            parte(X - 1 + ax, Y - 11 + bob, 3, 6, '#2446b8');
        }
        if (dir === 'arriba') parte(X - 4, Y - 12 + bob, 8, 6, '#f5a524');
        // cabeza
        parte(X - 5, Y - 21 + bob, 10, 9, '#f1c7a3');
        x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X - 6, Y - 1, 12, 3);
        partes.forEach(function (q) { x.fillStyle = C.linea; x.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2); });
        partes.forEach(function (q) { x.fillStyle = q[4]; x.fillRect(q[0], q[1], q[2], q[3]); });
        // detalles
        x.fillStyle = '#2446b8'; x.fillRect(X - 5, Y - 6 + bob, 10, 2);
        x.fillStyle = '#3b2416';
        var hy = Y - 21 + bob;
        if (dir === 'arriba') x.fillRect(X - 5, hy, 10, 8);
        else if (dir === 'abajo') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 1, 3); x.fillRect(X + 4, hy + 3, 1, 3); x.fillRect(X - 2, hy + 3, 3, 1); }
        else if (dir === 'izq') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X, hy + 3, 5, 4); }
        else { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 5, 4); }
        x.fillStyle = '#1d2433';
        if (dir === 'abajo') { x.fillRect(X - 3, hy + 4, 1, 2); x.fillRect(X + 2, hy + 4, 1, 2); x.fillStyle = '#e8a08a'; x.fillRect(X - 1, hy + 7, 2, 1); }
        if (dir === 'izq') x.fillRect(X - 4, hy + 4, 1, 2);
        if (dir === 'der') x.fillRect(X + 3, hy + 4, 1, 2);
    }

    /* ---------- Estado ---------- */
    var juego, lienzoEl, ctx, sueloImg, imgArbol, imgMata, objetos = [], iconos = {}, websImgs = [];
    var heroe = { x: 0, y: 0, dir: 'abajo', dist: 0, moviendo: false, arriba: 0 };
    var hada = { x: 0, y: 0, vx: 0, vy: 0, estela: [] };
    var mapaCam = { x: 0, y: 0 }, cam = { x: 0, y: 0 }, esc = 3, escObj = 3, zoomBase = 3, dpr = 1;
    var teclas = {}, mando = { x: 0, y: 0 }, ruta = [], rutaNivel = -1, marca = null;
    var sel = 1, cerca = -1, abiertoNivel = -1, vistaMapa = false, enMarcha = false, ultimo = 0, reloj = 0;
    var devueltas = [], cuerpoPanel, panel, globo, globoTexto, cola = [], dicho = {}, quieto = 0, consejo = 0;
    var particulas = [], recienGanada = -1, oscuro = true, cw = 0, ch = 0;
    var vistos = {};
    try { vistos = JSON.parse(guardado('niveles-vistos') || '{}') || {}; } catch (e) { vistos = {}; }
    var tactil = window.matchMedia('(pointer: coarse)').matches;

    function libreCasilla(tx, ty) {
        if (!dentro(tx, ty)) return false;
        var i = ix(tx, ty);
        return !solido[i] && suelo[i] !== AGUA;
    }
    function librePx(x, y) { return libreCasilla(Math.floor(x / T), Math.floor(y / T)); }
    function libreEn(x, y) { return librePx(x - 5, y - 4) && librePx(x + 4, y - 4) && librePx(x - 5, y) && librePx(x + 4, y); }

    /* ---------- Ruta (A*) para el clic y los botones ---------- */
    function buscarRuta(ax, ay, bx, by) {
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
        // Suavizado: salta puntos intermedios cuando hay línea libre.
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
    function irAPunto(x, y, nivel) {
        var r = buscarRuta(heroe.x, heroe.y, x, y);
        ruta = r || [];
        rutaNivel = r ? (nivel === undefined ? -1 : nivel) : -1;
        marca = r ? { x: ruta[ruta.length - 1].x, y: ruta[ruta.length - 1].y, t: 0 } : null;
        arrancar();
    }
    function irANivel(i, entrar) {
        if (i < 0 || i >= NIVELES.length) return;
        sel = i;
        var n = NIVELES[i];
        if (Math.hypot(heroe.x - n.entrada.x, heroe.y - n.entrada.y) < 14) { if (entrar) abrir(i); pintarHud(); return; }
        irAPunto(n.entrada.x, n.entrada.y, entrar ? i : -2 - i);
        pintarHud();
    }

    /* ---------- Hada: bocadillos ---------- */
    function decir(t, prioridad) {
        if (prioridad) cola = [];
        cola.push(t);
        if (!globo.classList.contains('visible') || prioridad) siguienteFrase();
    }
    var frase = null;
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
    var INTRO = [
        { es: '¡Hola! Soy Lumi y te acompaño por la carrera de Rodrigo.', en: 'Hi! I\'m Lumi, and I\'ll guide you through Rodrigo\'s career.' },
        null,
        null
    ];
    function frasesIntro() {
        INTRO[1] = tactil
            ? { es: 'Usa el mando o toca el mapa para moverte.', en: 'Use the pad or tap the map to move.' }
            : { es: 'Muévete con WASD o las flechas, o haz clic en el mapa.', en: 'Move with WASD or the arrow keys, or click on the map.' };
        INTRO[2] = tactil
            ? { es: 'Junto a una puerta, pulsa A para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press A to go in. There are 15 gems!' }
            : { es: 'Junto a una puerta, pulsa E para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press E to go in. There are 15 gems!' };
        return INTRO;
    }
    var CONSEJOS = [
        { es: 'Pulsa M o el botón Mapa para ver el mundo entero.', en: 'Press M or the Map button to see the whole world.' },
        { es: 'Las flechas de abajo te llevan al nivel siguiente.', en: 'The arrows below take you to the next level.' },
        { es: 'En el faro puedes preguntarle cosas a su IA.', en: 'At the lighthouse you can ask his AI anything.' },
        { es: 'Cada edificio que visitas te da una gema.', en: 'Every building you visit gives you a gem.' }
    ];

    /* ---------- Construcción ---------- */
    function crear() {
        var gen = generarMapa();
        sueloImg = pintarSuelo();
        imgArbol = spriteArbol();
        imgMata = spriteMata();
        gen.arboles.forEach(function (a) { objetos.push({ img: imgArbol, x: a.x * T, y: a.y * T - 2, base: (a.y + 2) * T - 3, w: 32, h: 34 }); });
        gen.matas.forEach(function (m) { objetos.push({ img: imgMata, x: m.x * T, y: m.y * T, base: m.y * T + 14, w: 16, h: 16 }); });
        NIVELES.forEach(function (n, i) {
            var s = spriteEdificio(n, i);
            n.sprite = s;
            objetos.push({ img: s.c, x: n.px - n.w / 2, y: n.py - n.h, base: n.py, w: n.w, h: n.h, nivel: i });
            if (n.icono) { var im = new Image(); im.src = 'img/apps/' + n.icono + '-icono.webp'; iconos[n.icono] = im; }
        });
        ['boda-finca', 'tumenu', 'urbapadel', 'godafly', 'lullcam'].forEach(function (w) { var im = new Image(); im.src = 'img/webs/' + w + '.webp'; websImgs.push(im); });

        juego = document.createElement('div');
        juego.className = 'juego';
        juego.id = 'juego';
        juego.setAttribute('role', 'application');
        juego.setAttribute('aria-label', 'Rodrigo Dávila · modo juego');
        var gemas = '';
        for (var g = 0; g < NIVELES.length; g++) gemas += '<i data-gema="' + g + '"></i>';
        juego.innerHTML =
            '<canvas class="juego-lienzo" aria-hidden="true"></canvas>' +
            '<div class="hada-globo" data-j-globo aria-live="polite"><p class="hada-nombre">Lumi</p><p class="hada-texto" data-j-globo-texto></p></div>' +
            '<div class="hud hud-arriba">' +
                '<p class="hud-marca"><span class="marca-sello" aria-hidden="true">RD</span><span>Rodrigo Dávila</span></p>' +
                '<p class="hud-gemas" aria-live="polite"><span class="gemas-fila" aria-hidden="true">' + gemas + '</span><span class="gemas-cuenta" data-j-cuenta></span></p>' +
                '<div class="hud-botones">' +
                    '<button type="button" class="hud-boton" data-j-mapa><span lang="es">Mapa</span><span lang="en">Map</span></button>' +
                    '<button type="button" class="hud-boton" data-j-idioma><span lang="es">EN</span><span lang="en">ES</span></button>' +
                    '<button type="button" class="hud-boton hud-clasica" data-j-clasica><span lang="es">Versión clásica</span><span lang="en">Classic version</span></button>' +
                '</div>' +
            '</div>' +
            '<div class="hud-niveles">' +
                '<button type="button" class="hud-paso" data-j-paso="-1" aria-label="Nivel anterior">◀</button>' +
                '<button type="button" class="hud-entrar" data-j-entrar><span class="hud-nivel" data-j-num></span><strong data-j-nombre></strong><span class="hud-accion" data-j-accion></span></button>' +
                '<button type="button" class="hud-paso" data-j-paso="1" aria-label="Nivel siguiente">▶</button>' +
            '</div>' +
            '<p class="hud-ayuda"><span lang="es"><kbd>WASD</kbd> moverte · <kbd>E</kbd> entrar · <kbd>M</kbd> mapa · o haz clic</span><span lang="en"><kbd>WASD</kbd> move · <kbd>E</kbd> enter · <kbd>M</kbd> map · or click</span></p>' +
            '<div class="mando" data-j-mando aria-hidden="true"><span class="mando-bola"></span></div>' +
            '<button type="button" class="boton-a" data-j-a><span>A</span><small data-j-a-texto></small></button>' +
            '<p class="mapa-aviso" data-j-mapa-aviso>' + (tactil
                ? '<span lang="es">Toca un nivel para ir · arrastra para mirar</span><span lang="en">Tap a level to go · drag to look around</span>'
                : '<span lang="es">Haz clic en un nivel para ir · M o Esc para volver</span><span lang="en">Click a level to go there · M or Esc to go back</span>') + '</p>' +
            '<div class="juego-titulo" data-j-titulo>' +
                '<div class="titulo-caja">' +
                    '<p class="titulo-pixel"><span lang="es">Portfolio · modo aventura</span><span lang="en">Portfolio · adventure mode</span></p>' +
                    '<h2>Rodrigo Dávila</h2>' +
                    '<p class="titulo-lead"><span lang="es">Manager de IA Generativa y creador de apps. Recorre el mundo con Lumi: cada edificio es un nivel de mi carrera.</span><span lang="en">Generative AI Manager and app maker. Explore the world with Lumi: every building is a level of my career.</span></p>' +
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
                        '<button type="button" class="boton" data-j-panel-paso="-1"><span aria-hidden="true">◀ </span><span lang="es">Nivel anterior</span><span lang="en">Previous level</span></button>' +
                        '<button type="button" class="boton boton-lleno" data-j-panel-paso="1"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(juego);
        lienzoEl = juego.querySelector('.juego-lienzo');
        ctx = lienzoEl.getContext('2d');
        panel = juego.querySelector('.juego-panel');
        cuerpoPanel = juego.querySelector('[data-j-cuerpo]');
        globo = juego.querySelector('[data-j-globo]');
        globoTexto = juego.querySelector('[data-j-globo-texto]');
        if (tactil) juego.classList.add('tactil');

        var n0 = NIVELES[0];
        heroe.x = n0.entrada.x; heroe.y = n0.entrada.y + 6;
        hada.x = heroe.x + 14; hada.y = heroe.y - 30;
        cam.x = heroe.x; cam.y = heroe.y - 16;

        // Ratón y toque sobre el mapa: un toque corto lleva al personaje.
        var inicio = null;
        lienzoEl.addEventListener('pointerdown', function (e) { inicio = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY }; });
        lienzoEl.addEventListener('pointercancel', function () { inicio = null; });
        lienzoEl.addEventListener('pointerup', function (e) {
            if (!inicio) return;
            var lejos = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12;
            inicio = null;
            if (lejos) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            var hit = nivelEn(w.x, w.y);
            if (vistaMapa) { cerrarMapa(); if (hit >= 0) irANivel(hit, true); else irAPunto(w.x, w.y); return; }
            if (hit >= 0) irANivel(hit, true); else irAPunto(w.x, w.y);
        });
        lienzoEl.addEventListener('pointermove', function (e) {
            // En el mapa completo, arrastrar lo desplaza.
            if (vistaMapa && inicio) {
                var v = vistaRect();
                mapaCam.x = Math.max(v.w / 2, Math.min(PW - v.w / 2, mapaCam.x - (e.clientX - inicio.ux) * dpr / esc));
                mapaCam.y = Math.max(Math.min(v.h / 2, PH / 2), Math.min(Math.max(PH - v.h / 2, PH / 2), mapaCam.y - (e.clientY - inicio.uy) * dpr / esc));
                cam.x = mapaCam.x; cam.y = mapaCam.y;
                inicio.ux = e.clientX; inicio.uy = e.clientY;
                return;
            }
            if (tactil) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            lienzoEl.style.cursor = nivelEn(w.x, w.y) >= 0 ? 'pointer' : 'crosshair';
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
            b.addEventListener('click', function () { irANivel(sel + Number(b.getAttribute('data-j-paso')), false); });
        });
        juego.querySelector('[data-j-entrar]').addEventListener('click', accion);
        juego.querySelectorAll('[data-j-panel-paso]').forEach(function (b) {
            b.addEventListener('click', function () {
                var n = abiertoNivel + Number(b.getAttribute('data-j-panel-paso'));
                cerrar();
                if (n >= 0 && n < NIVELES.length) irANivel(n, true);
            });
        });
        juego.querySelector('[data-j-cerrar]').addEventListener('click', cerrar);
        juego.querySelector('[data-j-mapa]').addEventListener('click', function () { if (vistaMapa) cerrarMapa(); else abrirMapa(); });
        globo.addEventListener('click', pulsarGlobo);
        cuerpoPanel.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute('href').slice(1);
            var n = NIVELES.findIndex(function (x) { return x.id === id || (x.piezas || []).some(function (p) { return p.indexOf('#' + id) === 0; }); });
            if (n < 0) return;
            e.preventDefault();
            cerrar();
            irANivel(n, true);
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
        medir();
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
        zoomBase = Math.max(2, Math.min(4, Math.floor(Math.min(vw / 400, vh / 250))));
        escObj = vistaMapa ? escalaMapa() : Math.round(zoomBase * dpr);
        esc = escObj;
        arrancar();
    }
    function escalaMapa() { return ch > cw ? ch / PH * 0.92 : Math.min(cw / PW, ch / PH) * 0.96; }

    function nivelEn(x, y) {
        for (var i = 0; i < NIVELES.length; i++) {
            var n = NIVELES[i];
            if (x > n.px - n.w / 2 - 4 && x < n.px + n.w / 2 + 4 && y > n.py - n.h - n.extra - 8 && y < n.py + (vistaMapa ? 44 : 16)) return i;
        }
        return -1;
    }
    function vistaRect() {
        var vw = cw / esc, vh = ch / esc;
        var l = cam.x - vw / 2, t = cam.y - vh / 2;
        if (vw < PW) l = Math.max(0, Math.min(PW - vw, l)); else l = (PW - vw) / 2;
        if (vh < PH) t = Math.max(0, Math.min(PH - vh, t)); else t = (PH - vh) / 2;
        return { l: l, t: t, w: vw, h: vh };
    }
    function aMundo(sx, sy) { var v = vistaRect(); return { x: v.l + sx / esc, y: v.t + sy / esc }; }

    function abrirMapa() {
        if (abiertoNivel >= 0) return;
        mapaCam.x = ch > cw ? heroe.x : PW / 2; mapaCam.y = PH / 2;
        vistaMapa = true; escObj = escalaMapa(); ruta = [];
        juego.classList.add('en-mapa');
        arrancar();
    }
    function cerrarMapa() {
        vistaMapa = false; escObj = Math.round(zoomBase * dpr);
        juego.classList.remove('en-mapa');
        arrancar();
    }

    /* ---------- HUD ---------- */
    function pintarHud() {
        if (!juego) return;
        var l = idioma(), n = NIVELES[sel];
        var objetivo = cerca >= 0 ? cerca : sel, no = NIVELES[objetivo];
        juego.querySelector('[data-j-num]').textContent = (l === 'es' ? 'Nivel ' : 'Level ') + (objetivo + 1) + ' / ' + NIVELES.length;
        juego.querySelector('[data-j-nombre]').textContent = no[l];
        var entrarTxt = cerca >= 0 ? (l === 'es' ? 'Entrar' : 'Enter') : (l === 'es' ? 'Ir' : 'Go');
        juego.querySelector('[data-j-accion]').textContent = entrarTxt;
        juego.querySelector('[data-j-a-texto]').textContent = entrarTxt;
        juego.querySelector('[data-j-a]').classList.toggle('listo', cerca >= 0);
        juego.querySelector('[data-j-entrar]').classList.toggle('listo', cerca >= 0);
        var total = NIVELES.filter(function (x) { return vistos[x.id]; }).length;
        juego.querySelector('[data-j-cuenta]').textContent = total + ' / ' + NIVELES.length;
        juego.querySelectorAll('[data-gema]').forEach(function (g) { g.classList.toggle('llena', !!vistos[NIVELES[Number(g.getAttribute('data-gema'))].id]); });
        juego.querySelectorAll('[data-j-paso]').forEach(function (b) {
            var d = Number(b.getAttribute('data-j-paso'));
            b.disabled = sel + d < 0 || sel + d >= NIVELES.length;
            b.setAttribute('aria-label', d < 0 ? (l === 'es' ? 'Nivel anterior' : 'Previous level') : (l === 'es' ? 'Nivel siguiente' : 'Next level'));
        });
        void n;
    }
    function accion() {
        if (vistaMapa) { cerrarMapa(); return; }
        if (cerca >= 0) abrir(cerca);
        else irANivel(sel, true);
    }

    /* ---------- Bucle ---------- */
    function arrancar() {
        if (enMarcha || !juego || juego.hidden || abiertoNivel >= 0) return;
        enMarcha = true;
        ultimo = performance.now();
        requestAnimationFrame(paso);
    }
    function paso(t) {
        if (!enMarcha) return;
        if (juego.hidden || abiertoNivel >= 0 || document.hidden) { enMarcha = false; return; }
        var dt = Math.min(0.05, (t - ultimo) / 1000);
        ultimo = t; reloj += dt;
        actualizar(dt);
        dibujar();
        requestAnimationFrame(paso);
    }

    function actualizar(dt) {
        // Entrada: teclado, mando o ruta
        var ix2 = 0, iy2 = 0;
        if (!vistaMapa && juego.querySelector('[data-j-titulo]').hidden) {
            if (teclas.a || teclas.arrowleft) ix2 -= 1;
            if (teclas.d || teclas.arrowright) ix2 += 1;
            if (teclas.w || teclas.arrowup) iy2 -= 1;
            if (teclas.s || teclas.arrowdown) iy2 += 1;
            if (mando.x || mando.y) { ix2 = mando.x; iy2 = mando.y; }
        }
        var vel = 92, vx = 0, vy = 0;
        if (ix2 || iy2) {
            ruta = []; rutaNivel = -1; marca = null;
            var m = Math.hypot(ix2, iy2);
            var k = Math.min(1, m) / m;
            vx = ix2 * k * vel; vy = iy2 * k * vel;
        } else if (ruta.length) {
            var obj = ruta[0], dx = obj.x - heroe.x, dy = obj.y - heroe.y, d = Math.hypot(dx, dy);
            var v2 = 120;
            if (d < 3) { ruta.shift(); if (!ruta.length) llegar(); }
            else { vx = dx / d * v2; vy = dy / d * v2; }
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
        if (ruta.length && !heroe.moviendo) { heroe.atasco = (heroe.atasco || 0) + dt; if (heroe.atasco > 0.5) { heroe.atasco = 0; var fin = ruta[ruta.length - 1]; var rn = rutaNivel; irAPunto(fin.x, fin.y, rn); } }
        else heroe.atasco = 0;

        // ¿Junto a una puerta?
        var antes = cerca;
        cerca = -1;
        NIVELES.forEach(function (n, i) { if (Math.hypot(heroe.x - n.entrada.x, heroe.y - n.entrada.y) < 18) cerca = i; });
        if (cerca >= 0 && cerca !== antes) { sel = cerca; pintarHud(); }
        else if (cerca !== antes) pintarHud();
        // Empujar hacia la puerta también entra
        if (cerca >= 0 && iy2 < -0.5 && Math.abs(ix2) < 0.5 && heroe.y < NIVELES[cerca].entrada.y + 2) {
            heroe.arriba += dt;
            if (heroe.arriba > 0.18) { heroe.arriba = 0; teclas = {}; abrir(cerca); return; }
        } else heroe.arriba = 0;

        // El hada comenta lo que tienes cerca
        NIVELES.forEach(function (n, i) {
            if (dicho[n.id]) return;
            if (Math.hypot(heroe.x - n.entrada.x, heroe.y - (n.py - 20)) < 90) { dicho[n.id] = 1; decir(n.hada); void i; }
        });
        quieto = heroe.moviendo ? 0 : quieto + dt;
        if (quieto > 14 && !frase && juego.querySelector('[data-j-titulo]').hidden) { quieto = 0; decir(CONSEJOS[consejo++ % CONSEJOS.length]); }
        avanzarFrase(dt);

        // Hada: muelle hacia un punto junto al personaje
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

        // Cámara y zoom suaves
        var kz = reducido ? 1 : 1 - Math.exp(-dt * 7);
        esc += (escObj - esc) * kz;
        if (Math.abs(escObj - esc) < 0.002) esc = escObj;
        var cx = vistaMapa ? mapaCam.x : heroe.x, cy = vistaMapa ? mapaCam.y : heroe.y - 16;
        var kc = reducido ? 1 : 1 - Math.exp(-dt * 6);
        cam.x += (cx - cam.x) * kc; cam.y += (cy - cam.y) * kc;
        // El globo sigue al hada
        var v = vistaRect();
        var gx = (heroe.x - v.l) * esc / dpr, gy = (heroe.y + 8 - v.t) * esc / dpr;
        globo.style.transform = 'translate(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px)';
    }

    function llegar() {
        marca = null;
        var n = rutaNivel;
        rutaNivel = -1;
        if (n >= 0) { heroe.dir = 'arriba'; abrir(n); }
        else if (n <= -2) heroe.dir = 'arriba';
    }

    function dibujar() {
        var x = ctx, v = vistaRect(), i;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.imageSmoothingEnabled = esc < 1.5;
        x.fillStyle = C.agua; x.fillRect(0, 0, cw, ch);
        var ox = Math.round(-v.l * esc), oy = Math.round(-v.t * esc);
        x.setTransform(esc, 0, 0, esc, ox, oy);
        var sl = Math.max(0, Math.floor(v.l)), st = Math.max(0, Math.floor(v.t));
        var sw = Math.min(PW - sl, Math.ceil(v.w) + 2), sh = Math.min(PH - st, Math.ceil(v.h) + 2);
        x.drawImage(sueloImg, sl, st, sw, sh, sl, st, sw, sh);
        // Brillos del agua
        if (!reducido) {
            var fase = Math.floor(reloj * 2);
            for (var ty = Math.floor(v.t / T); ty <= Math.floor((v.t + v.h) / T); ty++) for (var tx = Math.floor(v.l / T); tx <= Math.floor((v.l + v.w) / T); tx++) {
                if (!dentro(tx, ty) || suelo[ix(tx, ty)] !== AGUA) continue;
                var hh = hash(tx * 3 + fase, ty * 7 - fase);
                if (hh < 0.12) { x.fillStyle = C.espuma; x.fillRect(tx * T + Math.floor(hh * 90), ty * T + 4 + Math.floor(hh * 60), 4, 1); }
            }
        }
        // Marca del destino
        if (marca && !vistaMapa) {
            var rr = 4 + (marca.t * 10) % 5;
            x.fillStyle = '#ffffffcc';
            x.fillRect(marca.x - rr, marca.y, 2, 1); x.fillRect(marca.x + rr - 2, marca.y, 2, 1);
            x.fillRect(marca.x - 1, marca.y - rr / 2, 2, 1); x.fillRect(marca.x - 1, marca.y + rr / 2, 2, 1);
        }
        // Objetos ordenados por profundidad
        var lista = [];
        for (i = 0; i < objetos.length; i++) {
            var o = objetos[i];
            if (o.x + o.w < v.l - 40 || o.x > v.l + v.w + 40 || o.y + o.h < v.t - 60 || o.y > v.t + v.h + 60) continue;
            lista.push(o);
        }
        lista.push({ base: heroe.y, heroe: true });
        lista.sort(function (a, b) { return a.base - b.base; });
        lista.forEach(function (o) {
            if (o.heroe) {
                var fr = heroe.moviendo ? [1, 0, 2, 0][Math.floor(heroe.dist / 7) % 4] : 0;
                dibujaHeroe(x, Math.round(heroe.x), Math.round(heroe.y), heroe.dir, fr);
                return;
            }
            x.drawImage(o.img, Math.round(o.x), Math.round(o.y));
            if (o.nivel !== undefined) extras(x, NIVELES[o.nivel], o.nivel);
        });
        // Partículas y flecha sobre la puerta seleccionada
        particulas.forEach(function (p) { x.globalAlpha = Math.max(0, p.v); x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
        x.globalAlpha = 1;
        var ns = NIVELES[cerca >= 0 ? cerca : sel];
        if (!vistaMapa) {
            var by = Math.round(ns.py - ns.h - ns.extra - 12 + Math.sin(reloj * 5) * 2);
            x.fillStyle = C.linea; x.beginPath(); x.moveTo(ns.px - 6, by - 1); x.lineTo(ns.px + 6, by - 1); x.lineTo(ns.px, by + 7); x.fill();
            x.fillStyle = cerca >= 0 ? C.luz : '#ffffff'; x.beginPath(); x.moveTo(ns.px - 4, by); x.lineTo(ns.px + 4, by); x.lineTo(ns.px, by + 5); x.fill();
        }
        // Noche
        x.setTransform(1, 0, 0, 1, 0, 0);
        if (oscuro) {
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
            x.globalCompositeOperation = 'source-over';
        }
        // Hada (siempre brilla)
        x.setTransform(esc, 0, 0, esc, ox, oy);
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
        // Etiquetas en pantalla
        x.setTransform(1, 0, 0, 1, 0, 0);
        etiquetas(x, v);
    }

    function brillo(x, cx, cy, r, color) {
        var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    function extras(x, n, i) {
        var t = reloj, top = n.py - n.h, bob = reducido ? 0 : Math.round(Math.sin(t * 2.4 + i) * 2);
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
            pts.filter(function (p) { return p.z < 0; }).forEach(function (p, k) { agente(x, p, k, t); });
            x.fillStyle = C.linea; x.fillRect(cx - 4, cy - 4, 8, 8);
            x.fillStyle = C.luz; x.fillRect(cx - 3, cy - 3, 6, 6);
            x.fillStyle = '#fff3c4'; x.fillRect(cx - 2, cy - 2, 2, 2);
            pts.filter(function (p) { return p.z >= 0; }).forEach(function (p, k) { agente(x, p, k + 3, t); });
        } else if (n.tipo === 'templo') {
            var cy2 = top - 8 + bob;
            x.fillStyle = C.linea;
            x.beginPath(); x.moveTo(n.px, cy2 - 9); x.lineTo(n.px + 6, cy2); x.lineTo(n.px, cy2 + 9); x.lineTo(n.px - 6, cy2); x.fill();
            x.fillStyle = '#7fe0ff';
            x.beginPath(); x.moveTo(n.px, cy2 - 7); x.lineTo(n.px + 4, cy2); x.lineTo(n.px, cy2 + 7); x.lineTo(n.px - 4, cy2); x.fill();
            x.fillStyle = '#e4fbff'; x.fillRect(n.px - 2, cy2 - 3, 2, 3);
        } else if (n.tipo === 'app') {
            var im = iconos[n.icono], iy = top - 32 + bob;
            x.fillStyle = '#ffffff22'; x.fillRect(n.px - 10, iy + 26, 20, top + 20 - iy - 26);
            x.fillStyle = C.linea; redondo(x, n.px - 15, iy - 1, 30, 30, 8); x.fill();
            if (im && im.complete && im.naturalWidth) {
                x.save(); redondo(x, n.px - 14, iy, 28, 28, 7); x.clip();
                x.imageSmoothingEnabled = true;
                x.drawImage(im, n.px - 14, iy, 28, 28);
                x.restore();
                x.imageSmoothingEnabled = esc < 1.5;
            }
            if (!reducido && Math.floor(t * 3 + i) % 5 === 0) { x.fillStyle = '#ffffff'; x.fillRect(n.px + 12, iy + 2, 2, 2); }
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
            var lx = n.px, ly = top + 13;
            if (!reducido) {
                var ang = t * 1.4, alfa = oscuro ? 0.0 : 0.18;
                if (!oscuro) {
                    x.fillStyle = 'rgba(255,240,170,' + alfa + ')';
                    haz(x, lx, ly, ang);
                }
            }
            // bocadillo de chat
            var bx = lx + 12, byy = top - 16 + bob;
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
        var l = idioma(), fs = Math.round((vistaMapa ? 12 : 13) * dpr);
        x.font = fs + 'px Silkscreen, Geist, sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        // Faro de noche: haz de luz por encima de la capa oscura
        if (oscuro && !reducido) {
            var f = NIVELES[13];
            x.setTransform(esc, 0, 0, esc, Math.round(-v.l * esc), Math.round(-v.t * esc));
            x.globalCompositeOperation = 'lighter';
            x.fillStyle = 'rgba(255,230,150,.16)';
            haz(x, f.px, f.py - f.h + 13, reloj * 1.4);
            x.globalCompositeOperation = 'source-over';
            x.setTransform(1, 0, 0, 1, 0, 0);
        }
        NIVELES.forEach(function (n, i) {
            var sx = (n.px - v.l) * esc, sy = (n.py - n.h - n.extra - v.t) * esc - (vistaMapa ? 8 : 26) * dpr;
            if (vistaMapa) sy = (n.py - v.t) * esc + 12 * dpr;
            if (sx < -200 || sx > cw + 200 || sy < -50 || sy > ch + 50) return;
            var activo = i === (cerca >= 0 ? cerca : sel);
            if (!vistaMapa && !activo && Math.hypot(n.px - heroe.x, n.py - heroe.y) > 150) return;
            var txt = (vistaMapa ? (i + 1) + ' ' : '') + n[l];
            var w = x.measureText(txt).width + 18 * dpr + (vistos[n.id] ? 12 * dpr : 0), h = fs + 12 * dpr;
            var X = Math.round(sx - w / 2), Y = Math.round(sy - h / 2);
            x.fillStyle = '#121620'; x.fillRect(X - dpr, Y - dpr, w + 2 * dpr, h + 2 * dpr);
            x.fillStyle = activo ? C.acento : '#232a38'; x.fillRect(X, Y, w, h);
            x.fillStyle = '#ffffff';
            x.fillText(txt, sx + (vistos[n.id] ? 6 * dpr : 0), sy + dpr);
            if (vistos[n.id]) gema(x, X + 9 * dpr, sy, 4 * dpr);
        });
    }
    function gema(x, cx, cy, r) {
        x.fillStyle = '#121620';
        x.beginPath(); x.moveTo(cx, cy - r - 1); x.lineTo(cx + r * 0.75 + 1, cy); x.lineTo(cx, cy + r + 1); x.lineTo(cx - r * 0.75 - 1, cy); x.fill();
        x.fillStyle = '#3ee6a0';
        x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.75, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.75, cy); x.fill();
    }

    /* ---------- Panel de nivel ---------- */
    function sub(n) { return typeof n.sub === 'string' ? { es: n.sub, en: n.sub } : n.sub; }
    function abrir(i) {
        if (abiertoNivel >= 0) return;
        var n = NIVELES[i];
        abiertoNivel = i; sel = i;
        ruta = []; rutaNivel = -1; marca = null; teclas = {};
        cuerpoPanel.innerHTML = '';
        if (n.carrera) cuerpoPanel.innerHTML = htmlCarrera(CARRERA[n.id]);
        else n.piezas.forEach(function (s) {
            var el = document.querySelector(s);
            if (!el) return;
            var hueco = document.createComment('j');
            el.parentNode.insertBefore(hueco, el);
            devueltas.push({ el: el, hueco: hueco });
            var envoltorio = el.parentNode.tagName === 'OL' || el.parentNode.tagName === 'UL' ? document.createElement(el.parentNode.tagName.toLowerCase()) : null;
            if (envoltorio) { envoltorio.className = el.parentNode.className; envoltorio.appendChild(el); cuerpoPanel.appendChild(envoltorio); }
            else cuerpoPanel.appendChild(el);
            el.querySelectorAll('.aparece').forEach(function (a) { a.classList.add('visto'); });
            if (el.classList.contains('aparece')) el.classList.add('visto');
        });
        var s = sub(n);
        juego.querySelector('[data-j-panel-num]').innerHTML = '<span lang="es">Nivel ' + (i + 1) + ' de ' + NIVELES.length + '</span><span lang="en">Level ' + (i + 1) + ' of ' + NIVELES.length + '</span> · ' + bi(s);
        juego.querySelector('[data-j-panel-titulo]').innerHTML = bi(n);
        juego.querySelector('[data-j-panel-paso="-1"]').hidden = i === 0;
        var sig = juego.querySelector('[data-j-panel-paso="1"]');
        sig.innerHTML = i === NIVELES.length - 1
            ? '<span lang="es">Volver al mapa</span><span lang="en">Back to map</span>'
            : '<span lang="es">Siguiente<span class="sig-nombre">: ' + NIVELES[i + 1].es + '</span></span><span lang="en">Next<span class="sig-nombre">: ' + NIVELES[i + 1].en + '</span></span><span aria-hidden="true"> ▶</span>';
        panel.hidden = false;
        juego.querySelector('.panel-caja').scrollTop = 0;
        requestAnimationFrame(function () { panel.classList.add('abierto'); });
        juego.querySelector('[data-j-panel-titulo]').focus({ preventScroll: true });
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.preload = 'auto'; if (!reducido) v.play().catch(function () {}); });
        if (!vistos[n.id]) { vistos[n.id] = 1; guardar('niveles-vistos', JSON.stringify(vistos)); recienGanada = i; }
        enMarcha = false;
        pintarHud();
    }
    function cerrar() {
        if (abiertoNivel < 0) return;
        var n = NIVELES[abiertoNivel];
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.pause(); });
        devueltas.forEach(function (d) { d.hueco.parentNode.insertBefore(d.el, d.hueco); d.hueco.remove(); });
        devueltas = [];
        cuerpoPanel.innerHTML = '';
        panel.classList.remove('abierto');
        panel.hidden = true;
        abiertoNivel = -1;
        heroe.x = n.entrada.x; heroe.y = n.entrada.y + 6; heroe.dir = 'abajo';
        if (recienGanada >= 0) {
            var total = NIVELES.filter(function (x) { return vistos[x.id]; }).length;
            for (var k = 0; k < 26; k++) particulas.push({ x: heroe.x, y: heroe.y - 20, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 70, v: 1 + Math.random() * 0.6, c: ['#3ee6a0', '#ffd36b', '#9fdcff', '#ffffff'][k % 4] });
            if (total === NIVELES.length) decir({ es: '¡Las 15 gemas! Ya conoces a Rodrigo. ¿Le escribes? El buzón está junto a la playa.', en: 'All 15 gems! Now you know Rodrigo. Want to write to him? The mailbox is by the beach.' }, true);
            else decir({ es: '¡Gema conseguida! Llevas ' + total + ' de 15.', en: 'Gem found! That\'s ' + total + ' of 15.' }, true);
            recienGanada = -1;
        }
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
        if (abiertoNivel >= 0) { if (k === 'escape') cerrar(); return; }
        if (vistaMapa && (k === 'escape' || k === 'm')) { e.preventDefault(); cerrarMapa(); return; }
        if (k === 'm') { abrirMapa(); return; }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
            e.preventDefault(); teclas[k] = true; arrancar(); return;
        }
        if (k === 'e' || ((k === 'enter' || k === ' ') && !e.target.closest('button'))) { e.preventDefault(); accion(); }
        if (k === 'pageup') { e.preventDefault(); irANivel(sel - 1, false); }
        if (k === 'pagedown') { e.preventDefault(); irANivel(sel + 1, false); }
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
