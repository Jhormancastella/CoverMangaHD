/**
 * js/notifications.js - Sistema de Notificaciones Toast
 * Sistema modular para mostrar notificaciones al usuario
 */

class ToastNotification {
    constructor(options = {}) {
        this.position = options.position || 'top-right';
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
            this.container.setAttribute('data-position', this.position);
            this.applyPositionStyles(this.container, this.position);
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
            this.container.setAttribute('data-position', this.position);
            this.applyPositionStyles(this.container, this.position);
        }
    }

    /**
     * Aplica estilos de posición al contenedor
     * @param {HTMLElement} container
     * @param {string} position
     */
    applyPositionStyles(container, position) {
        const styles = {
            position: 'fixed',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '16px'
        };

        const map = {
            'top-right': { top: '0', right: '0' },
            'top-left': { top: '0', left: '0' },
            'bottom-right': { bottom: '0', right: '0' },
            'bottom-left': { bottom: '0', left: '0' }
        };

        const pos = map[position] || map['top-right'];
        Object.assign(container.style, styles, pos);
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (default: 4000)
     */
    show(message, type = 'info', duration = 4000) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.style.backdropFilter = 'blur(12px)';
        toastEl.style.background = 'rgba(30, 41, 59, 0.9)';
        toastEl.style.border = '1px solid rgba(148, 163, 184, 0.2)';
        toastEl.style.borderRadius = '12px';
        toastEl.style.padding = '14px 18px';
        toastEl.style.color = '#f1f5f9';
        toastEl.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
        toastEl.style.display = 'flex';
        toastEl.style.alignItems = 'center';
        toastEl.style.gap = '10px';
        toastEl.style.minWidth = '280px';
        toastEl.style.maxWidth = '400px';
        toastEl.style.overflow = 'hidden';

        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
        };

        toastEl.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content" style="flex:1;">
                <span class="toast-message">${this.escapeHtml(message)}</span>
            </div>
            <button class="toast-close" aria-label="Cerrar" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;line-height:1;">&times;</button>
            <div class="toast-progress" style="position:absolute;bottom:0;left:0;height:3px;background:rgba(148,163,184,0.4);animation:toast-progress ${duration}ms linear forwards;"></div>
        `;

        toastEl.style.position = 'relative';

        // Agregar al contenedor
        this.container.appendChild(toastEl);

        // Animación de entrada con anime.js
        if (typeof anime !== 'undefined') {
            anime({
                targets: toastEl,
                translateX: this.position.includes('right') ? [100, 0] : [-100, 0],
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 400,
                easing: 'easeOutExpo'
            });
        }

        // Evento para cerrar manualmente
        const closeBtn = toastEl.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toastEl));

        // Auto-cerrar después de la duración
        setTimeout(() => this.remove(toastEl), duration);

        return toastEl;
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
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: toast,
                translateX: this.position.includes('right') ? [0, 100] : [0, -100],
                opacity: [1, 0],
                scale: [1, 0.9],
                duration: 300,
                easing: 'easeInExpo',
                complete: () => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }
            });
        } else {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
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
