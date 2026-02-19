/**
 * firebase-config.js - Configuración de Firebase
 * NOTA: Las credenciales de Firebase están diseñadas para ser públicas en apps web.
 * La seguridad se maneja mediante las reglas de Firestore y Storage.
 */

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqsB9Y1CKKjnawNUfVVEnmm6u3oivpyVM",
    authDomain: "galer-anime.firebaseapp.com",
    projectId: "galer-anime",
    storageBucket: "galer-anime.firebasestorage.app",
    messagingSenderId: "1057820744655",
    appId: "1:1057820744655:web:46ed61120adca8a778d0ba"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== CONFIGURACIÓN DE ADMIN =====
// IMPORTANTE: En producción, usa Firebase Custom Claims en lugar de una lista de emails.
// Esto es solo para desarrollo/pruebas.
// Para usar Custom Claims:
// 1. Usa Firebase Admin SDK en tu backend
// 2. Establece: admin.auth().setCustomUserClaims(uid, { admin: true })
// 3. Luego verifica con: user.getIdTokenResult().then(idTokenResult => idTokenResult.claims.admin)

const ADMIN_CONFIG = {
    // Lista de emails autorizados (mover a Custom Claims en producción)
    allowlist: ["jesusjhorman123@gmail.com"],
    
    // Habilitar modo debug (solo desarrollo)
    debug: false
};

/**
 * Normaliza un email para comparación
 * @param {string} email 
 * @returns {string}
 */
function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

/**
 * Verifica si un email está en la lista de administradores
 * @param {string} email 
 * @returns {boolean}
 */
function isAdminEmail(email) {
    const normalized = normalizeEmail(email);
    const isAllowed = ADMIN_CONFIG.allowlist.includes(normalized);
    
    if (ADMIN_CONFIG.debug) {
        console.log(`[Admin Check] Email: ${normalized}, Allowed: ${isAllowed}`);
    }
    
    return isAllowed;
}

/**
 * Obtiene el usuario actual
 * @returns {object|null}
 */
function getCurrentUser() {
    return auth.currentUser || null;
}

/**
 * Verifica si el usuario actual es administrador
 * @returns {boolean}
 */
function isCurrentUserAdmin() {
    const user = getCurrentUser();
    return !!user && isAdminEmail(user.email);
}

/**
 * Inicia sesión de administrador
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
async function signInAdmin(email, password) {
    const normalizedEmail = normalizeEmail(email);
    
    try {
        const credential = await auth.signInWithEmailAndPassword(normalizedEmail, password);
        const user = credential.user;

        if (!isAdminEmail(user && user.email)) {
            await auth.signOut();
            throw new Error("El usuario autenticado no tiene permisos de administrador.");
        }

        if (ADMIN_CONFIG.debug) {
            console.log(`[Admin Login] Success: ${normalizedEmail}`);
        }

        return user;
    } catch (error) {
        if (ADMIN_CONFIG.debug) {
            console.error(`[Admin Login] Error:`, error);
        }
        throw error;
    }
}

/**
 * Cierra la sesión de administrador
 * @returns {Promise<void>}
 */
async function logoutAdminSession() {
    try {
        await auth.signOut();
        
        // Limpiar caché local al cerrar sesión
        if (typeof firestoreCache !== 'undefined') {
            firestoreCache.clearAll();
        }
        
        if (ADMIN_CONFIG.debug) {
            console.log("[Admin Logout] Session closed");
        }
    } catch (error) {
        console.error("[Admin Logout] Error:", error);
        throw error;
    }
}

/**
 * Callback para cambios de estado de autenticación
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
function onAuthReady(callback) {
    return auth.onAuthStateChanged(callback);
}

/**
 * Verifica acceso de admin o redirige
 * @returns {Promise<boolean>}
 */
function ensureAdminAccessOrRedirect() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe();

            if (!user) {
                window.location.href = "index.html";
                resolve(false);
                return;
            }

            if (!isAdminEmail(user.email)) {
                await auth.signOut();
                window.location.href = "index.html";
                resolve(false);
                return;
            }

            resolve(true);
        });
    });
}

/**
 * Habilita persistencia de Firestore para modo offline
 * @returns {Promise<void>}
 */
async function enableFirestorePersistence() {
    try {
        await db.enablePersistence({ synchronizeTabs: true });
        console.log("[Firebase] Persistencia habilitada");
    } catch (error) {
        if (error.code === 'failed-precondition') {
            console.warn("[Firebase] Persistencia no disponible: múltiples pestañas abiertas");
        } else if (error.code === 'unimplemented') {
            console.warn("[Firebase] Persistencia no soportada en este navegador");
        } else {
            console.error("[Firebase] Error habilitando persistencia:", error);
        }
    }
}

// Inicializar persistencia cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableFirestorePersistence);
} else {
    enableFirestorePersistence();
}

// Manejar errores de autenticación globalmente
auth.onAuthStateChanged((user) => {
    if (ADMIN_CONFIG.debug) {
        console.log("[Auth State] User:", user ? user.email : "No user");
    }
});

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        app,
        db,
        auth,
        ADMIN_CONFIG,
        normalizeEmail,
        isAdminEmail,
        getCurrentUser,
        isCurrentUserAdmin,
        signInAdmin,
        logoutAdminSession,
        onAuthReady,
        ensureAdminAccessOrRedirect,
        enableFirestorePersistence
    };
}
