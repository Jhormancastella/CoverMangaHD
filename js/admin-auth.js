/**
 * js/admin-auth.js - Autenticación de Administrador
 * Sistema modular para manejar la autenticación del panel admin
 */

class AdminAuth {
    constructor() {
        this.isAdmin = false;
        this.currentUser = null;
        this.initialized = false;
    }

    /**
     * Inicializa el sistema de autenticación
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Verificar estado de autenticación al cargar
        if (typeof onAuthReady !== 'undefined') {
            onAuthReady((user) => {
                this.handleAuthStateChange(user);
            });
        }
    }

    /**
     * Maneja cambios en el estado de autenticación
     * @param {object} user - Usuario de Firebase
     */
    handleAuthStateChange(user) {
        this.currentUser = user;
        this.isAdmin = user && isCurrentUserAdmin();
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { user, isAdmin: this.isAdmin }
        }));
    }

    /**
     * Inicia sesión de administrador
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>}
     */
    async login(email, password) {
        try {
            const user = await signInAdmin(email, password);
            this.currentUser = user;
            this.isAdmin = true;
            
            if (typeof toast !== 'undefined') {
                toast.success('✅ Sesión iniciada correctamente');
            }
            
            return { success: true, user };
        } catch (error) {
            console.error('Error de login:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Contraseña incorrecta';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'Usuario no encontrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Correo electrónico inválido';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Demasiados intentos. Intenta más tarde';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            if (typeof toast !== 'undefined') {
                toast.error(`❌ ${errorMessage}`);
            }
            
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Cierra la sesión de administrador
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await logoutAdminSession();
            this.currentUser = null;
            this.isAdmin = false;
            
            if (typeof toast !== 'undefined') {
                toast.info('Sesión cerrada');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error;
        }
    }

    /**
     * Verifica si el usuario tiene acceso de admin
     * @returns {Promise<boolean>}
     */
    async checkAdminAccess() {
        if (typeof ensureAdminAccessOrRedirect !== 'undefined') {
            return await ensureAdminAccessOrRedirect();
        }
        return false;
    }

    /**
     * Obtiene el usuario actual
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser || getCurrentUser();
    }

    /**
     * Verifica si está autenticado como admin
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.isAdmin;
    }
}

// Instancia global
const adminAuth = new AdminAuth();

// Funciones globales para compatibilidad
function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'flex';
        // Focus en el campo de email
        setTimeout(() => {
            const emailInput = document.getElementById('adminEmail');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'none';
        // Limpiar campos
        const emailInput = document.getElementById('adminEmail');
        const passwordInput = document.getElementById('adminPassword');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
}

async function loginAdmin() {
    const email = document.getElementById('adminEmail')?.value;
    const password = document.getElementById('adminPassword')?.value;

    if (!email || !password) {
        if (typeof toast !== 'undefined') {
            toast.warning('Por favor completa todos los campos');
        } else {
            alert('Por favor completa todos los campos');
        }
        return;
    }

    try {
        const result = await adminAuth.login(email, password);
        if (result.success) {
            closeAdminModal();
            window.location.href = 'admin.html';
        }
    } catch (error) {
        console.error('Error en loginAdmin:', error);
    }
}

async function logoutAdmin() {
    try {
        await adminAuth.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'index.html';
    }
}

// Evento para cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('adminModal');
        if (modal && modal.style.display === 'flex') {
            closeAdminModal();
        }
    }
});

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminAuth, adminAuth };
}
