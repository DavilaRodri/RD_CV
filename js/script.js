// ============================================
// RODRIGO DÁVILA - Script Principal
// ============================================

// Función para alternar entre modo claro y oscuro
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const isDarkMode = body.classList.contains('dark-mode');

    if (isDarkMode) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeBtn.textContent = '🌙';
        themeBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
        // Actualizar meta theme-color para móviles
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeBtn.textContent = '☀️';
        themeBtn.setAttribute('aria-label', 'Cambiar a modo claro');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0f13');
    }
    
    // Guardar preferencia
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
}

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeBtn = document.getElementById('theme-btn');
    
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        themeBtn.textContent = '🌙';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    const conversation = document.getElementById('conversation');
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    conversation.appendChild(typing);
    scrollToBottom();
}

// Ocultar indicador de escritura
function hideTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
}

// Scroll al final
function scrollToBottom() {
    const contentArea = document.querySelector('.content-area');
    setTimeout(() => {
        contentArea.scrollTop = contentArea.scrollHeight;
    }, 100);
}

// Lanzar una pregunta sugerida (chips del welcome)
function askSuggestion(text) {
    const input = document.getElementById('pregunta');
    input.value = text;
    enviarPregunta();
}

// Función para enviar la pregunta
async function enviarPregunta() {
    const preguntaInput = document.getElementById('pregunta');
    const pregunta = preguntaInput.value.trim();
    const conversation = document.getElementById('conversation');
    const welcome = document.querySelector('.welcome');
    const container = document.querySelector('.container');

    if (!pregunta) return;

    // Ocultar welcome y activar conversación
    welcome.style.display = 'none';
    container.classList.add('active');
    conversation.classList.add('active');

    // Mostrar mensaje del usuario
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = pregunta;
    conversation.appendChild(userMessage);

    // Limpiar input y resetear altura
    preguntaInput.value = '';
    preguntaInput.style.height = 'auto';

    scrollToBottom();

    // Mostrar indicador de escritura
    showTypingIndicator();

    try {
        // Obtener respuesta de la IA
        const respuesta = await responderPregunta(pregunta);
        
        hideTypingIndicator();

        // Mostrar respuesta
        const assistantMessage = document.createElement('div');
        assistantMessage.className = 'message assistant-message';
        assistantMessage.innerHTML = formatResponse(respuesta);
        conversation.appendChild(assistantMessage);

    } catch (error) {
        hideTypingIndicator();
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message assistant-message';
        errorMessage.textContent = 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.';
        conversation.appendChild(errorMessage);
    }

    scrollToBottom();
}

// Escapar HTML para evitar inyección al usar innerHTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formatear respuesta:
// 1) escapa HTML, 2) aplica markdown básico, 3) agrupa en párrafos para que
// los saltos de línea sueltos de Gemini no rompan negritas ni dejen puntos colgando.
function formatResponse(text) {
    let html = escapeHtml(text.trim())
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Cursiva: solo *texto* real, sin tragarse los asteriscos de las listas
        .replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');

    // Separar en párrafos por líneas en blanco
    const paragraphs = html.split(/\n\s*\n/).map(block => {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        // Si todas las líneas son ítems de lista, convertir el marcador a viñeta •
        const isList = lines.length > 0 && lines.every(l => /^([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
            return lines.map(l => l.replace(/^([-*•]|\d+[.)])\s+/, '• ')).join('<br>');
        }
        // Texto normal: unir saltos sueltos (evita romper negritas / dejar puntos colgando)
        return lines.join(' ');
    });

    return paragraphs
        .join('<br><br>')
        .replace(/\s+([.,;:!?])/g, '$1'); // quitar espacio antes de puntuación
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    
    // Focus en el input
    const input = document.getElementById('pregunta');
    if (input && window.innerWidth > 768) {
        input.focus();
    }
});