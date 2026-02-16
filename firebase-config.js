const firebaseConfig = {
    apiKey: "AIzaSyCqsB9Y1CKKjnawNUfVVEnmm6u3oivpyVM",
    authDomain: "galer-anime.firebaseapp.com",
    projectId: "galer-anime",
    storageBucket: "galer-anime.firebasestorage.app",
    messagingSenderId: "1057820744655",
    appId: "1:1057820744655:web:46ed61120adca8a778d0ba"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// IMPORTANTE:
// Reemplaza el correo por tu usuario administrador real en Firebase Auth.
const ADMIN_EMAIL_ALLOWLIST = ["admin@covermangahd.com"];

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isAdminEmail(email) {
    return ADMIN_EMAIL_ALLOWLIST.includes(normalizeEmail(email));
}

function getCurrentUser() {
    return auth.currentUser || null;
}

function isCurrentUserAdmin() {
    const user = getCurrentUser();
    return !!user && isAdminEmail(user.email);
}

async function signInAdmin(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const credential = await auth.signInWithEmailAndPassword(normalizedEmail, password);
    const user = credential.user;

    if (!isAdminEmail(user && user.email)) {
        await auth.signOut();
        throw new Error("El usuario autenticado no tiene permisos de administrador.");
    }

    return user;
}

async function logoutAdminSession() {
    await auth.signOut();
}

function onAuthReady(callback) {
    return auth.onAuthStateChanged(callback);
}

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
