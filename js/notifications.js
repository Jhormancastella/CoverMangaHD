/**
 * js/notifications.js - Sistema de Notificaciones Toast
 * Sistema modular para mostrar notificaciones al usuario
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.init();
    }

    /**
     * Inicializa el contenedor de notificaciones
     */
    init() {
        // Crear contenedor si no existe
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (default: 4000)
     */
    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Iconos según tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content">
                <span class="toast-message">${this.escapeHtml(message)}</span>
            </div>
            <button class="toast-close" aria-label="Cerrar">&times;</button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        // Agregar al contenedor
        this.container.appendChild(toast);

        // Evento para cerrar manualmente
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Auto-cerrar después de la duración
        setTimeout(() => this.remove(toast), duration);

        return toast;
    }

    /**
     * Muestra una notificación de éxito
     * @param {string} message 
     * @param {number} duration 
     */
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Muestra una notificación de error
     * @param {string} message 
     * @param {number} duration 
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Muestra una notificación de advertencia
     * @param {string} message 
     * @param {number} duration 
     */
    warning(message, duration = 4500) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Muestra una notificación informativa
     * @param {string} message 
     * @param {number} duration 
     */
    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Remueve un toast con animación
     * @param {HTMLElement} toast 
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Limpia todas las notificaciones
     */
    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.remove(toast));
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Instancia global
const toast = new ToastNotification();

/**
 * Función global para compatibilidad con código existente
 * @param {string} message 
 * @param {string} type 
 */
function showNotification(message, type = 'info') {
    toast.show(message, type);
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToastNotification, toast, showNotification };
}
