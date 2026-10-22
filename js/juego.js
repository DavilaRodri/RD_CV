/* rodrigodavila.com · modo juego
   Una ciudad cyberpunk en pixel art que se recorre andando, con aRDi, un dron
   que acompaña. La ciudad va por barrios: el distrito de empresas (cada torre
   es una etapa de su carrera), la plaza central, la zona creativa y el barrio
   de las apps, donde cada local es una app. Las empresas tienen su propio
   contenido (todos los proyectos); el resto usa el mismo HTML de la versión
   clásica, que se mueve al panel y vuelve a su sitio al cerrarlo. */

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

    /* ---------- Plano de la ciudad ---------- */
    // Tres avenidas de este a oeste y dos de norte a sur. Los edificios dan a la
    // acera que queda justo encima de cada avenida; x, y es la casilla de la puerta.
    var MW = 84, MH = 58;
    var AVENIDAS_H = [18, 38, 52];          // primera fila de cada avenida (3 de alto)
    var AVENIDAS_V = [28, 56];              // primera columna de cada avenida (3 de ancho)
    var PLAZA = { x0: 32, x1: 54, y0: 27, y1: 36 };
    var BARRIOS = [
        { id: 'empresas', y0: 0, y1: 21, es: 'Distrito de empresas', en: 'Business district',
            hada: { es: 'El distrito de empresas: cada torre es una etapa de la carrera de Rodrigo.', en: 'The business district: every tower is a stage of Rodrigo\'s career.' } },
        { id: 'plaza', x0: 32, x1: 54, y0: 22, y1: 37, es: 'Plaza central', en: 'Central plaza',
            hada: { es: 'La plaza central. Aquí viven Rodrigo y su IA.', en: 'The central plaza. Rodrigo and his AI live here.' } },
        { id: 'creativa', y0: 22, y1: 41, es: 'Zona creativa', en: 'Creative quarter',
            hada: { es: 'La zona creativa: webs a medida y el taller de proyectos.', en: 'The creative quarter: custom websites and the project workshop.' } },
        { id: 'apps', y0: 42, y1: 58, es: 'Barrio de las apps', en: 'App quarter',
            hada: { es: '¡El barrio de las apps! Cada local es una app que Rodrigo ha publicado.', en: 'The app quarter! Every shop is an app Rodrigo has shipped.' } }
    ];

    var NIVELES = [
        { id: 'inicio', x: 37, y: 26, tipo: 'loft', w: 72, h: 78, es: 'Inicio', en: 'Home', sub: 'Rodrigo Dávila', piezas: ['#inicio .portada-texto'],
            hada: { es: 'Este es el loft de Rodrigo. Entra para saber quién es.', en: 'This is Rodrigo\'s loft. Step in to meet him.' } },
        { id: 'chat', x: 48, y: 26, tipo: 'nucleo', w: 48, h: 96, es: 'Pregúntame', en: 'Ask me', sub: { es: 'Mi IA', en: 'My AI' }, piezas: ['#asistente .chat'],
            hada: { es: 'En el núcleo de IA vive el asistente de Rodrigo. ¡Pregúntale lo que quieras!', en: 'Rodrigo\'s assistant lives in the AI core. Ask it anything!' } },
        { id: 'accenture-2017', x: 8, y: 16, tipo: 'oficina', logo: 'accenture', w: 64, h: 176, es: 'Accenture', en: 'Accenture', sub: '2017 – 2018', carrera: true,
            hada: { es: 'Aquí empezó todo, en 2017: su primer código Java para BBVA.', en: 'It all began here in 2017: his first Java code for BBVA.' } },
        { id: 'altia', x: 18, y: 16, tipo: 'oficina', logo: 'altia', w: 64, h: 170, es: 'Altia', en: 'Altia', sub: '2018 – 2021', carrera: true,
            hada: { es: 'En Altia trabajó para Cepsa, BMW y la Comunidad de Madrid.', en: 'At Altia he worked for Cepsa, BMW and the Madrid regional government.' } },
        { id: 'deloitte', x: 36, y: 16, tipo: 'oficina', logo: 'deloitte', w: 72, h: 200, es: 'Deloitte', en: 'Deloitte', sub: '2021 – 2025', carrera: true,
            hada: { es: 'Deloitte: cuatro años y medio liderando proyectos para Santander, Acciona y Cruz Roja.', en: 'Deloitte: four and a half years leading projects for Santander, Acciona and the Red Cross.' } },
        { id: 'accenture', x: 47, y: 16, tipo: 'torre', w: 80, h: 248, es: 'Accenture · BBVA', en: 'Accenture · BBVA', sub: { es: '2025 – hoy', en: '2025 – now' }, carrera: true,
            hada: { es: '¡Mira los agentes dando vueltas! Aquí diseña sistemas multiagente para BBVA.', en: 'Look at those agents spinning! This is where he designs multi-agent systems for BBVA.' } },
        { id: 'habilidades', x: 68, y: 16, tipo: 'lab', w: 104, h: 112, es: 'Lo que sé hacer', en: 'What I can do', sub: { es: 'Habilidades', en: 'Skills' }, piezas: ['#capacidades .mapa', '.formacion'],
            hada: { es: 'El laboratorio guarda todo lo que sabe hacer: IA, código, cloud y gestión.', en: 'The lab holds everything he can do: AI, code, cloud and management.' } },
        { id: 'urbapadel', x: 8, y: 50, tipo: 'club', app: 'urbapadel', w: 96, h: 112, es: 'UrbaPadel', en: 'UrbaPadel', sub: 'App', piezas: ['#urbapadel'],
            hada: { es: 'UrbaPadel: reservas de pádel para urbanizaciones. ¡La usan más de 150 vecinos!', en: 'UrbaPadel: padel court booking for residential communities. Over 150 residents use it!' } },
        { id: 'lullcam', x: 19, y: 50, tipo: 'casita', app: 'lullcam', w: 64, h: 96, es: 'LullCam', en: 'LullCam', sub: 'App', piezas: ['#lullcam'],
            hada: { es: 'LullCam: un vigilabebés sin nube y cifrado de extremo a extremo.', en: 'LullCam: a baby monitor with no cloud and end-to-end encryption.' } },
        { id: 'tumenu', x: 37, y: 50, tipo: 'bar', app: 'tumenu', w: 80, h: 100, es: 'TuMenu', en: 'TuMenu', sub: 'App', piezas: ['#tumenu'],
            hada: { es: 'TuMenu: el bar manda el menú por WhatsApp y la IA hace el resto.', en: 'TuMenu: the bar sends its menu over WhatsApp and AI does the rest.' } },
        { id: 'godafly', x: 48, y: 50, tipo: 'hangar', app: 'godafly', w: 96, h: 100, es: 'GodaFly', en: 'GodaFly', sub: 'App', piezas: ['#godafly'],
            hada: { es: 'GodaFly conecta a gente que viaja sola en aeropuertos y escalas.', en: 'GodaFly connects people travelling alone at airports and layovers.' } },
        { id: 'mifilmoteca', x: 67, y: 50, tipo: 'cine', app: 'mifilmoteca', w: 96, h: 120, es: 'Mi Filmoteca', en: 'Mi Filmoteca', sub: 'App', piezas: ['#mifilmoteca'],
            hada: { es: 'Mi Filmoteca fue su primera app en las tiendas, en 2020.', en: 'Mi Filmoteca was his first app on the stores, back in 2020.' } },
        { id: 'webs', x: 12, y: 36, tipo: 'pantallas', w: 120, h: 200, es: 'Webs', en: 'Websites', sub: { es: 'A medida', en: 'Custom' }, piezas: ['#webs .webs-rejilla'],
            hada: { es: 'Las pantallas gigantes enseñan sus webs a medida: bodas, restaurantes y comercios.', en: 'The giant screens show his custom websites: weddings, restaurants and shops.' } },
        { id: 'taller', x: 66, y: 36, tipo: 'taller', w: 80, h: 92, es: 'El taller', en: 'Workbench', sub: 'Zapeo · RunClap', piezas: ['#zapeo', '#runclap'],
            hada: { es: 'En el taller hay cosas cociéndose: Zapeo y RunClap.', en: 'Things are cooking in the workshop: Zapeo and RunClap.' } },
        { id: 'contacto', x: 77, y: 36, tipo: 'cabina', w: 32, h: 60, es: 'Contacto', en: 'Contact', sub: { es: '¿Hablamos?', en: 'Let\'s talk' }, piezas: ['#contacto .contacto-caja'],
            hada: { es: '¿Te ha gustado? Escríbele desde la cabina.', en: 'Enjoyed it? Send him a message from the booth.' } }
    ];
    // Las 15 pantallas en orden: cada una da una gema.
    var PANTALLAS = NIVELES;
    function pantalla(id) { for (var i = 0; i < PANTALLAS.length; i++) if (PANTALLAS[i].id === id) return i; return -1; }


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


    /* ---------- Paleta: noche de neón ---------- */
    var C = {
        linea: '#07060c', asfalto: '#14121c', asfalto2: '#191724', raya: '#2c2a3c', amarilla: '#9c8226',
        acera: '#252333', acera2: '#2d2a3d', bordillo: '#47425c', bloque: '#0d0c14', bloque2: '#13111c',
        plaza: '#1a1929', plaza2: '#222138', agua: '#07102a', agua2: '#0e1f42',
        cian: '#22e4ff', rosa: '#ff2fb3', morado: '#9b5cff', amarillo: '#ffd23f', verde: '#3dffb0', naranja: '#ff7a2f',
        luz: '#ffd36b', gema: '#3dffb0', puerta: '#0d2a3a'
    };
    var NEONES = [C.cian, C.rosa, C.morado, C.amarillo, C.verde, C.naranja];

    /* ---------- Suelo ---------- */
    var BLOQUE = 0, ASFALTO = 1, ACERA = 2, PLAZA_T = 3, AGUA = 4;
    var suelo = new Uint8Array(MW * MH), solido = new Uint8Array(MW * MH);
    var PW = MW * T, PH = MH * T;
    function ix(x, y) { return y * MW + x; }
    function dentro(x, y) { return x >= 0 && y >= 0 && x < MW && y < MH; }
    function andable(t) { return t === ASFALTO || t === ACERA || t === PLAZA_T; }

    NIVELES.forEach(function (n) {
        n.px = (n.x + 1) * T;           // centro de la puerta
        n.py = (n.y + 1) * T;           // pie de la fachada
        n.entrada = { x: n.px, y: n.py + 8 };
    });

    function generarCiudad() {
        var x, y;
        suelo.fill(BLOQUE);
        AVENIDAS_H.forEach(function (r) {
            for (x = 0; x < MW; x++) { suelo[ix(x, r - 1)] = ACERA; suelo[ix(x, r + 3)] = ACERA; }
        });
        AVENIDAS_V.forEach(function (c) {
            for (y = AVENIDAS_H[0]; y < AVENIDAS_H[2] + 3; y++) { suelo[ix(c - 1, y)] = ACERA; suelo[ix(c + 3, y)] = ACERA; }
        });
        for (y = PLAZA.y0; y <= PLAZA.y1; y++) for (x = PLAZA.x0; x <= PLAZA.x1; x++) suelo[ix(x, y)] = PLAZA_T;
        AVENIDAS_H.forEach(function (r) { for (y = r; y < r + 3; y++) for (x = 0; x < MW; x++) suelo[ix(x, y)] = ASFALTO; });
        AVENIDAS_V.forEach(function (c) { for (y = AVENIDAS_H[0]; y < AVENIDAS_H[2] + 3; y++) for (x = c; x < c + 3; x++) suelo[ix(x, y)] = ASFALTO; });
        for (y = AVENIDAS_H[2] + 4; y < MH; y++) for (x = 0; x < MW; x++) suelo[ix(x, y)] = AGUA;
        for (var i = 0; i < suelo.length; i++) solido[i] = andable(suelo[i]) ? 0 : 1;
        // El proyector de la plaza
        var pcx = Math.floor((PLAZA.x0 + PLAZA.x1) / 2), pcy = 32;
        for (y = pcy - 1; y <= pcy; y++) for (x = pcx - 1; x <= pcx + 1; x++) solido[ix(x, y)] = 1;
    }
    var PROYECTOR = { x: (Math.floor((PLAZA.x0 + PLAZA.x1) / 2) + 0.5) * T, y: 32 * T + 8 };

    /* ---------- Dibujo ---------- */
    function lienzo(w, h) {
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
        var x = c.getContext('2d');
        x.imageSmoothingEnabled = false;
        return { c: c, x: x };
    }
    // Letras de 3x5 para los rótulos de neón
    var FUENTE = {
        A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
        D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], I: ['###', '.#.', '.#.', '.#.', '###'],
        L: ['#..', '#..', '#..', '#..', '###'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
        R: ['##.', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
        V: ['#.#', '#.#', '#.#', '#.#', '.#.'], '>': ['#..', '.#.', '..#', '.#.', '#..']
    };
    function anchoTexto(t, s) { var w = 0; for (var i = 0; i < t.length; i++) w += (FUENTE[t[i]][0].length + 1) * s; return w - s; }

    // Pre-renderiza el halo de los neones de un sprite. Sin filtro de desenfoque
    // (algunos Safari), se aproxima con copias desplazadas.
    var HALO = 10;
    function hacerHalo(neon) {
        var g = lienzo(neon.width + HALO * 2, neon.height + HALO * 2);
        if (typeof g.x.filter === 'string') {
            g.x.filter = 'blur(4px)';
            g.x.drawImage(neon, HALO, HALO);
            g.x.drawImage(neon, HALO, HALO);
            g.x.filter = 'none';
        } else {
            g.x.globalAlpha = 0.14;
            for (var dy = -4; dy <= 4; dy += 2) for (var dx = -4; dx <= 4; dx += 2) g.x.drawImage(neon, HALO + dx, HALO + dy);
        }
        return g.c;
    }

    // Lienzo de fachada con su capa de neón
    function fachada(W, H) {
        var L = lienzo(W, H), N = lienzo(W, H);
        var f = {
            c: L.c, x: L.x, n: N,
            p: function (X, Y, w, h, c) { L.x.fillStyle = c; L.x.fillRect(X, Y, w, h); },
            caja: function (X, Y, w, h, c) { f.p(X, Y, w, h, C.linea); f.p(X + 1, Y + 1, w - 2, h - 2, c); },
            neon: function (X, Y, w, h, c, fuerza) {
                // Los neones flojos (escaparates, ventanas) se ven tintados, no a pleno color
                L.x.globalAlpha = fuerza != null && fuerza < 0.5 ? 0.6 : 1;
                f.p(X, Y, w, h, c);
                L.x.globalAlpha = 1;
                N.x.globalAlpha = fuerza == null ? 1 : fuerza;
                N.x.fillStyle = c; N.x.fillRect(X, Y, w, h);
                N.x.globalAlpha = 1;
            },
            letras: function (X, Y, t, c, s, vertical) {
                s = s || 1;
                for (var i = 0; i < t.length; i++) {
                    var g = FUENTE[t[i]], gw = g[0].length;
                    var ox = vertical ? X - Math.floor(gw * s / 2) : X;
                    for (var r = 0; r < 5; r++) for (var k = 0; k < gw; k++) if (g[r][k] === '#') f.neon(ox + k * s, Y + r * s, s, s, c);
                    if (vertical) Y += 6 * s; else X += (gw + 1) * s;
                }
            },
            ventanas: function (x0, y0, cols, filas, ww, wh, sx, sy, prob, r, colores, apagada) {
                for (var j = 0; j < filas; j++) for (var i = 0; i < cols; i++) {
                    var X = x0 + i * sx, Y = y0 + j * sy;
                    f.p(X - 1, Y - 1, ww + 2, wh + 2, C.linea);
                    if (r() < prob) f.neon(X, Y, ww, wh, colores[Math.floor(r() * colores.length)], 0.3);
                    else f.p(X, Y, ww, wh, apagada || '#1f2640');
                }
            },
            glifos: function (X, Y, n, s, c, r, vertical) {
                // Carteles con signos inventados: dan ambiente sin decir nada
                for (var i = 0; i < n; i++) {
                    for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) if (r() < 0.55) f.neon(X + b * s, Y + a * s, s, s, c);
                    if (vertical) Y += 4 * s; else X += 4 * s;
                }
            },
            fin: function () { return { c: L.c, halo: hacerHalo(N.c) }; }
        };
        return f;
    }

    function spriteNivel(n, semilla) {
        var W = n.w, H = n.h, r = azar(semilla * 97 + 13), f = fachada(W, H), cx = W / 2;
        var calidas = ['#ffd36b', '#ffb86b', '#ffe6a8'], frias = ['#7fe8ff', '#b7c4ff', '#ffd36b'];
        if (n.tipo === 'oficina') {
            var col = { accenture: '#b45cff', altia: C.naranja, deloitte: '#eef3ff' }[n.logo];
            f.caja(4, 14, W - 8, H - 14, '#1b2136');
            f.p(W - 16, 15, 11, H - 16, '#161b2d');
            f.caja(2, 10, W - 4, 6, '#262d47');
            f.p(W - 18, 0, 2, 11, C.linea);
            f.ventanas(18, 22, Math.floor((W - 26) / 9), Math.floor((H - 58) / 10), 5, 6, 9, 10, 0.5, r, frias);
            // Rótulo vertical con el nombre de la empresa
            var txt = n.logo === 'accenture' ? '>ACCENTURE' : n.logo.toUpperCase();
            var alto = txt.length * 12 + 6;
            f.caja(0, 18, 15, Math.min(alto, H - 44), '#0b0a14');
            if (n.logo === 'accenture') { f.letras(8, 22, '>', '#b45cff', 2, true); f.letras(8, 34, 'ACCENTURE', '#f3e9ff', 2, true); }
            else f.letras(8, 22, txt, col, 2, true);
            if (n.logo === 'deloitte') f.neon(6, 22 + txt.length * 12, 4, 4, '#86e82a');
            f.neon(cx - 15, H - 26, 30, 2, n.logo === 'deloitte' ? '#86e82a' : col);
            f.caja(cx - 9, H - 22, 18, 22, C.puerta);
            f.neon(cx - 7, H - 20, 14, 2, C.cian, 0.6);
            f.p(cx, H - 19, 1, 18, C.linea);
        } else if (n.tipo === 'torre') {
            f.caja(8, 42, 64, H - 42, '#121a33');
            f.p(56, 43, 15, H - 44, '#0e1529');
            f.caja(14, 24, 52, 20, '#16224a');
            f.caja(26, 10, 28, 16, '#1a2a5c');
            f.p(39, 0, 2, 11, C.linea);
            f.letras(40 - anchoTexto('BBVA', 2) / 2, 29, 'BBVA', '#3ea2ff', 2);
            f.neon(16, 41, 48, 2, '#2a7fff');
            f.neon(9, 46, 2, H - 90, '#2a7fff', 0.7);
            f.neon(69, 46, 2, H - 90, '#2a7fff', 0.7);
            f.ventanas(15, 50, 6, Math.floor((H - 100) / 8), 5, 4, 9, 8, 0.6, r, ['#9fd0ff', '#ffffff', '#7fe8ff']);
            f.caja(8, H - 38, 64, 10, '#0b0a14');
            var wa = anchoTexto('>ACCENTURE', 1);
            f.letras(40 - wa / 2, H - 35, '>', '#b45cff', 1);
            f.letras(40 - wa / 2 + 4, H - 35, 'ACCENTURE', '#f3e9ff', 1);
            f.caja(28, H - 24, 24, 24, C.puerta);
            f.neon(30, H - 22, 20, 2, C.cian, 0.7);
            f.p(40, H - 21, 1, 20, C.linea);
        } else if (n.tipo === 'lab') {
            f.caja(2, 36, W - 4, H - 36, '#1a1d2e');
            f.caja(10, 22, 22, 16, '#232842'); f.caja(36, 26, 16, 12, '#232842'); f.caja(W - 30, 20, 20, 18, '#232842');
            f.neon(14, 26, 14, 1, C.verde, 0.6); f.neon(W - 26, 24, 12, 1, C.cian, 0.6);
            f.neon(4, 38, W - 8, 2, C.cian);
            for (var k = 0; k < 3; k++) {
                var bx = 8 + k * 32;
                f.caja(bx, 46, 26, 38, '#0b0d18');
                for (var j = 0; j < 6; j++) f.p(bx + 2, 48 + j * 6, 22, 1, '#20243a');
            }
            f.caja(cx - 10, H - 24, 20, 24, C.puerta);
            f.neon(cx - 8, H - 22, 16, 2, C.cian, 0.6);
        } else if (n.tipo === 'loft') {
            f.caja(2, 8, W - 4, H - 8, '#2a1f33');
            for (var b = 12; b < H; b += 5) f.p(3, b, W - 6, 1, '#241a2c');
            f.caja(0, 4, W, 6, '#33263f');
            f.p(8, 1, 3, 3, '#3a7d4a'); f.p(14, 0, 4, 4, '#3a7d4a'); f.p(W - 14, 1, 4, 3, '#3a7d4a');
            f.caja(8, 14, 24, 18, '#ffb86b'); f.caja(W - 32, 14, 24, 18, '#ffb86b');
            f.neon(9, 15, 22, 16, '#ffb86b', 0.25); f.neon(W - 31, 15, 22, 16, '#ffb86b', 0.25);
            f.p(19, 15, 1, 16, C.linea); f.p(W - 21, 15, 1, 16, C.linea);
            f.p(5, 33, W - 10, 2, C.linea);
            f.neon(5, 35, W - 10, 1, C.rosa);
            f.caja(cx - 15, H - 40, 30, 13, '#0b0a14');
            f.letras(cx - anchoTexto('RD', 2) / 2, H - 38, 'RD', C.cian, 2);
            f.caja(8, H - 26, 14, 12, '#ffd36b'); f.caja(W - 22, H - 26, 14, 12, '#ffd36b');
            f.neon(9, H - 25, 12, 10, '#ffd36b', 0.25); f.neon(W - 21, H - 25, 12, 10, '#ffd36b', 0.25);
            f.caja(cx - 8, H - 24, 16, 24, '#3b2a1e');
            f.neon(cx - 6, H - 22, 12, 1, C.luz, 0.8);
        } else if (n.tipo === 'nucleo') {
            f.caja(4, H - 26, W - 8, 26, '#1a1d2e');
            f.caja(12, 22, 24, H - 46, '#151a2c');
            for (var y2 = 28; y2 < H - 30; y2 += 9) f.neon(12, y2, 24, 2, C.cian, 0.8);
            f.caja(9, 12, 30, 12, '#1d2440');
            f.neon(13, 15, 22, 2, C.rosa);
            f.p(23, 2, 2, 11, C.linea);
            f.caja(cx - 7, H - 20, 14, 20, C.puerta);
            f.neon(cx - 5, H - 18, 10, 2, C.cian, 0.7);
        } else if (n.tipo === 'pantallas') {
            f.caja(4, 10, W - 8, H - 10, '#17141f');
            f.p(W - 18, 11, 13, H - 12, '#120f19');
            f.caja(10, 24, W - 20, 72, '#05050a');
            f.neon(8, 21, W - 16, 2, C.rosa);
            f.neon(8, 97, W - 16, 2, C.cian);
            f.caja(10, 106, 46, 32, '#05050a'); f.caja(W - 56, 106, 46, 32, '#05050a');
            f.ventanas(14, 148, 10, 2, 6, 5, 10, 9, 0.35, r, ['#ffd36b', '#ff8bd6', '#7fe8ff']);
            f.caja(10, H - 34, 30, 22, '#ff8bd6'); f.neon(11, H - 33, 28, 20, '#ff8bd6', 0.2);
            f.caja(W - 40, H - 34, 30, 22, '#7fe8ff'); f.neon(W - 39, H - 33, 28, 20, '#7fe8ff', 0.2);
            f.caja(cx - 10, H - 26, 20, 26, C.puerta);
            f.neon(cx - 8, H - 24, 16, 2, C.cian, 0.7);
        } else if (n.tipo === 'taller') {
            f.caja(2, 22, W - 4, H - 22, '#2a2430');
            for (var t2 = 0; t2 < 4; t2++) {
                var sx = 4 + t2 * 18;
                for (var yy = 0; yy < 10; yy++) f.p(sx, 12 + yy, Math.round(yy * 1.7) + 1, 1, '#33293a');
                f.neon(sx + 16, 14, 1, 8, C.luz, 0.5);
            }
            f.caja(cx - 20, H - 42, 40, 42, '#1b1720');
            for (var s2 = 0; s2 < 5; s2++) f.p(cx - 19, H - 41 + s2 * 3, 38, 2, s2 % 2 ? '#4a4252' : '#3e3746');
            f.p(cx - 19, H - 26, 38, 25, '#3a2a1a');
            f.neon(cx - 19, H - 26, 38, 2, '#ffb347');
            f.p(cx - 14, H - 14, 12, 3, '#6b4a2a'); f.p(cx + 4, H - 18, 10, 17, '#2f2a36');
            f.caja(W - 18, H - 30, 12, 10, '#ffd36b');
            f.neon(W - 17, H - 29, 10, 8, '#ffd36b', 0.3);
        } else if (n.tipo === 'cabina') {
            f.caja(4, 12, W - 8, H - 12, '#0f1a24');
            f.p(7, 16, W - 14, H - 20, '#12304a');
            f.neon(4, 12, W - 8, 2, C.cian); f.neon(4, 12, 2, H - 12, C.cian); f.neon(W - 6, 12, 2, H - 12, C.cian);
            f.caja(6, 0, W - 12, 13, '#0b0a14');
            f.neon(11, 24, W - 22, 7, C.verde, 0.6);
            f.p(cx - 1, 36, 2, 12, C.linea);
        } else if (n.tipo === 'club') {
            f.caja(2, 26, W - 4, H - 26, '#1b2230');
            f.caja(0, 20, W, 8, '#232c3e');
            f.caja(8, 36, W - 16, 44, '#0a1a14');
            f.p(9, 37, W - 18, 42, '#1f6e4a');
            f.p(12, 40, W - 24, 1, '#dfffe9'); f.p(12, 75, W - 24, 1, '#dfffe9'); f.p(12, 40, 1, 36, '#dfffe9'); f.p(W - 13, 40, 1, 36, '#dfffe9');
            f.p(cx, 40, 1, 36, '#dfffe9');
            f.p(cx - 1, 38, 3, 40, '#c9d3dc');
            f.neon(4, 28, W - 8, 2, C.verde);
            f.caja(W - 30, 0, 28, 22, '#0b0a14');
            f.caja(cx - 9, H - 24, 18, 24, C.puerta);
            f.neon(cx - 7, H - 22, 14, 2, C.verde, 0.7);
            f.caja(8, H - 22, 22, 14, '#7fe8ff'); f.neon(9, H - 21, 20, 12, '#7fe8ff', 0.2);
        } else if (n.tipo === 'casita') {
            f.caja(6, 38, W - 12, H - 38, '#2a2540');
            for (var yt = 0; yt < 24; yt++) {
                var hw = Math.round(6 + yt * 1.15);
                f.p(cx - hw - 1, 14 + yt, hw * 2 + 2, 1, C.linea);
                f.p(cx - hw, 14 + yt, hw * 2, 1, yt % 4 === 3 ? '#2e2546' : '#3b2f55');
            }
            f.caja(4, 2, 24, 24, '#0b0a14');
            f.caja(cx - 10, 48, 20, 16, '#ffdca8');
            f.neon(cx - 9, 49, 18, 14, '#ffdca8', 0.25);
            f.p(cx - 6, 58, 12, 2, '#6b4a3a'); f.p(cx - 6, 54, 1, 4, '#6b4a3a'); f.p(cx + 5, 54, 1, 4, '#6b4a3a');
            f.caja(cx - 7, H - 22, 14, 22, '#3b2a1e');
            f.neon(cx - 5, H - 20, 10, 1, C.luz, 0.8);
        } else if (n.tipo === 'bar') {
            f.caja(2, 26, W - 4, H - 26, '#2a1a24');
            f.ventanas(10, 70 - 34, 7, 1, 5, 5, 9, 9, 0.5, r, calidas);
            f.caja(cx - 15, 2, 30, 28, '#0b0a14');
            f.neon(cx - 15, 2, 30, 2, C.rosa); f.neon(cx - 15, 28, 30, 2, C.rosa);
            for (var a2 = 0; a2 < W - 4; a2 += 6) f.neon(2 + a2, H - 46, 3, 8, a2 % 12 ? '#f4e9ff' : C.rosa, a2 % 12 ? 0.2 : 0.8);
            f.p(2, H - 38, W - 4, 2, C.linea);
            f.caja(6, H - 34, 24, 22, '#ffb86b'); f.caja(W - 30, H - 34, 24, 22, '#ffb86b');
            f.neon(7, H - 33, 22, 20, '#ffb86b', 0.25); f.neon(W - 29, H - 33, 22, 20, '#ffb86b', 0.25);
            f.p(12, H - 24, 5, 12, '#3a2030'); f.p(20, H - 26, 5, 14, '#3a2030'); f.p(W - 22, H - 25, 5, 13, '#3a2030');
            f.caja(cx - 8, H - 26, 16, 26, C.puerta);
            f.neon(cx - 6, H - 24, 12, 2, C.rosa, 0.7);
        } else if (n.tipo === 'hangar') {
            for (var yh = 0; yh < 26; yh++) {
                var hh = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((25 - yh) / 26, 2))) * (W / 2 - 2));
                f.p(cx - hh - 1, 16 + yh, hh * 2 + 2, 1, C.linea);
                f.p(cx - hh, 16 + yh, hh * 2, 1, yh % 5 === 4 ? '#262e40' : '#2f384d');
            }
            f.caja(2, 42, W - 4, H - 42, '#1d2433');
            f.caja(4, 0, 24, 24, '#0b0a14');
            f.caja(14, H - 46, W - 28, 46, '#0a0d16');
            f.neon(14, H - 46, W - 28, 2, C.cian, 0.7);
            f.p(cx - 22, H - 26, 40, 10, '#dfe6f2'); f.p(cx + 18, H - 24, 6, 6, '#dfe6f2');
            f.neon(cx + 12, H - 25, 8, 3, C.cian);
            f.p(cx - 8, H - 18, 18, 3, '#b8c2d4'); f.p(cx - 22, H - 32, 4, 7, '#b8c2d4');
        } else if (n.tipo === 'cine') {
            f.caja(2, 22, W - 4, H - 22, '#2a1426');
            f.caja(cx - 16, 28, 32, 30, '#0b0a14');
            f.neon(cx - 16, 28, 32, 2, C.amarillo); f.neon(cx - 16, 56, 32, 2, C.amarillo);
            f.caja(6, H - 58, W - 12, 20, '#0b0a14');
            f.neon(10, H - 50, W - 20, 3, C.rosa, 0.8);
            f.caja(8, H - 34, 16, 24, '#3a2a5a'); f.caja(W - 24, H - 34, 16, 24, '#5a2a3a');
            f.neon(9, H - 33, 14, 22, '#9b5cff', 0.25); f.neon(W - 23, H - 33, 14, 22, '#ff2fb3', 0.25);
            f.caja(cx - 12, H - 30, 24, 30, '#3b0f24');
            f.neon(cx - 10, H - 28, 20, 2, C.amarillo, 0.7);
            f.p(cx, H - 27, 1, 26, C.linea);
        }
        return f.fin();
    }

    // Edificios de relleno: torres de pisos y tiendas con carteles de neón
    function spriteRelleno(W, H, semilla) {
        var r = azar(semilla), f = fachada(W, H);
        var cuerpo = ['#1a1830', '#1c2236', '#221a2e', '#16202a', '#201d2c'][Math.floor(r() * 5)];
        var neon = NEONES[Math.floor(r() * NEONES.length)];
        var top = H > 100 ? 8 : 4;
        f.caja(1, top, W - 2, H - top, cuerpo);
        f.p(W - 9, top + 1, 7, H - top - 2, 'rgba(0,0,0,.25)');
        f.caja(0, top - 4, W, 6, '#262438');
        if (r() < 0.7) f.caja(4 + Math.floor(r() * (W - 20)), top - 10, 10, 7, '#2a2840');
        if (r() < 0.4) f.p(W - 10, 0, 2, top, C.linea);
        var cols = Math.max(1, Math.floor((W - 12) / 8)), filas = Math.max(0, Math.floor((H - top - 38) / 9));
        f.ventanas(6 + Math.floor(((W - 12) - cols * 8 + 3) / 2), top + 8, cols, filas, 4, 5, 8, 9, 0.38, r, ['#ffd36b', '#7fe8ff', '#ff8bd6', '#ffb86b']);
        // Planta baja: escaparate con toldo
        var toldo = NEONES[Math.floor(r() * NEONES.length)];
        f.p(2, H - 26, W - 4, 3, C.linea);
        f.neon(2, H - 27, W - 4, 2, toldo, 0.9);
        f.caja(5, H - 22, W - 10, 18, '#0f0e18');
        f.neon(6, H - 21, W - 12, 16, toldo, 0.18);
        if (W > 40) f.caja(Math.floor(W / 2) - 5, H - 20, 10, 20, '#121020');
        // Cartel vertical u horizontal con signos
        if (H > 90 && r() < 0.75) {
            var n2 = 3 + Math.floor(r() * 4), lado = r() < 0.5 ? 0 : W - 12;
            f.caja(lado, top + 14, 12, n2 * 8 + 4, '#0b0a14');
            f.glifos(lado + 3, top + 17, n2, 2, neon, r, true);
        } else if (r() < 0.6) {
            var n3 = Math.max(2, Math.floor((W - 16) / 8));
            f.caja(4, H - 40, n3 * 8 + 6, 12, '#0b0a14');
            f.glifos(7, H - 37, n3, 2, neon, r, false);
        }
        return f.fin();
    }

    function pintarSuelo() {
        var L = lienzo(PW, PH), x = L.x, X, Y, k;
        function es(a, b) { return dentro(a, b) ? suelo[ix(a, b)] : BLOQUE; }
        function horizontal(Y) { for (var i = 0; i < AVENIDAS_H.length; i++) if (Y >= AVENIDAS_H[i] && Y < AVENIDAS_H[i] + 3) return AVENIDAS_H[i]; return -1; }
        function vertical(X) { for (var i = 0; i < AVENIDAS_V.length; i++) if (X >= AVENIDAS_V[i] && X < AVENIDAS_V[i] + 3) return AVENIDAS_V[i]; return -1; }
        for (Y = 0; Y < MH; Y++) for (X = 0; X < MW; X++) {
            var t = suelo[ix(X, Y)], px = X * T, py = Y * T;
            if (t === ASFALTO) {
                x.fillStyle = C.asfalto; x.fillRect(px, py, T, T);
                for (k = 0; k < 5; k++) { x.fillStyle = C.asfalto2; x.fillRect(px + Math.floor(hash(X * 3 + k, Y) * 15), py + Math.floor(hash(X, Y * 3 + k) * 15), 2, 1); }
                var h = horizontal(Y), v = vertical(X);
                if (h >= 0 && v < 0) {
                    if (Y === h + 1) { x.fillStyle = C.amarilla; for (k = 0; k < T; k += 8) x.fillRect(px + k, py + 7, 5, 2); }
                    if (Y === h) { x.fillStyle = C.raya; x.fillRect(px, py + 2, T, 1); }
                    if (Y === h + 2) { x.fillStyle = C.raya; x.fillRect(px, py + T - 3, T, 1); }
                    var cerca = AVENIDAS_V.some(function (c) { return X === c - 1 || X === c + 3; });
                    if (cerca) { x.fillStyle = '#3a374e'; for (k = 1; k < T; k += 4) x.fillRect(px + 2, py + k, 12, 2); }
                } else if (v >= 0 && h < 0) {
                    if (X === v + 1) { x.fillStyle = C.amarilla; for (k = 0; k < T; k += 8) x.fillRect(px + 7, py + k, 2, 5); }
                    var cruce = AVENIDAS_H.some(function (r) { return Y === r - 1 || Y === r + 3; });
                    if (cruce) { x.fillStyle = '#3a374e'; for (k = 1; k < T; k += 4) x.fillRect(px + k, py + 2, 2, 12); }
                }
                // Charcos que reflejan los neones
                if (hash(X * 7, Y * 11) < 0.05) {
                    var cx0 = px + 3 + Math.floor(hash(X, Y) * 6), cy0 = py + 5 + Math.floor(hash(Y, X) * 6);
                    x.fillStyle = '#1d2346'; x.fillRect(cx0, cy0, 9, 3); x.fillRect(cx0 + 2, cy0 - 1, 5, 5);
                    x.fillStyle = NEONES[Math.floor(hash(X + 3, Y) * NEONES.length)]; x.globalAlpha = 0.5; x.fillRect(cx0 + 2, cy0 + 1, 4, 1); x.globalAlpha = 1;
                }
            } else if (t === ACERA) {
                x.fillStyle = C.acera; x.fillRect(px, py, T, T);
                x.fillStyle = C.acera2; x.fillRect(px, py, T, 1); x.fillRect(px, py + 8, T, 1); x.fillRect(px + ((Y % 2) ? 4 : 12), py, 1, T);
                if (es(X, Y - 1) === ASFALTO) { x.fillStyle = C.bordillo; x.fillRect(px, py, T, 2); }
                if (es(X, Y + 1) === ASFALTO) { x.fillStyle = C.bordillo; x.fillRect(px, py + T - 2, T, 2); }
                if (es(X - 1, Y) === ASFALTO) { x.fillStyle = C.bordillo; x.fillRect(px, py, 2, T); }
                if (es(X + 1, Y) === ASFALTO) { x.fillStyle = C.bordillo; x.fillRect(px + T - 2, py, 2, T); }
                if (es(X, Y - 1) === BLOQUE) { x.fillStyle = '#100f18'; x.fillRect(px, py, T, 3); }
                if (es(X, Y + 1) === AGUA) {
                    x.fillStyle = '#45405a'; x.fillRect(px, py + T - 3, T, 2);
                    x.fillStyle = C.linea; x.fillRect(px + 2, py + T - 8, 2, 6); x.fillRect(px + 10, py + T - 8, 2, 6);
                    x.fillStyle = '#5a5574'; x.fillRect(px, py + T - 9, T, 2);
                }
            } else if (t === PLAZA_T) {
                x.fillStyle = C.plaza; x.fillRect(px, py, T, T);
                x.fillStyle = C.plaza2; x.fillRect(px, py, T, 1); x.fillRect(px, py, 1, T);
                var dx = X + 0.5 - PROYECTOR.x / T, dy = (Y + 0.5 - PROYECTOR.y / T) * 1.5, d = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(d - 5) < 0.6) { x.fillStyle = C.cian; x.globalAlpha = 0.45; x.fillRect(px + 7, py + 7, 2, 2); x.globalAlpha = 1; }
                if (es(X, Y - 1) === BLOQUE) { x.fillStyle = '#100f18'; x.fillRect(px, py, T, 3); }
            } else if (t === AGUA) {
                x.fillStyle = C.agua; x.fillRect(px, py, T, T);
                x.fillStyle = C.agua2; x.fillRect(px + Math.floor(hash(X, Y) * 8), py + 4 + Math.floor(hash(Y, X) * 8), 6, 1);
            } else {
                // Azoteas de las manzanas
                x.fillStyle = C.bloque; x.fillRect(px, py, T, T);
                x.fillStyle = C.bloque2;
                if (hash(X, Y * 5) < 0.2) x.fillRect(px + 3, py + 3, 8, 6);
                if (hash(X * 5, Y) < 0.15) { x.fillRect(px + 9, py + 9, 4, 4); x.fillStyle = '#1b1926'; x.fillRect(px + 10, py + 10, 2, 2); }
                if (es(X, Y + 1) !== BLOQUE && es(X, Y + 1) !== AGUA) { x.fillStyle = '#100f18'; x.fillRect(px, py + T - 2, T, 2); }
            }
        }
        return L.c;
    }

    /* ---------- Personaje y dron ---------- */
    function dibujaHeroe(x, X, Y, dir, paso) {
        var bob = paso ? -1 : 0, partes = [];
        function parte(px, py, w, h, c) { partes.push([px, py, w, h, c]); }
        var pa = paso === 1 ? -1 : 0, pb = paso === 2 ? -1 : 0;
        if (dir === 'izq' || dir === 'der') {
            parte(X - 3 + (paso === 1 ? -1 : 0), Y - 5, 3, 5, '#1a1a26');
            parte(X + (paso === 2 ? 1 : 0), Y - 5, 3, 5, '#1a1a26');
        } else {
            parte(X - 4, Y - 5 + pa, 3, 5 - pa, '#1a1a26');
            parte(X + 1, Y - 5 + pb, 3, 5 - pb, '#1a1a26');
        }
        if (dir === 'izq') parte(X + 3, Y - 12 + bob, 4, 7, '#3a3358');
        if (dir === 'der') parte(X - 7, Y - 12 + bob, 4, 7, '#3a3358');
        parte(X - 5, Y - 13 + bob, 10, 9, '#30285a');
        if (dir === 'abajo' || dir === 'arriba') {
            var sw = paso === 1 ? 1 : paso === 2 ? -1 : 0;
            parte(X - 7, Y - 12 + bob + sw, 2, 7, '#30285a');
            parte(X + 5, Y - 12 + bob - sw, 2, 7, '#30285a');
        } else {
            var ax = paso === 1 ? -1 : paso === 2 ? 1 : 0;
            parte(X - 1 + ax, Y - 12 + bob, 3, 7, '#30285a');
        }
        parte(X - 5, Y - 22 + bob, 10, 9, '#f1c7a3');
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X - 6, Y - 1, 12, 3);
        partes.forEach(function (q) { x.fillStyle = C.linea; x.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2); });
        partes.forEach(function (q) { x.fillStyle = q[4]; x.fillRect(q[0], q[1], q[2], q[3]); });
        // Ribetes de neón en la chaqueta
        x.fillStyle = C.cian;
        if (dir === 'abajo') { x.fillRect(X - 1, Y - 13 + bob, 2, 8); }
        else if (dir === 'arriba') { x.fillRect(X - 3, Y - 11 + bob, 6, 1); x.fillStyle = C.rosa; x.fillRect(X - 1, Y - 9 + bob, 2, 2); }
        else x.fillRect(dir === 'izq' ? X - 5 : X + 4, Y - 13 + bob, 1, 8);
        x.fillStyle = '#1a1a26'; x.fillRect(X - 5, Y - 6 + bob, 10, 2);
        x.fillStyle = '#2a1a12';
        var hy = Y - 22 + bob;
        if (dir === 'arriba') x.fillRect(X - 5, hy, 10, 8);
        else if (dir === 'abajo') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 1, 3); x.fillRect(X + 4, hy + 3, 1, 3); }
        else if (dir === 'izq') { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X, hy + 3, 5, 4); }
        else { x.fillRect(X - 5, hy, 10, 3); x.fillRect(X - 5, hy + 3, 5, 4); }
        // Visor
        x.fillStyle = C.cian;
        if (dir === 'abajo') x.fillRect(X - 4, hy + 4, 8, 2);
        if (dir === 'izq') x.fillRect(X - 5, hy + 4, 4, 2);
        if (dir === 'der') x.fillRect(X + 1, hy + 4, 4, 2);
    }

    /* ---------- Estado ---------- */
    var juego, lienzoEl, ctx, mini, miniCtx, miniBase, sueloImg, iconos = {}, websImgs = [];
    var objetos = [], coches = [], voladores = [], peatones = [], lluvia = [], farolas = [], vapor = [];
    var heroe = { x: 0, y: 0, dir: 'abajo', dist: 0, moviendo: false, arriba: 0 };
    var hada = { x: 0, y: 0, vx: 0, vy: 0, estela: [] };
    var cam = { x: 0, y: 0 }, camLibre = false, esc = 3, escObj = 3, escBase = 3, dpr = 1, mapaCam = { x: 0, y: 0 };
    var teclas = {}, mando = { x: 0, y: 0 }, ruta = [], alLlegar = null, marca = null;
    var sel = 0, cerca = null, abierta = -1, vistaMapa = false, enMarcha = false, ultimo = 0, reloj = 0;
    var devueltas = [], cuerpoPanel, panel, globo, globoTexto, cola = [], dicho = {}, quieto = 0, consejo = 0, frase = null;
    var particulas = [], cw = 0, ch = 0, miniReloj = 0, barrio = null;
    var vistos = {};
    // Las gemas son de cada visita: empiezan en 0 y solo suman al entrar en un edificio
    function gemasGuardadas() { try { return JSON.parse(sessionStorage.getItem('gemas') || '{}') || {}; } catch (e) { return {}; } }
    function guardarGemas() { try { sessionStorage.setItem('gemas', JSON.stringify(vistos)); } catch (e) {} }
    vistos = gemasGuardadas();
    var tactil = window.matchMedia('(pointer: coarse)').matches;
    var movil = false, libreT = 0, rotulos = [], guia = { puntos: [], t: 0, destino: -1 };   // movil: teléfono en horizontal, con HUD mínimo y cámara cerca
    function total() { return PANTALLAS.filter(function (p) { return vistos[p.id]; }).length; }

    function libreCasilla(tx, ty) { return dentro(tx, ty) && !solido[ix(tx, ty)]; }
    function librePx(x, y) { return libreCasilla(Math.floor(x / T), Math.floor(y / T)); }
    function libreEn(x, y) { return librePx(x - 5, y - 4) && librePx(x + 4, y - 4) && librePx(x - 5, y) && librePx(x + 4, y); }

    /* ---------- Rutas (A*) ---------- */
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
                // Mejor por la acera que por el asfalto
                var coste = vecinos[v][2] * (suelo[ix(nx, ny)] === ASFALTO ? 1.25 : 1);
                var ni = ix(nx, ny), ng = g[c] + coste;
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
        camLibre = false;
        arrancar();
    }
    function irA(i, entrar) {
        if (i < 0 || i >= PANTALLAS.length) return;
        sel = i;
        var p = PANTALLAS[i];
        pintarHud();
        irAPunto(p.entrada.x, p.entrada.y, function () { heroe.dir = 'arriba'; if (entrar) abrir(i); });
    }

    /* ---------- aRDi: bocadillos ---------- */
    function decir(t, prioridad) {
        if (prioridad) cola = [];
        cola.push(t);
        if (!globo.classList.contains('visible') || prioridad) siguienteFrase();
    }
    function siguienteFrase() {
        var t = cola.shift();
        if (!t) { frase = null; globo.classList.remove('visible'); juego.classList.remove('hablando'); return; }
        juego.classList.add('hablando');
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
            { es: '¡Hola! Soy aRDi, el dron guía de esta ciudad. Te enseño la carrera de Rodrigo.', en: 'Hi! I\'m aRDi, this city\'s guide drone. Let me show you Rodrigo\'s career.' },
            tactil
                ? { es: 'Muévete con el mando. Arrastra para mirar la ciudad y toca un edificio para ir.', en: 'Move with the pad. Drag to look around and tap a building to go there.' }
                : { es: 'Muévete con WASD o las flechas. Arrastra para mirar la ciudad y haz clic en un edificio para ir.', en: 'Move with WASD or the arrow keys. Drag to look around and click a building to go there.' },
            tactil
                ? { es: 'Junto a una puerta, pulsa A para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press A to go in. There are 15 gems!' }
                : { es: 'Junto a una puerta, pulsa E para entrar. ¡Hay 15 gemas!', en: 'Next to a door, press E to go in. There are 15 gems!' }
        ];
    }
    var CONSEJOS = [
        { es: 'El minimapa de la esquina te lleva a cualquier edificio.', en: 'The minimap in the corner takes you to any building.', escritorio: true },
        { es: 'Pulsa Mapa para ver la ciudad entera y saltar a cualquier edificio.', en: 'Tap Map to see the whole city and jump to any building.' },
        { es: 'Las flechas de abajo te llevan al nivel siguiente.', en: 'The arrows at the bottom take you to the next level.', escritorio: true },
        { es: 'En el núcleo de IA de la plaza puedes preguntarle cosas a Rodrigo.', en: 'At the AI core in the plaza you can ask Rodrigo anything.' },
        { es: 'Pulsa el contador de gemas para ver lo que te falta.', en: 'Tap the gem counter to see what\'s left.' }
    ];

    /* ---------- Construcción ---------- */
    function crear() {
        generarCiudad();
        sueloImg = pintarSuelo();
        NIVELES.forEach(function (n, i) {
            var s = spriteNivel(n, i + 1);
            n.sprite = s;
            objetos.push({ img: s.c, halo: s.halo, x: n.px - n.w / 2, y: n.py - n.h, base: n.py, w: n.w, h: n.h, nivel: n });
            if (n.app) { var im = new Image(); im.src = 'img/apps/' + n.app + '-icono.webp'; iconos[n.app] = im; }
        });
        rellenar();
        ponerFarolas();
        crearTrafico();
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
            '<p class="barrio-cartel" data-j-barrio aria-hidden="true"></p>' +
            '<div class="hud hud-arriba">' +
                '<p class="hud-marca"><span class="marca-sello" aria-hidden="true">RD</span><span>Rodrigo Dávila</span></p>' +
                '<p class="hud-sitio" data-j-sitio aria-live="polite"></p>' +
                '<div class="hud-gemas-caja"><button type="button" class="hud-gemas" data-j-gemas aria-expanded="false"><i class="gema-icono" aria-hidden="true"></i><span class="gemas-cuenta" data-j-cuenta></span><span class="gemas-txt"><span lang="es">gemas</span><span lang="en">gems</span></span></button>' +
                    '<div class="inventario" data-j-inventario hidden><p class="inventario-titulo"><span lang="es">Tus gemas</span><span lang="en">Your gems</span></p><ol>' + inventario + '</ol>' +
                    '<button type="button" class="inventario-reinicio" data-j-reinicio><span lang="es">Empezar de cero</span><span lang="en">Start over</span></button></div></div>' +
                '<div class="hud-botones" data-j-botones>' +
                    '<button type="button" class="hud-boton" data-j-mapa><span lang="es">Mapa</span><span lang="en">Map</span></button>' +
                    '<button type="button" class="hud-boton" data-j-idioma><span lang="es">EN</span><span lang="en">ES</span></button>' +
                    '<button type="button" class="hud-boton hud-clasica" data-j-clasica><span lang="es">Versión clásica</span><span lang="en">Classic version</span></button>' +
                    '<button type="button" class="hud-boton hud-menu" data-j-menu aria-expanded="false" aria-label="Menú"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
                '</div>' +
            '</div>' +
            '<canvas class="minimapa" data-j-mini aria-label="Minimapa"></canvas>' +
            '<div class="hud-niveles">' +
                '<button type="button" class="hud-paso" data-j-paso="-1" aria-label="Anterior">◀</button>' +
                '<button type="button" class="hud-entrar" data-j-entrar><span class="hud-nivel" data-j-num></span><strong data-j-nombre></strong><span class="hud-accion" data-j-accion></span></button>' +
                '<button type="button" class="hud-paso" data-j-paso="1" aria-label="Siguiente">▶</button>' +
            '</div>' +
            '<p class="hud-ayuda"><span lang="es"><kbd>WASD</kbd> moverte · <kbd>E</kbd> entrar · <kbd>M</kbd> mapa · arrastra para mirar</span><span lang="en"><kbd>WASD</kbd> move · <kbd>E</kbd> enter · <kbd>M</kbd> map · drag to look</span></p>' +
            '<div class="mando" data-j-mando aria-hidden="true"><span class="mando-bola"></span></div>' +
            '<button type="button" class="boton-a" data-j-a><span>A</span><small data-j-a-texto></small></button>' +
            '<p class="mapa-aviso">' + (tactil
                ? '<span lang="es">Toca un nombre para ir allí</span><span lang="en">Tap a name to go there</span>'
                : '<span lang="es">Haz clic en un edificio para ir · M o Esc para volver</span><span lang="en">Click a building to go there · M or Esc to go back</span>') + '</p>' +
            '<div class="girar" aria-live="polite">' +
                '<svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true"><rect x="20" y="8" width="24" height="42" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 40c4 6 2 14-6 17M44 57l1-6 5 3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '<p class="girar-titulo"><span lang="es">Gira el móvil para jugar</span><span lang="en">Turn your phone to play</span></p>' +
                '<p class="girar-texto"><span lang="es">La ciudad se juega en horizontal.</span><span lang="en">The city is played in landscape.</span></p>' +
                '<button type="button" class="opcion" data-j-clasica><strong><span lang="es">Ver versión clásica</span><span lang="en">See classic version</span></strong></button>' +
            '</div>' +
            '<div class="juego-titulo" data-j-titulo>' +
                '<div class="titulo-caja">' +
                    '<p class="titulo-pixel"><span lang="es">rodrigodavila.com</span><span lang="en">rodrigodavila.com</span></p>' +
                    '<h2>Rodrigo Dávila</h2>' +
                    '<p class="titulo-lead"><span lang="es">Manager de IA Generativa y creador de apps. ¿Cómo quieres ver la web?</span><span lang="en">Generative AI Manager and app maker. How would you like to see the site?</span></p>' +
                    '<div class="titulo-opciones">' +
                        '<button type="button" class="opcion opcion-juego" data-j-empezar><strong><span lang="es">Modo juego</span><span lang="en">Game mode</span></strong><small><span lang="es">Recorre una ciudad cyberpunk con aRDi</span><span lang="en">Explore a cyberpunk city with aRDi</span></small></button>' +
                        '<button type="button" class="opcion" data-j-clasica><strong><span lang="es">Versión clásica</span><span lang="en">Classic version</span></strong><small><span lang="es">La web de siempre, para leer rápido</span><span lang="en">The regular site, quick to read</span></small></button>' +
                    '</div>' +
                    '<p class="titulo-ayuda"><span lang="es">Enter para jugar</span><span lang="en">Press Enter to play</span></p>' +
                '</div>' +
            '</div>' +
            '<div class="juego-panel" role="dialog" aria-modal="true" aria-labelledby="j-panel-titulo" hidden>' +
                '<div class="panel-caja">' +
                    '<div class="panel-cabeza">' +
                        '<div><p class="panel-num" data-j-panel-num></p><h2 id="j-panel-titulo" tabindex="-1" data-j-panel-titulo></h2></div>' +
                        '<button type="button" class="panel-cerrar" data-j-cerrar><span lang="es">Volver a la ciudad</span><span lang="en">Back to the city</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
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
        heroe.x = n0.entrada.x; heroe.y = n0.entrada.y + 4;
        hada.x = heroe.x + 14; hada.y = heroe.y - 30;
        cam.x = heroe.x; cam.y = heroe.y - 16;

        // Arrastrar mueve la cámara; un toque sobre un edificio lleva hasta él.
        var arrastre = null;
        lienzoEl.addEventListener('pointerdown', function (e) {
            arrastre = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY, movido: false, id: e.pointerId };
            try { lienzoEl.setPointerCapture(e.pointerId); } catch (er) {}
        });
        lienzoEl.addEventListener('pointercancel', function () { arrastre = null; juego.classList.remove('arrastrando'); });
        lienzoEl.addEventListener('pointermove', function (e) {
            if (arrastre && arrastre.id === e.pointerId) {
                if (!arrastre.movido && Math.hypot(e.clientX - arrastre.x, e.clientY - arrastre.y) > 6) { arrastre.movido = true; juego.classList.add('arrastrando'); }
                if (arrastre.movido) {
                    var dx = (e.clientX - arrastre.ux) * dpr / esc, dy = (e.clientY - arrastre.uy) * dpr / esc;
                    if (vistaMapa) { mapaCam.x -= dx; mapaCam.y -= dy; limitarCam(mapaCam); cam.x = mapaCam.x; cam.y = mapaCam.y; }
                    else { camLibre = true; libreT = 0; cam.x -= dx; cam.y -= dy; limitarCam(cam); camObj.x = cam.x; camObj.y = cam.y; }
                    arrastre.ux = e.clientX; arrastre.uy = e.clientY;
                    arrancar();
                }
                return;
            }
            if (tactil) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            lienzoEl.style.cursor = cosaEn(w.x, w.y) ? 'pointer' : 'grab';
        });
        lienzoEl.addEventListener('pointerup', function (e) {
            if (!arrastre) return;
            var movido = arrastre.movido;
            arrastre = null;
            juego.classList.remove('arrastrando');
            if (movido || abierta >= 0) return;
            var r = lienzoEl.getBoundingClientRect();
            var w = aMundo((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            var n = null, qx = (e.clientX - r.left) * dpr, qy = (e.clientY - r.top) * dpr;
            if (vistaMapa) rotulos.some(function (rr) { if (qx > rr.x - 6 * dpr && qx < rr.x + rr.w + 6 * dpr && qy > rr.y - 6 * dpr && qy < rr.y + rr.h + 6 * dpr) { n = rr.n; return true; } return false; });
            if (!n) n = cosaEn(w.x, w.y);
            if (!n) return;
            if (vistaMapa) cerrarMapa();
            irA(pantalla(n.id), true);
        });
        mini.addEventListener('click', function (e) {
            if (abierta >= 0) return;
            var r = mini.getBoundingClientRect();
            var wx = (e.clientX - r.left) / r.width * PW, wy = (e.clientY - r.top) / r.height * PH;
            var mejor = null, md = 70;
            NIVELES.forEach(function (n) { var d = Math.hypot(n.px - wx, n.py - 20 - wy); if (d < md) { md = d; mejor = n; } });
            if (mejor) { irA(pantalla(mejor.id), true); return; }
            camLibre = true; camObj.x = wx; camObj.y = wy; limitarCam(camObj);
            arrancar();
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
        var botones = juego.querySelector('[data-j-botones]'), botonMenu = juego.querySelector('[data-j-menu]');
        botonMenu.addEventListener('click', function () {
            var abierto = botones.classList.toggle('abierto');
            botonMenu.setAttribute('aria-expanded', String(abierto));
            juego.classList.toggle('menu-abierto', abierto);
        });
        var inv = juego.querySelector('[data-j-inventario]'), botonGemas = juego.querySelector('[data-j-gemas]');
        botonGemas.addEventListener('click', function () { inv.hidden = !inv.hidden; botonGemas.setAttribute('aria-expanded', String(!inv.hidden)); });
        inv.addEventListener('click', function (e) {
            if (e.target.closest('[data-j-reinicio]')) {
                vistos = {}; guardarGemas();
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
        // Al girar el móvil, el navegador da medidas intermedias: se vuelve a medir cuando se asientan
        var reMedir = function () { medir(); setTimeout(medir, 250); setTimeout(medir, 700); };
        window.addEventListener('resize', reMedir);
        window.addEventListener('orientationchange', reMedir);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', reMedir);
        new MutationObserver(function () { pintarHud(); }).observe(raiz, { attributes: true, attributeFilter: ['data-lang'] });
        var mb = lienzo(MW * 3, MH * 3);
        mb.x.imageSmoothingEnabled = true;
        mb.x.drawImage(sueloImg, 0, 0, MW * 3, MH * 3);
        objetos.forEach(function (o) {
            if (!o.img) return;
            mb.x.fillStyle = o.nivel ? '#3a3560' : '#24223a';
            mb.x.fillRect(o.x / T * 3, (o.base - Math.min(o.h, 40)) / T * 3, o.w / T * 3, Math.min(o.h, 40) / T * 3);
        });
        miniBase = mb.c;
        medir();
    }

    // Edificios de relleno a lo largo de cada acera, dejando libres avenidas, plaza y niveles
    function rellenar() {
        var filas = [
            { base: AVENIDAS_H[0] * T - T, tramos: [[0, PW]], h: [120, 236] },
            { base: (PLAZA.y0) * T, tramos: [[PLAZA.x0 * T, (PLAZA.x1 + 1) * T]], h: [40, 72] },
            { base: AVENIDAS_H[1] * T - T, tramos: [[0, (AVENIDAS_V[0] - 1) * T], [(AVENIDAS_V[1] + 4) * T, PW]], h: [90, 220] },
            { base: AVENIDAS_H[2] * T - T, tramos: [[0, (AVENIDAS_V[0] - 1) * T], [(AVENIDAS_V[0] + 4) * T, (AVENIDAS_V[1] - 1) * T], [(AVENIDAS_V[1] + 4) * T, PW]], h: [60, 136] }
        ];
        var r = azar(31), semilla = 100;
        filas.forEach(function (f) {
            var ocupados = NIVELES.filter(function (n) { return n.py === f.base; }).map(function (n) { return [n.px - n.w / 2 - 2, n.px + n.w / 2 + 2]; });
            f.tramos.forEach(function (tr) {
                var huecos = [[tr[0], tr[1]]];
                ocupados.forEach(function (o) {
                    var nuevos = [];
                    huecos.forEach(function (h) {
                        if (o[1] <= h[0] || o[0] >= h[1]) { nuevos.push(h); return; }
                        if (o[0] > h[0]) nuevos.push([h[0], o[0]]);
                        if (o[1] < h[1]) nuevos.push([o[1], h[1]]);
                    });
                    huecos = nuevos;
                });
                huecos.forEach(function (h) {
                    var x = h[0];
                    while (h[1] - x >= 24) {
                        var w = Math.min(h[1] - x, 36 + Math.floor(r() * 9) * 4);
                        if (h[1] - x - w < 24) w = h[1] - x;
                        var alto = Math.round(f.h[0] + r() * (f.h[1] - f.h[0]));
                        var s = spriteRelleno(w, alto, semilla++);
                        // El relleno va más apagado: lo que importa son los 15 edificios con nivel
                        var sx2 = s.c.getContext('2d');
                        sx2.globalCompositeOperation = 'source-atop'; sx2.fillStyle = 'rgba(5,4,10,.42)'; sx2.fillRect(0, 0, w, alto);
                        objetos.push({ img: s.c, halo: s.halo, x: x, y: f.base - alto, base: f.base, w: w, h: alto, relleno: true });
                        x += w;
                    }
                });
            });
        });
    }

    function ponerFarolas() {
        var filas = [];
        AVENIDAS_H.forEach(function (r) { filas.push({ y: (r - 1) * T + 4, arriba: true }); if (r !== AVENIDAS_H[2]) filas.push({ y: (r + 3) * T + 13 }); });
        var r2 = azar(5);
        filas.forEach(function (f) {
            for (var x = 2 * T + 8; x < PW - T; x += 6 * T) {
                var tx = Math.floor(x / T);
                if (!libreCasilla(tx, Math.floor(f.y / T))) continue;
                if (NIVELES.some(function (n) { return Math.abs(n.px - x) < 28 && Math.abs(n.entrada.y - f.y) < 20; })) continue;
                if (suelo[ix(tx, Math.floor(f.y / T))] !== ACERA) continue;
                var c = r2() < 0.5 ? C.cian : C.rosa;
                farolas.push({ x: x, y: f.y, color: c });
                objetos.push({ farola: true, x: x - 6, y: f.y - 40, base: f.y, w: 12, h: 40, fx: x, fy: f.y, color: c });
            }
        });
        objetos.push({ proyector: true, x: PROYECTOR.x - 30, y: PROYECTOR.y - 70, base: PROYECTOR.y + 6, w: 60, h: 80 });
    }

    /* ---------- Tráfico, lluvia y peatones ---------- */
    function crearTrafico() {
        var r = azar(77), colores = ['#c9d1dc', '#ff2fb3', '#22e4ff', '#ffd23f', '#9b5cff', '#c9d1dc'];
        AVENIDAS_H.forEach(function (fila) {
            [[fila * T + 14, -1], [fila * T + 36, 1]].forEach(function (c) {
                for (var k = 0; k < 2; k++) coches.push({ eje: 'h', fijo: c[0], dir: c[1], pos: r() * PW, vel: 60 + r() * 50, color: colores[Math.floor(r() * colores.length)], salto: 0, cyber: k === 1 && r() < 0.6, roadster: k === 0, prox: 3 + r() * 10 });
            });
        });
        AVENIDAS_V.forEach(function (col) {
            [[col * T + 14, 1], [col * T + 34, -1]].forEach(function (c) {
                coches.push({ eje: 'v', fijo: c[0], dir: c[1], pos: AVENIDAS_H[0] * T + r() * (AVENIDAS_H[2] - AVENIDAS_H[0]) * T, vel: 50 + r() * 40, color: colores[Math.floor(r() * colores.length)], salto: 0 });
            });
        });
        for (var v = 0; v < 6; v++) voladores.push({ x: r() * PW, y: 30 + r() * (PH * 0.75), vel: (40 + r() * 70) * (r() < 0.5 ? -1 : 1), color: NEONES[Math.floor(r() * 4)] });
        // Peatones con paraguas por las aceras
        var aceras = [];
        AVENIDAS_H.forEach(function (fila) { aceras.push((fila - 1) * T + 9); if (fila !== AVENIDAS_H[2]) aceras.push((fila + 3) * T + 8); });
        for (var p = 0; p < 16; p++) {
            var y = aceras[p % aceras.length], x0 = r() * PW;
            peatones.push({ x: x0, y: y, dir: r() < 0.5 ? -1 : 1, vel: 10 + r() * 14, color: NEONES[Math.floor(r() * NEONES.length)], abrigo: ['#3a3358', '#4a2a3a', '#2a3a4a', '#3a3a2a'][p % 4], fase: r() * 10 });
        }
    }
    // Los coches giran a la derecha en los cruces en vez de atravesar edificios:
    // los que bajan o suben por una avenida vertical entran en la horizontal al llegar
    // al final (y a veces en la del medio), y los de las horizontales a veces se meten
    // por las verticales.
    function cruza(antes, ahora, v) { return (antes - v) * (ahora - v) <= 0 && antes !== ahora; }
    function girar(c, antes) {
        var i, v;
        if (c.eje === 'v') {
            for (i = 0; i < AVENIDAS_H.length; i++) {
                var fila = AVENIDAS_H[i] * T, ultima = c.dir > 0 ? i === AVENIDAS_H.length - 1 : i === 0;
                v = c.dir > 0 ? fila + 14 : fila + 36;
                if (!cruza(antes, c.pos, v)) continue;
                if (ultima || (i === 1 && Math.random() < 0.4)) {
                    var x0 = c.fijo;
                    c.eje = 'h'; c.fijo = v; c.pos = x0; c.dir = -c.dir;
                    // bajando gira al oeste (-1); subiendo, al este (+1)
                }
                return;
            }
        } else if (!c.roadster) {
            var fila2 = c.fijo - (c.dir > 0 ? 36 : 14), idx = AVENIDAS_H.indexOf(fila2 / T);
            if (idx < 0 || (c.dir > 0 && idx === AVENIDAS_H.length - 1) || (c.dir < 0 && idx === 0)) return;
            for (i = 0; i < AVENIDAS_V.length; i++) {
                v = AVENIDAS_V[i] * T + (c.dir > 0 ? 14 : 34);
                if (!cruza(antes, c.pos, v)) continue;
                if (Math.random() < 0.3) { var y0 = c.fijo; c.eje = 'v'; c.fijo = v; c.pos = y0; }
                return;
            }
        }
    }
    function moverTrafico(dt) {
        coches.forEach(function (c) {
            // ¿Está el personaje en su carril, delante?
            var lateral = c.eje === 'h' ? Math.abs(heroe.y - 4 - c.fijo) : Math.abs(heroe.x - c.fijo);
            var delante = ((c.eje === 'h' ? heroe.x : heroe.y) - c.pos) * c.dir;
            var enCarril = lateral < 16 && delante > -8 && delante < 56;
            // Los coches normales frenan; los descapotables saltan con sus propulsores
            c.freno = !c.roadster && enCarril ? Math.max(0, (c.freno || 1) - dt * 4) : Math.min(1, (c.freno === undefined ? 1 : c.freno) + dt * 1.5);
            var antes = c.pos;
            c.pos += c.vel * c.dir * dt * c.freno;
            if (c.eje === 'h') { if (c.pos < -60) c.pos = PW + 60; if (c.pos > PW + 60) c.pos = -60; }
            girar(c, antes);
            if (!c.roadster) return;
            // El descapotable salta por encima del personaje y, de vez en cuando, por gusto
            if (c.salto) {
                c.salto += dt / 0.95;
                if (c.salto < 0.3 || c.salto > 0.85) for (var q = 0; q < 2; q++) vapor.push({
                    x: c.pos - c.dir * (6 + Math.random() * 10), y: c.fijo + 3 - Math.sin(Math.min(1, c.salto) * Math.PI) * 34,
                    vx: -c.dir * (10 + Math.random() * 25), vy: 8 + Math.random() * 14, r: 2 + Math.random() * 2, v: 1
                });
                if (c.salto >= 1) c.salto = 0;
            } else {
                // Saltar por encima del personaje es parte del juego: se hace siempre.
                // Los saltos por gusto se quitan si el sistema pide menos movimiento.
                c.prox -= dt;
                if (enCarril || (!reducido && c.prox <= 0 && c.pos > 0 && c.pos < PW)) {
                    c.salto = 0.001; c.prox = 6 + Math.random() * 9;
                    if (enCarril && !dicho.salto) { dicho.salto = 1; decir({ es: '¡Cuidado! Los descapotables de esta ciudad saltan con propulsores.', en: 'Careful! The roadsters in this city jump on thrusters.' }); }
                }
            }
        });
        voladores.forEach(function (v) { v.x += v.vel * dt; if (v.x < -80) v.x = PW + 80; if (v.x > PW + 80) v.x = -80; });
        peatones.forEach(function (p) {
            var nx = p.x + p.dir * p.vel * dt;
            var cerca = Math.hypot(nx - heroe.x, p.y - heroe.y) < 12;
            if (!libreEn(nx + p.dir * 4, p.y) || nx < 8 || nx > PW - 8 || cerca) p.dir *= -1;
            else p.x = nx;
            p.fase += dt * p.vel * 0.3;
        });
    }
    function dibujaCoche(x, c) {
        var alto = c.salto ? Math.sin(c.salto * Math.PI) * (c.roadster ? 34 : 26) : 0;
        if (c.eje === 'h') {
            var X = Math.round(c.pos), Y = Math.round(c.fijo);
            x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(X - 15, Y + 3, 30, 4);
            x.save(); x.translate(X, Y - Math.round(alto)); if (c.dir < 0) x.scale(-1, 1);
            if (c.roadster) {
                // Descapotable deportivo, rojo, con propulsores de vapor
                if (c.salto && c.salto < 0.55) {
                    x.fillStyle = '#7ff3ff'; x.fillRect(-13, 3, 3, 2 + Math.round(Math.random() * 3)); x.fillRect(8, 3, 3, 2 + Math.round(Math.random() * 3));
                    x.fillStyle = '#ffffff'; x.fillRect(-12, 3, 1, 2); x.fillRect(9, 3, 1, 2);
                }
                x.fillStyle = C.linea;
                x.beginPath(); x.moveTo(-17, 3); x.lineTo(-17, -3); x.lineTo(-10, -5); x.lineTo(-3, -9); x.lineTo(5, -9); x.lineTo(11, -5); x.lineTo(17, -4); x.lineTo(17, 3); x.closePath(); x.fill();
                x.fillStyle = '#e3263b';
                x.beginPath(); x.moveTo(-16, 2); x.lineTo(-16, -2); x.lineTo(-10, -4); x.lineTo(-3, -8); x.lineTo(5, -8); x.lineTo(11, -4); x.lineTo(16, -3); x.lineTo(16, 2); x.closePath(); x.fill();
                x.fillStyle = '#141a2e';
                x.beginPath(); x.moveTo(-6, -4); x.lineTo(-2, -7); x.lineTo(4, -7); x.lineTo(8, -4); x.closePath(); x.fill();
                x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-13, -2, 26, 1);
                x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-16, 0, 32, 2);
            } else if (c.cyber) {
                // Furgoneta de líneas rectas
                x.fillStyle = C.linea;
                x.beginPath(); x.moveTo(-16, 3); x.lineTo(-16, -6); x.lineTo(2, -11); x.lineTo(16, -5); x.lineTo(16, 3); x.closePath(); x.fill();
                x.fillStyle = c.color;
                x.beginPath(); x.moveTo(-15, 2); x.lineTo(-15, -5); x.lineTo(2, -10); x.lineTo(15, -4); x.lineTo(15, 2); x.closePath(); x.fill();
                x.fillStyle = '#1a2440'; x.beginPath(); x.moveTo(-4, -6); x.lineTo(2, -9); x.lineTo(10, -5); x.lineTo(-4, -5); x.fill();
                x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-15, -1, 30, 3);
            } else {
                x.fillStyle = C.linea; x.fillRect(-15, -6, 30, 9); x.fillRect(-8, -11, 15, 6);
                x.fillStyle = c.color; x.fillRect(-14, -5, 28, 7); x.fillRect(-7, -10, 13, 5);
                x.fillStyle = '#1a2440'; x.fillRect(-5, -9, 4, 4); x.fillRect(1, -9, 4, 4);
            }
            x.fillStyle = C.linea; x.fillRect(-11, 1, 6, 4); x.fillRect(5, 1, 6, 4);
            x.fillStyle = '#fff7c2'; x.fillRect(14, -3, 2, 2);
            x.fillStyle = '#ff2f5a'; x.fillRect(-16, -3, 2, 2);
            x.restore();
        } else {
            var X2 = Math.round(c.fijo), Y2 = Math.round(c.pos - alto);
            x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(X2 - 8, Math.round(c.pos) - 8, 16, 22);
            x.fillStyle = C.linea; x.fillRect(X2 - 8, Y2 - 12, 16, 24);
            x.fillStyle = c.color; x.fillRect(X2 - 7, Y2 - 11, 14, 22);
            x.fillStyle = '#1a2440'; x.fillRect(X2 - 5, Y2 + (c.dir > 0 ? 2 : -8), 10, 5);
            x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(X2 - 5, Y2 - 2, 10, 3);
            x.fillStyle = c.dir > 0 ? '#fff7c2' : '#ff2f5a'; x.fillRect(X2 - 6, Y2 + 10, 3, 2); x.fillRect(X2 + 3, Y2 + 10, 3, 2);
            x.fillStyle = c.dir > 0 ? '#ff2f5a' : '#fff7c2'; x.fillRect(X2 - 6, Y2 - 12, 3, 2); x.fillRect(X2 + 3, Y2 - 12, 3, 2);
        }
    }
    function dibujaPeaton(x, p) {
        var X = Math.round(p.x), Y = Math.round(p.y), paso = Math.floor(p.fase) % 2;
        x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(X - 4, Y - 1, 8, 2);
        x.fillStyle = C.linea; x.fillRect(X - 3, Y - 12, 7, 12);
        x.fillStyle = '#1a1a26'; x.fillRect(X - 2, Y - 4, 2, 4 - paso); x.fillRect(X + 1, Y - 4, 2, 3 + paso);
        x.fillStyle = p.abrigo; x.fillRect(X - 2, Y - 11, 5, 7);
        x.fillStyle = '#e0b48f'; x.fillRect(X - 1, Y - 14, 3, 3);
        x.fillStyle = C.linea; x.fillRect(X, Y - 19, 1, 7);
        x.fillStyle = C.linea; x.fillRect(X - 8, Y - 22, 17, 4);
        x.fillStyle = '#1b1a26'; x.fillRect(X - 7, Y - 21, 15, 2);
        x.fillStyle = p.color; x.fillRect(X - 8, Y - 19, 17, 1); x.fillRect(X - 5, Y - 23, 11, 1);
    }

    function tocarLluvia(dt) {
        if (reducido) return;
        var quiero = Math.min(240, Math.floor(cw * ch / (7000 * dpr * dpr)));
        while (lluvia.length < quiero) lluvia.push({ x: Math.random() * cw, y: Math.random() * ch, v: (420 + Math.random() * 260) * dpr, l: (8 + Math.random() * 10) * dpr });
        if (lluvia.length > quiero) lluvia.length = quiero;
        lluvia.forEach(function (g) {
            g.y += g.v * dt; g.x -= g.v * dt * 0.18;
            if (g.y > ch || g.x < 0) {
                if (Math.random() < 0.3) particulas.push({ salpicon: true, sx: g.x, sy: Math.min(g.y, ch), v: 0.3 });
                g.y = -g.l; g.x = Math.random() * (cw + 100);
            }
        });
    }

    function limitarCam(c) {
        var vw = cw / esc, vh = ch / esc, abajo = tactil && !vistaMapa && ch > cw ? 170 * dpr / esc : 0;
        c.x = vw < PW ? Math.max(vw / 2, Math.min(PW - vw / 2, c.x)) : PW / 2;
        c.y = vh < PH + abajo ? Math.max(vh / 2, Math.min(PH + abajo - vh / 2, c.y)) : PH / 2;
    }
    var camObj = { x: 0, y: 0 };

    function medir() {
        // Con el juego oculto (versión clásica) no se toca nada: en el móvil la barra del
        // navegador lanza resize al hacer scroll, y antes esto subía la página arriba.
        if (!juego || juego.hidden) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (tactil && abierta < 0 && window.scrollY) window.scrollTo(0, 0);
        cw = Math.round(lienzoEl.clientWidth * dpr); ch = Math.round(lienzoEl.clientHeight * dpr);
        if (!cw || !ch) return;
        lienzoEl.width = cw; lienzoEl.height = ch;
        var vw = lienzoEl.clientWidth, vh = lienzoEl.clientHeight;
        // Unas 44 casillas de ancho en escritorio y unas 22 en un móvil vertical
        movil = tactil && Math.min(vw, vh) < 560;
        juego.classList.toggle('movil', movil);
        // En el móvil la cámara va mucho más cerca: unas 12 casillas de alto
        var zoom = movil ? Math.max(1.5, vh / (12.5 * T)) : Math.max(1.1, Math.min(vw / (44 * T), vh / (26 * T)));
        escBase = Math.max(1, Math.round(zoom * dpr));
        escObj = escalaActual();
        esc = escObj;
        if (!camLibre && !vistaMapa) { cam.x = heroe.x; cam.y = heroe.y - 16; limitarCam(cam); camObj.x = cam.x; camObj.y = cam.y; }
        var mw = Math.round(mini.clientWidth * dpr), mh = Math.round(mini.clientHeight * dpr);
        if (mw && (mini.width !== mw || mini.height !== mh)) { mini.width = mw; mini.height = mh; }
        arrancar();
    }
    function escalaActual() {
        if (vistaMapa) return ch > cw ? ch / PH * 0.92 : Math.min(cw / PW, ch / PH) * 0.98;
        return escBase;
    }

    function cosaEn(x, y) {
        for (var i = 0; i < NIVELES.length; i++) {
            var n = NIVELES[i];
            if (x > n.px - n.w / 2 - 4 && x < n.px + n.w / 2 + 4 && y > n.py - n.h - 8 && y < n.py + 18) return n;
        }
        return null;
    }
    function vistaRect() {
        var vw = cw / esc, vh = ch / esc;
        var abajo = tactil && !vistaMapa && ch > cw ? 170 * dpr / esc : 0;
        var l = cam.x - vw / 2, t = cam.y - vh / 2;
        if (vw < PW) l = Math.max(0, Math.min(PW - vw, l)); else l = (PW - vw) / 2;
        if (vh < PH + abajo) t = Math.max(0, Math.min(PH + abajo - vh, t)); else t = (PH - vh) / 2;
        return { l: l, t: t, w: vw, h: vh };
    }
    function aMundo(sx, sy) { var v = vistaRect(); return { x: v.l + sx / esc, y: v.t + sy / esc }; }

    function abrirMapa() {
        if (abierta >= 0) return;
        mapaCam.x = ch > cw ? heroe.x : PW / 2; mapaCam.y = PH / 2;
        vistaMapa = true; escObj = escalaActual(); ruta = [];
        juego.classList.add('en-mapa');
        pintarHud();
        arrancar();
    }
    function cerrarMapa() {
        vistaMapa = false; escObj = escalaActual();
        camLibre = false;
        juego.classList.remove('en-mapa');
        pintarHud();
        arrancar();
    }

    /* ---------- HUD ---------- */
    // El siguiente nivel en orden: el primero que aún no tiene gema
    function siguientePendiente() {
        for (var j = 0; j < PANTALLAS.length; j++) if (!vistos[PANTALLAS[j].id]) return j;
        return -1;
    }
    function pintarHud() {
        if (!juego) return;
        var l = idioma();
        var accion = cerca ? (l === 'es' ? 'Entrar' : 'Enter') : (l === 'es' ? 'Ir' : 'Go');
        // En el móvil, el botón A lleva al siguiente edificio que te falta por ver
        // En el móvil siempre; en el PC solo cuando el elegido ya está visto (allí se elige con las flechas)
        if (!cerca && (movil || vistos[PANTALLAS[sel].id])) { var sp = siguientePendiente(); if (sp >= 0) sel = sp; }
        var p = cerca || PANTALLAS[sel];
        juego.querySelector('[data-j-num]').textContent = (l === 'es' ? 'Nivel ' : 'Level ') + (pantalla(p.id) + 1) + ' / ' + PANTALLAS.length;
        juego.querySelector('[data-j-nombre]').textContent = p[l];
        juego.querySelector('[data-j-accion]').textContent = accion;
        juego.querySelector('[data-j-a-texto]').textContent = cerca ? accion : (l === 'es' ? 'Ir al ' : 'Go to ') + (sel + 1);
        juego.querySelector('[data-j-a]').classList.toggle('listo', !!cerca);
        juego.querySelector('[data-j-entrar]').classList.toggle('listo', !!cerca);
        juego.classList.toggle('cerca', !!cerca);
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
        if (barrio) juego.querySelector('[data-j-barrio]').textContent = barrio[l];
        juego.querySelector('[data-j-sitio]').textContent = vistaMapa ? (l === 'es' ? 'Toca un nombre para ir' : 'Tap a name to go') : barrio ? barrio[l] : '';
    }
    function accion() {
        if (vistaMapa) { cerrarMapa(); return; }
        if (cerca) abrir(pantalla(cerca.id));
        else irA(sel, true);
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

    function barrioDe(x, y) {
        var tx = x / T, ty = y / T;
        if (tx >= PLAZA.x0 && tx <= PLAZA.x1 + 1 && ty >= 22 && ty < 38) return BARRIOS[1];
        if (ty < 22) return BARRIOS[0];
        if (ty < 42) return BARRIOS[2];
        return BARRIOS[3];
    }

    function actualizar(dt) {
        var ix2 = 0, iy2 = 0;
        var libre = !vistaMapa && juego.querySelector('[data-j-titulo]').hidden;
        if (libre) {
            if (teclas.a || teclas.arrowleft) ix2 -= 1;
            if (teclas.d || teclas.arrowright) ix2 += 1;
            if (teclas.w || teclas.arrowup) iy2 -= 1;
            if (teclas.s || teclas.arrowdown) iy2 += 1;
            if (mando.x || mando.y) { ix2 = mando.x; iy2 = mando.y; }
        }
        var vel = 96, vx = 0, vy = 0;
        if (ix2 || iy2) {
            ruta = []; alLlegar = null; marca = null;
            var m = Math.hypot(ix2, iy2), k = Math.min(1, m) / m;
            vx = ix2 * k * vel; vy = iy2 * k * vel;
        } else if (ruta.length && libre) {
            var obj = ruta[0], dx = obj.x - heroe.x, dy = obj.y - heroe.y, d = Math.hypot(dx, dy);
            if (d < 3) { ruta.shift(); if (!ruta.length) { marca = null; var f = alLlegar; alLlegar = null; if (f) f(); } }
            else { vx = dx / d * 130; vy = dy / d * 130; }
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
        if (heroe.moviendo) camLibre = false;
        if (vx || vy) heroe.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'izq' : 'der') : (vy < 0 ? 'arriba' : 'abajo');
        heroe.dist += mov;
        if (abierta >= 0) return;
        if (ruta.length && !heroe.moviendo && libre) {
            heroe.atasco = (heroe.atasco || 0) + dt;
            if (heroe.atasco > 0.5) { heroe.atasco = 0; var fin = ruta[ruta.length - 1], luego = alLlegar; irAPunto(fin.x, fin.y, luego); }
        } else heroe.atasco = 0;

        var antes = cerca;
        cerca = null;
        NIVELES.forEach(function (n) { if (Math.hypot(heroe.x - n.entrada.x, heroe.y - n.entrada.y) < (tactil ? 24 : 18)) cerca = n; });
        if (cerca !== antes) { if (cerca) sel = pantalla(cerca.id); pintarHud(); }
        if (cerca && iy2 < -0.5 && Math.abs(ix2) < 0.5 && heroe.y < cerca.entrada.y + 2) {
            heroe.arriba += dt;
            if (heroe.arriba > 0.18) { heroe.arriba = 0; teclas = {}; abrir(pantalla(cerca.id)); return; }
        } else heroe.arriba = 0;

        // Barrios: un cartel al entrar en cada uno y un comentario de aRDi la primera vez
        if (libre) {
            var b = barrioDe(heroe.x, heroe.y);
            if (b !== barrio) {
                barrio = b;
                var cartel = juego.querySelector('[data-j-barrio]');
                cartel.textContent = b[idioma()];
                cartel.classList.remove('visible'); void cartel.offsetWidth; cartel.classList.add('visible');
                pintarHud();
                if (!dicho['barrio-' + b.id]) { dicho['barrio-' + b.id] = 1; decir(b.hada); }
            }
            NIVELES.forEach(function (n) {
                if (dicho[n.id]) return;
                if (Math.hypot(heroe.x - n.entrada.x, heroe.y - n.entrada.y) < 70) { dicho[n.id] = 1; decir(n.hada); }
            });
        }
        quieto = heroe.moviendo ? 0 : quieto + dt;
        if (quieto > 14 && !frase && juego.querySelector('[data-j-titulo]').hidden) { quieto = 0; var lista = movil ? CONSEJOS.filter(function (c) { return !c.escritorio; }) : CONSEJOS; decir(lista[consejo++ % lista.length]); }
        avanzarFrase(dt);

        // aRDi: muelle hacia un punto junto al personaje
        var lado = heroe.dir === 'izq' ? 1 : -1;
        var tx = heroe.x + lado * 16 + Math.sin(reloj * 1.3) * 6, ty = heroe.y - 32 + Math.sin(reloj * 3.1) * 4;
        var ax = (tx - hada.x) * 30 - hada.vx * 7, ay = (ty - hada.y) * 30 - hada.vy * 7;
        hada.vx += ax * dt; hada.vy += ay * dt;
        hada.x += hada.vx * dt; hada.y += hada.vy * dt;
        if (!reducido) {
            hada.estela.push({ x: hada.x + (Math.random() - 0.5) * 3, y: hada.y + 3, v: 1 });
            if (hada.estela.length > 18) hada.estela.shift();
            hada.estela.forEach(function (p) { p.v -= dt * 2; p.y += dt * 8; });
        }
        moverTrafico(dt);
        tocarLluvia(dt);
        particulas.forEach(function (p) { if (p.salpicon) { p.v -= dt; return; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.v -= dt; });
        particulas = particulas.filter(function (p) { return p.v > 0; });
        vapor.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.94; p.r += dt * 9; p.v -= dt * 1.5; });
        vapor = vapor.filter(function (p) { return p.v > 0; });
        if (vapor.length > 160) vapor.splice(0, vapor.length - 160);
        if (marca) marca.t += dt;
        guia.t -= dt;
        if (guia.t <= 0) {
            guia.t = 0.35;
            var dest = cerca || abierta >= 0 || vistaMapa ? null : PANTALLAS[sel];
            var r2 = dest ? buscarRuta(heroe.x, heroe.y, dest.entrada.x, dest.entrada.y) : null;
            guia.puntos = r2 ? [{ x: heroe.x, y: heroe.y }].concat(r2) : [];
        }

        var kz = reducido ? 1 : 1 - Math.exp(-dt * 7);
        esc += (escObj - esc) * kz;
        if (Math.abs(escObj - esc) < 0.002) esc = escObj;
        // En el móvil, la cámara vuelve sola al personaje tras mirar un rato
        if (camLibre && movil && !juego.classList.contains('arrastrando')) { libreT += dt; if (libreT > 3) camLibre = false; }
        var objetivo;
        if (vistaMapa) objetivo = mapaCam;
        else if (camLibre) objetivo = camObj;
        else { objetivo = { x: heroe.x, y: heroe.y - 16 }; if (movil) encuadrar(objetivo); }
        var kc = reducido ? 1 : 1 - Math.exp(-dt * (camLibre ? 14 : 6));
        cam.x += (objetivo.x - cam.x) * kc; cam.y += (objetivo.y - cam.y) * kc;
        if (!camLibre) { camObj.x = cam.x; camObj.y = cam.y; }
        if (movil) { globo.style.transform = ''; globo.classList.remove('arriba'); return; }
        var v = vistaRect();
        var gx = (heroe.x - v.l) * esc / dpr, gy = (heroe.y + 8 - v.t) * esc / dpr, arriba = gy > ch / dpr * 0.62;
        if (arriba) gy = (heroe.y - 34 - v.t) * esc / dpr;
        globo.classList.toggle('arriba', arriba);
        globo.style.transform = 'translate(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px)';
    }

    // En el móvil la cámara va muy cerca: delante de un edificio alto (las torres de
    // empresas) se aleja y sube lo justo para que se vea entero, con el personaje abajo.
    function encuadrar(obj) {
        var hud = 58 * dpr, vwb = cw / escBase, techo = Infinity;
        NIVELES.forEach(function (n) {
            if (heroe.y < n.py - 8 || heroe.y - n.py > 96) return;
            if (n.px + n.w / 2 < heroe.x - vwb / 2 || n.px - n.w / 2 > heroe.x + vwb / 2) return;
            techo = Math.min(techo, n.py - n.h - 8);
        });
        if (techo === Infinity) { escObj = escBase; return; }
        var suelo = heroe.y + 30;
        var e = Math.max(Math.min(2, escBase), Math.min(escBase, Math.floor((ch - hud) / (suelo - techo))));
        escObj = e;
        var alto = ch / e;
        obj.y = Math.max(techo - hud / e + alto / 2, suelo - alto / 2);
        obj.y = Math.min(obj.y, heroe.y - 16);
    }

    function dibujar() {
        var x = ctx, v = vistaRect(), i;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.imageSmoothingEnabled = esc < 1.5;
        x.fillStyle = '#05040a'; x.fillRect(0, 0, cw, ch);
        var ox = Math.round(-v.l * esc), oy = Math.round(-v.t * esc);
        x.setTransform(esc, 0, 0, esc, ox, oy);
        var sl = Math.max(0, Math.floor(v.l)), st = Math.max(0, Math.floor(v.t));
        var sw = Math.min(PW - sl, Math.ceil(v.w) + 2), sh = Math.min(PH - st, Math.ceil(v.h) + 2);
        if (sw > 0 && sh > 0) x.drawImage(sueloImg, sl, st, sw, sh, sl, st, sw, sh);
        // Reflejos del agua
        if (!reducido) for (var ry = (AVENIDAS_H[2] + 4) * T; ry < PH; ry += 5) for (var rx = Math.floor(v.l / 24) * 24; rx < v.l + v.w; rx += 24) {
            var hh = hash(rx, ry + Math.floor(reloj * 3));
            if (hh < 0.35) { x.fillStyle = NEONES[Math.floor(hh * 17) % NEONES.length]; x.globalAlpha = 0.35; x.fillRect(rx + hh * 20, ry, 6 + hh * 10, 1); }
        }
        x.globalAlpha = 1;
        // Charcos de luz bajo las farolas
        x.globalCompositeOperation = 'lighter';
        farolas.forEach(function (f) { if (f.x > v.l - 40 && f.x < v.l + v.w + 40 && f.y > v.t - 40 && f.y < v.t + v.h + 40) brillo(x, f.x, f.y + 2, 26, f.color === C.cian ? 'rgba(34,228,255,.13)' : 'rgba(255,47,179,.13)'); });
        x.globalCompositeOperation = 'source-over';
        // Rastro de luz hasta el siguiente edificio
        if (!vistaMapa && guia.puntos.length > 1) {
            var paso = 10, fase = reducido ? 0 : (reloj * 22) % paso, acum = 0;
            x.fillStyle = C.cian;
            for (var g = 1; g < guia.puntos.length; g++) {
                var a = guia.puntos[g - 1], b2 = guia.puntos[g], seg = Math.hypot(b2.x - a.x, b2.y - a.y);
                for (var dd = (paso - acum + fase) % paso; dd < seg; dd += paso) {
                    var px2 = a.x + (b2.x - a.x) * dd / seg, py2 = a.y + (b2.y - a.y) * dd / seg;
                    if (Math.hypot(px2 - heroe.x, py2 - heroe.y) < 14) continue;
                    x.globalAlpha = 0.75; x.fillRect(Math.round(px2) - 1, Math.round(py2) - 1, 2, 2);
                }
                acum = (acum + seg) % paso;
            }
            x.globalAlpha = 1;
        }
        if (marca && !vistaMapa) {
            var rr = 4 + (marca.t * 10) % 5;
            x.fillStyle = C.cian;
            x.fillRect(marca.x - rr, marca.y, 2, 1); x.fillRect(marca.x + rr - 2, marca.y, 2, 1);
            x.fillRect(marca.x - 1, marca.y - rr / 2, 2, 1); x.fillRect(marca.x - 1, marca.y + rr / 2, 2, 1);
        }
        var lista = [];
        for (i = 0; i < objetos.length; i++) {
            var o = objetos[i];
            if (o.x + o.w < v.l - 40 || o.x > v.l + v.w + 40 || o.y + o.h < v.t - 60 || o.y > v.t + v.h + 60) continue;
            lista.push(o);
        }
        coches.forEach(function (c) {
            var cx = c.eje === 'h' ? c.pos : c.fijo, cy = c.eje === 'h' ? c.fijo : c.pos;
            if (cx > v.l - 40 && cx < v.l + v.w + 40 && cy > v.t - 40 && cy < v.t + v.h + 40) lista.push({ coche: c, base: cy + 6 + (c.salto ? 40 : 0) });
        });
        peatones.forEach(function (p) { if (p.x > v.l - 20 && p.x < v.l + v.w + 20 && p.y > v.t - 30 && p.y < v.t + v.h + 30) lista.push({ peaton: p, base: p.y }); });
        lista.push({ base: heroe.y, heroe: true });
        lista.sort(function (a, b) { return a.base - b.base; });
        lista.forEach(function (o) {
            if (o.heroe) {
                var fr = heroe.moviendo ? [1, 0, 2, 0][Math.floor(heroe.dist / 7) % 4] : 0;
                // Aro de neón a los pies: el personaje siempre se encuentra a simple vista
                var pulso = reducido ? 0 : Math.sin(reloj * 4);
                x.save();
                x.globalAlpha = 0.5 + pulso * 0.2;
                x.strokeStyle = cerca ? '#ff2fb3' : '#22e4ff'; x.lineWidth = 1.5;
                x.beginPath(); x.ellipse(Math.round(heroe.x), Math.round(heroe.y) + 1, 10 + pulso, 4.5 + pulso * 0.4, 0, 0, Math.PI * 2); x.stroke();
                x.restore();
                dibujaHeroe(x, Math.round(heroe.x), Math.round(heroe.y), heroe.dir, fr);
                return;
            }
            if (o.coche) { dibujaCoche(x, o.coche); return; }
            if (o.peaton) { dibujaPeaton(x, o.peaton); return; }
            if (o.farola) { farola(x, o); return; }
            if (o.proyector) { proyector(x); return; }
            x.drawImage(o.img, Math.round(o.x), Math.round(o.y));
            if (o.nivel) extras(x, o.nivel);
        });
        // Vapor de los propulsores
        vapor.forEach(function (p) {
            x.globalAlpha = Math.max(0, p.v) * 0.45; x.fillStyle = '#dfe8ff';
            x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
        });
        x.globalAlpha = 1;
        // Halos de neón, faros y luces
        x.globalCompositeOperation = 'lighter';
        lista.forEach(function (o) {
            if (o.halo) { x.globalAlpha = (o.relleno ? 0.4 : 0.9) + (reducido ? 0 : Math.sin(reloj * 2 + o.x) * 0.1); x.drawImage(o.halo, Math.round(o.x) - HALO, Math.round(o.y) - HALO); }
            else if (o.farola) { x.globalAlpha = 1; brillo(x, o.fx, o.fy - 36, 16, o.color === C.cian ? 'rgba(34,228,255,.5)' : 'rgba(255,47,179,.5)'); }
            else if (o.coche) {
                var c = o.coche; x.globalAlpha = 1;
                if (c.eje === 'h') {
                    var fx = c.pos + c.dir * 18, fy = c.fijo - 2 - (c.salto ? Math.sin(c.salto * Math.PI) * (c.roadster ? 34 : 26) : 0);
                    x.fillStyle = 'rgba(255,240,180,.16)';
                    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + c.dir * 46, fy - 9); x.lineTo(fx + c.dir * 46, fy + 9); x.fill();
                    brillo(x, c.pos - c.dir * 17, fy, 8, 'rgba(255,47,90,.45)');
                } else brillo(x, c.fijo, c.pos + c.dir * 14, 14, 'rgba(255,240,180,.25)');
            } else if (o.nivel) halosNivel(x, o.nivel);
        });
        x.globalAlpha = 1;
        x.globalCompositeOperation = 'source-over';
        particulas.forEach(function (p) { if (p.salpicon) return; x.globalAlpha = Math.max(0, p.v); x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
        x.globalAlpha = 1;
        // Coches voladores por encima de todo
        voladores.forEach(function (fv) {
            if (fv.x < v.l - 60 || fv.x > v.l + v.w + 60 || fv.y < v.t - 20 || fv.y > v.t + v.h + 20) return;
            var X = Math.round(fv.x), Y = Math.round(fv.y + Math.sin(reloj * 2 + fv.x * 0.01) * 3), d = fv.vel > 0 ? 1 : -1;
            x.globalCompositeOperation = 'lighter';
            for (var s = 0; s < 6; s++) { x.fillStyle = fv.color; x.globalAlpha = 0.28 - s * 0.04; x.fillRect(X - d * (12 + s * 7), Y + 1, 7, 2); }
            x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
            x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X - 9, Y + 22, 18, 3);
            x.fillStyle = C.linea; x.fillRect(X - 11, Y - 4, 22, 8);
            x.fillStyle = '#2a2840'; x.fillRect(X - 10, Y - 3, 20, 6);
            x.fillStyle = '#7fe8ff'; x.fillRect(X + d * 2 - 3, Y - 3, 6, 2);
            x.fillStyle = fv.color; x.fillRect(X - 10, Y + 2, 20, 1);
            x.fillStyle = '#fff7c2'; x.fillRect(X + d * 10 - (d > 0 ? 1 : 0), Y - 1, 1, 2);
        });
        // aRDi, el dron
        x.globalCompositeOperation = 'lighter';
        brillo(x, hada.x, hada.y, 26, 'rgba(34,228,255,.35)');
        hada.estela.forEach(function (p) { if (p.v > 0) { x.globalAlpha = p.v * 0.6; x.fillStyle = C.cian; x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } });
        x.globalAlpha = 1;
        x.globalCompositeOperation = 'source-over';
        var hx = Math.round(hada.x), hy = Math.round(hada.y), helice = Math.floor(reloj * 20) % 2;
        x.fillStyle = C.linea; x.fillRect(hx - 5, hy - 3, 10, 7);
        x.fillStyle = '#d9e2f2'; x.fillRect(hx - 4, hy - 2, 8, 5);
        x.fillStyle = C.cian; x.fillRect(hx - 2 + (heroe.dir === 'izq' ? -1 : heroe.dir === 'der' ? 1 : 0), hy - 1, 4, 2);
        x.fillStyle = C.linea; x.fillRect(hx - 1, hy - 5, 2, 2);
        x.fillStyle = '#ffffffaa'; x.fillRect(hx - (helice ? 7 : 4), hy - 6, helice ? 14 : 8, 1);
        x.setTransform(1, 0, 0, 1, 0, 0);
        // Lluvia y salpicones en pantalla
        if (!reducido) {
            x.strokeStyle = 'rgba(170,200,255,.26)'; x.lineWidth = dpr;
            x.beginPath();
            lluvia.forEach(function (g) { x.moveTo(g.x, g.y); x.lineTo(g.x + g.l * 0.18, g.y - g.l); });
            x.stroke();
            x.fillStyle = 'rgba(170,200,255,.35)';
            particulas.forEach(function (p) { if (p.salpicon) { var r3 = (0.3 - p.v) * 20 * dpr; x.fillRect(p.sx - r3, p.sy, r3 * 2, dpr); } });
        }
        // Viñeta
        var g = x.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
        g.addColorStop(0, 'rgba(5,4,10,0)'); g.addColorStop(1, 'rgba(5,4,10,.55)');
        x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        etiquetas(x, v);
    }

    function farola(x, o) {
        var X = o.fx, Y = o.fy;
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X - 3, Y - 1, 7, 3);
        x.fillStyle = C.linea; x.fillRect(X - 1, Y - 36, 3, 36); x.fillRect(X - 3, Y - 3, 7, 3);
        x.fillStyle = '#3a3650'; x.fillRect(X, Y - 35, 1, 33);
        x.fillStyle = C.linea; x.fillRect(X - 6, Y - 39, 13, 4);
        x.fillStyle = o.color; x.fillRect(X - 5, Y - 37, 11, 1);
    }
    function proyector(x) {
        var X = Math.round(PROYECTOR.x), Y = Math.round(PROYECTOR.y);
        x.fillStyle = C.linea; x.fillRect(X - 22, Y - 10, 44, 16);
        x.fillStyle = '#26243a'; x.fillRect(X - 21, Y - 9, 42, 14);
        x.fillStyle = '#1b1a2a'; x.fillRect(X - 16, Y - 7, 32, 8);
        x.fillStyle = C.cian; x.fillRect(X - 14, Y - 5, 28, 2);
        // Holograma: un rombo que gira con las iniciales
        var t = reducido ? 0 : reloj, w = Math.max(2, Math.round(Math.abs(Math.cos(t * 1.4)) * 18)), cy = Y - 40 + Math.round(Math.sin(t * 2) * 2);
        x.globalCompositeOperation = 'lighter';
        x.fillStyle = 'rgba(34,228,255,.10)';
        x.beginPath(); x.moveTo(X - 14, Y - 6); x.lineTo(X + 14, Y - 6); x.lineTo(X + w, cy); x.lineTo(X - w, cy); x.fill();
        x.fillStyle = 'rgba(34,228,255,.35)';
        x.beginPath(); x.moveTo(X, cy - 22); x.lineTo(X + w, cy); x.lineTo(X, cy + 22); x.lineTo(X - w, cy); x.fill();
        x.fillStyle = 'rgba(255,47,179,.35)';
        x.beginPath(); x.moveTo(X, cy - 16); x.lineTo(X + w * 0.6, cy); x.lineTo(X, cy + 16); x.lineTo(X - w * 0.6, cy); x.fill();
        for (var k = 0; k < 4; k++) { x.fillStyle = 'rgba(34,228,255,.25)'; x.fillRect(X - 20, cy - 20 + ((t * 30 + k * 11) % 44), 40, 1); }
        x.globalCompositeOperation = 'source-over';
    }

    function brillo(x, cx, cy, r, color) {
        var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    function icono(x, id, X, Y, s) {
        var im = iconos[id];
        x.fillStyle = C.linea; redondo(x, X - 1, Y - 1, s + 2, s + 2, 4); x.fill();
        if (im && im.complete && im.naturalWidth) {
            x.save(); redondo(x, X, Y, s, s, 3); x.clip();
            x.imageSmoothingEnabled = true;
            x.drawImage(im, X, Y, s, s);
            x.restore();
            x.imageSmoothingEnabled = esc < 1.5;
        }
    }
    function redondo(x, X, Y, w, h, r) {
        x.beginPath();
        x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
        x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
    }
    function disco(x, cx, cy, r, color) {
        x.fillStyle = color;
        for (var dy = -r; dy <= r; dy++) { var w = Math.round(Math.sqrt(r * r - dy * dy)); x.fillRect(cx - w, cy + dy, w * 2, 1); }
    }

    // Animaciones de cada edificio, encima de su sprite
    function extras(x, n) {
        var t = reducido ? 0 : reloj, L = n.px - n.w / 2, top = n.py - n.h, i = n.x;
        if (n.tipo === 'oficina') {
            x.fillStyle = Math.floor(t * 1.5 + i) % 2 ? '#ff3b4a' : '#5a1a20';
            x.fillRect(L + n.w - 18, top, 2, 2);
        } else if (n.tipo === 'torre') {
            x.fillStyle = Math.floor(t * 2) % 2 ? '#ff3b4a' : '#5a1a20'; x.fillRect(n.px - 1, top, 2, 2);
            var cx = n.px, cy = top - 18, pts = [];
            for (var k = 0; k < 6; k++) {
                var a = t * 0.9 + k * Math.PI / 3;
                pts.push({ x: cx + Math.cos(a) * 30, y: cy + Math.sin(a) * 10, z: Math.sin(a) });
            }
            x.fillStyle = '#86a6ff88';
            pts.forEach(function (p) { linea(x, cx, cy, p.x, p.y); });
            pts.filter(function (p) { return p.z < 0; }).forEach(function (p, k2) { agente(x, p, k2, t); });
            x.fillStyle = C.linea; x.fillRect(cx - 4, cy - 4, 8, 8);
            x.fillStyle = C.cian; x.fillRect(cx - 3, cy - 3, 6, 6);
            pts.filter(function (p) { return p.z >= 0; }).forEach(function (p, k2) { agente(x, p, k2 + 3, t); });
        } else if (n.tipo === 'lab') {
            for (var r = 0; r < 3; r++) for (var j = 0; j < 6; j++) for (var l = 0; l < 4; l++) {
                var on = hash(r * 31 + j * 7 + l, Math.floor(t * 4 + l + j)) > 0.5;
                x.fillStyle = on ? (l % 2 ? C.verde : C.cian) : '#14304a';
                x.fillRect(L + 12 + r * 32 + l * 5, top + 50 + j * 6, 2, 2);
            }
            var cy2 = top + 6 + Math.round(Math.sin(t * 2.4) * 2), w = Math.max(1, Math.round(Math.abs(Math.cos(t * 1.6)) * 7));
            x.fillStyle = C.linea;
            x.beginPath(); x.moveTo(n.px, cy2 - 11); x.lineTo(n.px + w + 2, cy2); x.lineTo(n.px, cy2 + 11); x.lineTo(n.px - w - 2, cy2); x.fill();
            x.fillStyle = '#7fe0ff';
            x.beginPath(); x.moveTo(n.px, cy2 - 9); x.lineTo(n.px + w, cy2); x.lineTo(n.px, cy2 + 9); x.lineTo(n.px - w, cy2); x.fill();
        } else if (n.tipo === 'nucleo') {
            var by = top - 14 + Math.round(Math.sin(t * 2) * 2);
            x.globalCompositeOperation = 'lighter';
            x.fillStyle = 'rgba(34,228,255,.35)'; x.fillRect(n.px - 16, by - 10, 32, 18); x.fillRect(n.px - 10, by + 8, 5, 4);
            x.globalCompositeOperation = 'source-over';
            for (var pd = 0; pd < 3; pd++) { x.fillStyle = Math.floor(t * 3) % 3 === pd ? '#ffffff' : '#7fe8ff'; x.fillRect(n.px - 9 + pd * 7, by - 2, 4, 4); }
        } else if (n.tipo === 'pantallas') {
            var im = websImgs[Math.floor(t / 3) % websImgs.length];
            var sx = L + 12, sy = top + 26, sw = n.w - 24, sh = 68;
            if (im && im.complete && im.naturalWidth) {
                x.save(); x.beginPath(); x.rect(sx, sy, sw, sh); x.clip();
                x.imageSmoothingEnabled = true;
                var s = sw / im.naturalWidth, desp = ((t * 8) % Math.max(1, im.naturalHeight * s - sh));
                x.drawImage(im, sx, sy - desp, sw, im.naturalHeight * s);
                x.restore();
                x.imageSmoothingEnabled = esc < 1.5;
            }
            x.fillStyle = 'rgba(0,0,0,.18)'; for (var sl = 0; sl < sh; sl += 3) x.fillRect(sx, sy + sl, sw, 1);
            [L + 12, L + n.w - 54].forEach(function (bx, q) {
                for (var bb = 0; bb < 6; bb++) {
                    var hgt = Math.round(4 + Math.abs(Math.sin(t * 3 + bb + q * 2)) * 20);
                    x.fillStyle = q ? C.rosa : C.cian; x.fillRect(bx + 2 + bb * 7, top + 134 - hgt, 5, hgt);
                }
            });
        } else if (n.tipo === 'taller') {
            var gx = L + n.w - 14, gy = top + 12;
            x.save(); x.translate(gx, gy); x.rotate(t * 1.2);
            x.fillStyle = C.linea;
            for (var dd = 0; dd < 8; dd++) { x.rotate(Math.PI / 4); x.fillRect(-3, -11, 6, 5); }
            disco(x, 0, 0, 8, C.linea); disco(x, 0, 0, 7, '#c9ced8'); disco(x, 0, 0, 3, '#5d6b7a');
            x.restore();
            if (!reducido && Math.floor(t * 6) % 3 === 0) for (var sp = 0; sp < 5; sp++) { x.fillStyle = sp % 2 ? '#ffd36b' : '#ffffff'; x.fillRect(n.px - 8 + hash(sp, Math.floor(t * 6)) * 10, n.py - 18 - hash(Math.floor(t * 6), sp) * 8, 1, 1); }
        } else if (n.tipo === 'cabina') {
            var on2 = Math.floor(t * 2) % 2;
            x.fillStyle = on2 ? C.amarillo : '#7a6a2a';
            x.fillRect(n.px - 6, top + 3, 12, 8);
            x.fillStyle = C.linea; x.beginPath(); x.moveTo(n.px - 6, top + 3); x.lineTo(n.px, top + 8); x.lineTo(n.px + 6, top + 3); x.lineTo(n.px + 6, top + 4); x.lineTo(n.px, top + 9); x.lineTo(n.px - 6, top + 4); x.fill();
        } else if (n.tipo === 'club') {
            icono(x, n.app, L + n.w - 27, top + 2, 18);
            var bt = (t * 1.3) % 2, bx2 = L + 14 + (bt < 1 ? bt : 2 - bt) * (n.w - 28), by2 = top + 60 - Math.abs(Math.sin(t * 5)) * 16;
            x.fillStyle = '#e8ff5a'; x.fillRect(Math.round(bx2), Math.round(by2), 3, 3);
        } else if (n.tipo === 'casita') {
            icono(x, n.app, L + 6, top + 4, 18);
            var lu = 0.6 + Math.sin(t * 1.5) * 0.4;
            x.globalAlpha = lu; disco(x, L + n.w - 14, top + 8, 6, C.amarillo); x.globalAlpha = 1;
            disco(x, L + n.w - 11, top + 6, 5, '#05040a');
        } else if (n.tipo === 'bar') {
            icono(x, n.app, n.px - 11, top + 6, 22);
            if (!reducido) for (var st2 = 0; st2 < 3; st2++) { var ph = (t * 0.6 + st2 / 3) % 1; x.fillStyle = 'rgba(220,220,240,' + (0.35 * (1 - ph)) + ')'; x.fillRect(L + n.w - 10 + Math.sin(ph * 6) * 2, top + 20 - ph * 18, 3, 3); }
        } else if (n.tipo === 'hangar') {
            icono(x, n.app, L + 7, top + 3, 18);
            for (var rl = 0; rl < 6; rl++) { x.fillStyle = Math.floor(t * 6) % 6 === rl ? '#ffffff' : '#3a5a8a'; x.fillRect(L + 18 + rl * 12, n.py - 2, 3, 2); }
        } else if (n.tipo === 'cine') {
            icono(x, n.app, n.px - 12, top + 31, 24);
            for (var bu = 0; bu < Math.floor((n.w - 16) / 6); bu++) {
                var onb = (bu + Math.floor(t * 6)) % 3 === 0;
                x.fillStyle = onb ? '#fff3c4' : '#7a5a2a';
                x.fillRect(L + 9 + bu * 6, n.py - 56, 2, 2); x.fillRect(L + 9 + bu * 6, n.py - 41, 2, 2);
            }
        }
    }
    function halosNivel(x, n) {
        var t = reducido ? 0 : reloj, top = n.py - n.h;
        if (n.tipo === 'torre') brillo(x, n.px, top - 18, 34, 'rgba(34,228,255,.22)');
        else if (n.tipo === 'lab') brillo(x, n.px, top + 6, 22, 'rgba(127,224,255,.4)');
        else if (n.tipo === 'nucleo') brillo(x, n.px, top - 12, 30, 'rgba(34,228,255,.3)');
        else if (n.tipo === 'pantallas') { x.globalAlpha = 0.25; brillo(x, n.px, top + 60, 80, 'rgba(255,255,255,.3)'); x.globalAlpha = 1; }
        else if (n.tipo === 'cabina') brillo(x, n.px, top + 7, 16, 'rgba(255,210,63,' + (Math.floor(t * 2) % 2 ? 0.5 : 0.15) + ')');
        else if (n.tipo === 'casita') brillo(x, n.px + n.w / 2 - 14, top + 8, 16, 'rgba(255,210,63,.35)');
        else if (n.tipo === 'cine') brillo(x, n.px, n.py - 48, 40, 'rgba(255,210,63,.18)');
        // Luz de la puerta en la acera
        brillo(x, n.px, n.py + 4, 20, 'rgba(255,230,180,.12)');
    }
    function agente(x, p, k, t) {
        var on = Math.floor(t * 2 + k) % 3 === 0;
        x.fillStyle = C.linea; x.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
        x.fillStyle = on ? C.amarillo : '#86a6ff'; x.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
    }
    function linea(x, ax, ay, bx, by) {
        var n = Math.ceil(Math.hypot(bx - ax, by - ay) / 2);
        for (var i = 0; i <= n; i += 2) x.fillRect(Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n), 1, 1);
    }

    // Rótulos sobre las puertas, en pantalla, con la gema si falta por ver
    function etiquetas(x, v) {
        var l = idioma(), fs = Math.round((movil && vistaMapa ? 9 : 12) * dpr), puestos = [];
        x.font = fs + 'px Silkscreen, Geist, sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        rotulos = puestos;
        // Primero los barrios, para que los rótulos de los edificios queden encima
        if (vistaMapa) {
            x.font = Math.round((movil ? 10 : 13) * dpr) + 'px Silkscreen, Geist, sans-serif';
            [[BARRIOS[0], PW / 2, 4 * T], [BARRIOS[2], 14 * T, 23 * T], [BARRIOS[3], PW / 2, 45 * T]].forEach(function (b) {
                var sx = (b[1] - v.l) * esc, sy = (b[2] - v.t) * esc;
                x.fillStyle = 'rgba(5,4,10,.7)'; var w = x.measureText(b[0][l]).width + 24 * dpr; x.fillRect(sx - w / 2, sy - 13 * dpr, w, 26 * dpr);
                x.fillStyle = C.rosa; x.fillText(b[0][l].toUpperCase(), sx, sy + dpr);
            });
        }
        // En el mapa, un marcador grande con "Tú" donde está el personaje
        if (vistaMapa) {
            var hx = (heroe.x - v.l) * esc, hy = (heroe.y - v.t) * esc, pr = (reducido ? 0 : (reloj * 1.4) % 1);
            x.strokeStyle = C.rosa; x.lineWidth = 2 * dpr;
            x.globalAlpha = 1 - pr; x.beginPath(); x.arc(hx, hy, (6 + pr * 16) * dpr, 0, Math.PI * 2); x.stroke();
            x.globalAlpha = 1; x.fillStyle = C.rosa; x.beginPath(); x.arc(hx, hy, 4 * dpr, 0, Math.PI * 2); x.fill();
            x.font = Math.round(10 * dpr) + 'px Silkscreen, Geist, sans-serif';
            var tu = idioma() === 'es' ? 'TÚ' : 'YOU', tw = x.measureText(tu).width + 10 * dpr;
            x.fillStyle = C.rosa; x.fillRect(hx - tw / 2, hy - 26 * dpr, tw, 15 * dpr);
            x.fillStyle = '#fff'; x.fillText(tu, hx, hy - 18 * dpr);
        }
        x.font = fs + 'px Silkscreen, Geist, sans-serif';
        NIVELES.forEach(function (n) {
            // Encima del edificio; si el tejado queda fuera de pantalla, lo más arriba posible sin tapar la puerta
            var sx = (n.px - v.l) * esc, sy = Math.min((n.py - 30 - v.t) * esc - 16 * dpr, Math.max((n.py - n.h - v.t) * esc - 18 * dpr, (movil ? 84 : 150) * dpr));
            if (vistaMapa) sy = (n.py - v.t) * esc + 14 * dpr;
            // En el móvil, si el edificio queda por encima de la pantalla, su nombre se queda arriba con una flecha
            var fuera = false;
            if (movil && !vistaMapa && sy < 84 * dpr) {
                if ((n.py - v.t) * esc < -320 * dpr) return;
                sy = 84 * dpr; fuera = true;
            }
            if (sx < -200 || sx > cw + 200 || sy < -60 || sy > ch + 60) return;
            var activo = n === cerca || (!cerca && PANTALLAS[sel] === n);
            if (!vistaMapa && !activo && !movil && Math.hypot(n.px - heroe.x, n.py - heroe.y) > 190 && !camLibre) return;
            var hecho = vistos[n.id];
            var txt = (vistaMapa ? (pantalla(n.id) + 1) + ' ' : '') + n[l];
            var w = x.measureText(txt).width + 20 * dpr + (hecho ? 12 * dpr : 0), h = fs + 12 * dpr;
            var X = Math.round(sx - w / 2), Y = Math.round(sy - h / 2);
            // En el mapa, si choca con el rótulo de al lado, baja un renglón
            if (vistaMapa) {
                var choca = function (yy) { return yy < 4 * dpr || yy + h > ch - 4 * dpr || puestos.some(function (r) { return X < r.x + r.w + 4 * dpr && X + w + 4 * dpr > r.x && yy < r.y + r.h + 2 * dpr && yy + h + 2 * dpr > r.y; }); };
                var salto = h + 6 * dpr, y0 = Y;
                [0, -1, 1, -2, 2].some(function (k) { if (!choca(y0 + k * salto)) { Y = y0 + k * salto; return true; } return false; });
                sy += Y - y0;
                puestos.push({ x: X, y: Y, w: w, h: h, n: n });
            }
            x.fillStyle = '#05040a'; x.fillRect(X - 2 * dpr, Y - 2 * dpr, w + 4 * dpr, h + 4 * dpr);
            x.fillStyle = activo ? C.cian : '#3a3560'; x.fillRect(X - dpr, Y - dpr, w + 2 * dpr, h + 2 * dpr);
            x.fillStyle = activo ? '#062a33' : '#120f1e'; x.fillRect(X + dpr, Y + dpr, w - 2 * dpr, h - 2 * dpr);
            x.fillStyle = activo ? '#d9fbff' : '#ffffff';
            x.fillText(txt, sx + (hecho ? 6 * dpr : 0), sy + dpr);
            if (hecho) gemaEtiqueta(x, X + 10 * dpr, sy, 4 * dpr);
            else if (!vistaMapa && !fuera) {
                var gy = Y - 12 * dpr + (reducido ? 0 : Math.sin(reloj * 3 + n.x) * 2 * dpr), gw = (reducido ? 1 : Math.abs(Math.cos(reloj * 2.2 + n.x))) * 5 * dpr + dpr;
                x.fillStyle = '#05040a'; x.beginPath(); x.moveTo(sx, gy - 8 * dpr); x.lineTo(sx + gw + 2 * dpr, gy); x.lineTo(sx, gy + 8 * dpr); x.lineTo(sx - gw - 2 * dpr, gy); x.fill();
                x.fillStyle = C.gema; x.beginPath(); x.moveTo(sx, gy - 6 * dpr); x.lineTo(sx + gw, gy); x.lineTo(sx, gy + 6 * dpr); x.lineTo(sx - gw, gy); x.fill();
            }
            if (fuera) {
                x.fillStyle = activo ? C.cian : '#ffffff';
                x.beginPath(); x.moveTo(X - 12 * dpr, sy - 5 * dpr); x.lineTo(X - 6 * dpr, sy - 5 * dpr); x.lineTo(X - 9 * dpr, sy - 10 * dpr); x.fill();
            }
            if (activo && !vistaMapa) {
                var ay = Y + h + 6 * dpr + (reducido ? 0 : Math.sin(reloj * 5) * 2 * dpr);
                x.fillStyle = C.cian; x.beginPath(); x.moveTo(sx - 5 * dpr, ay); x.lineTo(sx + 5 * dpr, ay); x.lineTo(sx, ay + 6 * dpr); x.fill();
            }
        });
    }
    function gemaEtiqueta(x, cx, cy, r) {
        x.fillStyle = '#05040a';
        x.beginPath(); x.moveTo(cx, cy - r - 1); x.lineTo(cx + r * 0.75 + 1, cy); x.lineTo(cx, cy + r + 1); x.lineTo(cx - r * 0.75 - 1, cy); x.fill();
        x.fillStyle = C.gema;
        x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.75, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.75, cy); x.fill();
    }

    function dibujarMini() {
        if (!mini.width || vistaMapa) return;
        var x = miniCtx, W = mini.width, H = mini.height, sx = W / PW, sy = H / PH;
        x.imageSmoothingEnabled = true;
        x.drawImage(miniBase, 0, 0, W, H);
        var r = Math.max(2, Math.round(2.5 * dpr));
        NIVELES.forEach(function (n) {
            x.fillStyle = C.linea; x.fillRect(n.px * sx - r - 1, (n.py - 8) * sy - r - 1, r * 2 + 2, r * 2 + 2);
            x.fillStyle = vistos[n.id] ? C.gema : n === PANTALLAS[sel] ? C.cian : '#ffffff';
            x.fillRect(n.px * sx - r, (n.py - 8) * sy - r, r * 2, r * 2);
        });
        var v = vistaRect();
        x.strokeStyle = C.rosa; x.lineWidth = dpr;
        x.strokeRect(v.l * sx, v.t * sy, v.w * sx, Math.min(v.h, PH - v.t) * sy);
        if (Math.floor(reloj * 3) % 2 === 0 || reducido) {
            x.fillStyle = '#ffffff'; x.fillRect(heroe.x * sx - r - 1, heroe.y * sy - r - 1, r * 2 + 2, r * 2 + 2);
            x.fillStyle = C.cian; x.fillRect(heroe.x * sx - r, heroe.y * sy - r, r * 2, r * 2);
        }
    }

    /* ---------- Panel ---------- */
    function sub(n) { return typeof n.sub === 'string' ? { es: n.sub, en: n.sub } : n.sub; }
    // porSalto: se llega con Anterior/Siguiente desde otro panel; eso no da gema
    function abrir(i, porSalto) {
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
            ? '<span lang="es">Volver a la ciudad</span><span lang="en">Back to the city</span>'
            : '<span lang="es">Siguiente<span class="sig-nombre">: ' + PANTALLAS[i + 1].es + '</span></span><span lang="en">Next<span class="sig-nombre">: ' + PANTALLAS[i + 1].en + '</span></span><span aria-hidden="true"> ▶</span>';
        panel.hidden = false;
        juego.querySelector('.panel-caja').scrollTop = 0; cuerpoPanel.scrollTop = 0;
        requestAnimationFrame(function () { panel.classList.add('abierto'); });
        juego.querySelector('[data-j-panel-titulo]').focus({ preventScroll: true });
        cuerpoPanel.querySelectorAll('video').forEach(function (v) { v.preload = 'auto'; if (!reducido) v.play().catch(function () {}); });
        if (!porSalto && !vistos[n.id]) { vistos[n.id] = 1; guardarGemas(); n.nueva = true; }
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
        heroe.x = p.entrada.x; heroe.y = p.entrada.y + 4;
        cam.x = heroe.x; cam.y = heroe.y - 16; camLibre = false;
        hada.x = heroe.x + 14; hada.y = heroe.y - 30;
        recompensas();
        abrir(i, true);
    }
    function recompensas() {
        PANTALLAS.forEach(function (p) {
            if (!p.nueva) return;
            p.nueva = false;
            var n = total();
            if (n === PANTALLAS.length) decir({ es: '¡Las 15 gemas! Ya conoces a Rodrigo. ¿Le escribes? La cabina está en la zona creativa.', en: 'All 15 gems! Now you know Rodrigo. Want to write to him? The booth is in the creative quarter.' }, true);
            else decir({ es: '¡Gema conseguida! Llevas ' + n + ' de 15.', en: 'Gem found! That\'s ' + n + ' of 15.' }, true);
            for (var k = 0; k < 26; k++) particulas.push({ x: heroe.x, y: heroe.y - 20, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 70, v: 1 + Math.random() * 0.6, c: [C.gema, C.cian, C.rosa, '#ffffff'][k % 4] });
        });
    }
    function cerrar() {
        if (abierta < 0) return;
        var p = PANTALLAS[abierta];
        vaciarPanel();
        panel.classList.remove('abierto');
        panel.hidden = true;
        abierta = -1;
        heroe.x = p.entrada.x; heroe.y = p.entrada.y + 4;
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
            if (k === 'enter' && !e.target.closest('button')) { e.preventDefault(); empezar(); }
            return;
        }
        if (abierta >= 0) { if (k === 'escape') cerrar(); return; }
        var inv = juego.querySelector('[data-j-inventario]');
        if (k === 'escape' && !inv.hidden) { inv.hidden = true; return; }
        if (vistaMapa && (k === 'escape' || k === 'm')) { e.preventDefault(); cerrarMapa(); return; }
        if (k === 'm') { abrirMapa(); return; }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
            e.preventDefault(); teclas[k] = true; camLibre = false; arrancar(); return;
        }
        if (k === 'e' || ((k === 'enter' || k === ' ') && !e.target.closest('button'))) { e.preventDefault(); accion(); }
        if (k === 'pageup') { e.preventDefault(); irA(sel - 1, false); }
        if (k === 'pagedown') { e.preventDefault(); irA(sel + 1, false); }
    }

    /* ---------- Entrar y salir del modo juego ---------- */
    function empezar() {
        var t = juego.querySelector('[data-j-titulo]');
        t.classList.add('fuera');
        setTimeout(function () { t.hidden = true; t.classList.remove('fuera'); }, reducido ? 0 : 350);
        raiz.classList.add('en-juego');
        var ya = false;
        try { ya = sessionStorage.getItem('juego-empezado') === '1'; sessionStorage.setItem('juego-empezado', '1'); } catch (e) {}
        if (!ya) frasesIntro().forEach(function (f) { decir(f); });
        // En el móvil se juega en horizontal: donde el navegador lo permite, se bloquea el giro
        if (tactil && document.documentElement.requestFullscreen && screen.orientation && screen.orientation.lock) {
            document.documentElement.requestFullscreen().then(function () { return screen.orientation.lock('landscape'); }).catch(function () {});
        }
        arrancar();
    }
    // preguntar: true al cargar la página (elige entre juego y clásica);
    // false desde el botón "Modo juego" de la versión clásica.
    function entrar(preguntar) {
        if (!juego) crear();
        raiz.classList.add('en-juego');
        juego.hidden = false;
        juego.querySelector('[data-j-titulo]').hidden = !preguntar;
        if (!preguntar) empezar();
        medir();
        pintarHud();
        arrancar();
        if (preguntar) juego.querySelector('[data-j-empezar]').focus({ preventScroll: true });
    }
    function salir() {
        cerrar();
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
        raiz.classList.remove('en-juego');
        juego.hidden = true;
        enMarcha = false;
        window.scrollTo(0, 0);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) arrancar(); });

    document.querySelectorAll('[data-modo-juego]').forEach(function (b) {
        b.hidden = false;
        b.addEventListener('click', function () { entrar(false); });
    });

    // Cada visita pregunta si jugar o leer; un enlace a una sección concreta abre la clásica.
    var hashUrl = location.hash.slice(1);
    if (hashUrl === 'juego') entrar(false);
    else if (!hashUrl) entrar(true);
})();
