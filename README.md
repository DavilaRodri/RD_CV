# rodrigodavila.com

Web personal de Rodrigo Dávila: perfil, proyectos con demo, trayectoria y un asistente que responde sobre su carrera.

- `index.html`, `css/estilo.css`, `js/app.js`: la web. HTML, CSS y JavaScript sin frameworks, en español e inglés.
- `perfil.md`: **lo que sabe el asistente**. Para cambiar una respuesta, edita este archivo y súbelo.
  - Las secciones `##` son los temas que usa la IA para preguntas libres.
  - En "Preguntas rápidas" (ES) y "Quick questions" (EN), cada `###` es un botón y el texto de debajo es su respuesta exacta, sin IA.
  - Todo lo que pongas ahí es público.
- `cloudflare-worker/`: el asistente. Un modelo abierto en Cloudflare Workers AI (plan gratuito) que lee `perfil.md`. Despliegue: `cd cloudflare-worker && npx wrangler deploy`.
- `img/`: retrato, capturas de las apps y webs.

Si el asistente no responde (cuota agotada o caída), la web busca la respuesta directamente en `perfil.md`.

Se publica con GitHub Pages desde `main` en el dominio de `CNAME`.
