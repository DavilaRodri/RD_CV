// Cloudflare Worker - Proxy para Gemini API
// Despliega esto en Cloudflare Workers y añade tu API key como variable de entorno (GEMINI_API_KEY).
//
// SEGURIDAD:
// - Solo acepta peticiones desde los orígenes en ALLOWED_ORIGINS (evita que otras webs
//   gasten tu cuota de Gemini). El navegador manda la cabecera Origin automáticamente.
// - Limita el tamaño del payload para evitar abusos.
// - Para rate limiting real por IP, crea una regla de Rate Limiting en el dashboard de
//   Cloudflare (Security > WAF > Rate limiting rules) apuntando a la ruta del Worker.

const ALLOWED_ORIGINS = [
    'https://rodrigodavila.com',
    'https://www.rodrigodavila.com',
    'http://localhost:8000',   // desarrollo local
    'http://127.0.0.1:8000',
];

const MAX_BODY_BYTES = 20 * 1024; // 20 KB: suficiente para el prompt + historial

function corsHeaders(origin) {
    // Solo reflejamos el origen si está en la lista blanca.
    const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const isAllowed = ALLOWED_ORIGINS.includes(origin);

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders(origin) });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // Bloquear orígenes no autorizados (evita abuso de tu API key desde otras webs)
        if (!isAllowed) {
            return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Rechazar payloads demasiado grandes
        const contentLength = Number(request.headers.get('Content-Length') || 0);
        if (contentLength > MAX_BODY_BYTES) {
            return new Response(JSON.stringify({ error: 'Payload too large' }), {
                status: 413,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
            });
        }

        try {
            const rawBody = await request.text();
            if (rawBody.length > MAX_BODY_BYTES) {
                return new Response(JSON.stringify({ error: 'Payload too large' }), {
                    status: 413,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
                });
            }
            const body = JSON.parse(rawBody);

            const GEMINI_API_KEY = env.GEMINI_API_KEY;
            const GEMINI_MODEL = 'gemini-2.5-flash';
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(origin),
                },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(origin),
                },
            });
        }
    },
};
