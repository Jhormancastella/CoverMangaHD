/**
 * js/cache.js - Sistema de Caché para Firestore
 * Mejora el rendimiento almacenando consultas en localStorage
 */

class FirestoreCache {
    constructor(prefix = 'cmhd_cache_') {
        this.prefix = prefix;
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
    }

    /**
     * Genera una clave de caché única
     * @param {string} collection - Nombre de la colección
     * @param {object} query - Parámetros de la consulta
     * @returns {string}
     */
    generateKey(collection, query = {}) {
        const queryString = JSON.stringify(query);
        return `${this.prefix}${collection}_${this.hashString(queryString)}`;
    }

    /**
     * Hash simple para generar claves únicas
     * @param {string} str 
     * @returns {string}
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Guarda datos en caché
     * @param {string} key - Clave de caché
     * @param {any} data - Datos a guardar
     * @param {number} ttl - Tiempo de vida en ms
     */
    set(key, data, ttl = this.defaultTTL) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.warn('Error guardando en caché:', error);
            // Si el localStorage está lleno, limpiar caché antiguo
            this.cleanExpired();
            return false;
        }
    }

    /**
     * Obtiene datos del caché
     * @param {string} key - Clave de caché
     * @returns {any|null}
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const cacheItem = JSON.parse(item);
            
            // Verificar si ha expirado
            if (this.isExpired(cacheItem)) {
                this.remove(key);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.warn('Error leyendo caché:', error);
            return null;
        }
    }

    /**
     * Verifica si un item ha expirado
     * @param {object} cacheItem 
     * @returns {boolean}
     */
    isExpired(cacheItem) {
        if (!cacheItem || !cacheItem.timestamp || !cacheItem.ttl) return true;
        return Date.now() > (cacheItem.timestamp + cacheItem.ttl);
    }

    /**
     * Elimina un item del caché
     * @param {string} key 
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Error eliminando caché:', error);
        }
    }

    /**
     * Limpia todo el caché del prefijo
     */
    clearAll() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Error limpiando caché:', error);
        }
    }

    /**
     * Limpia solo los items expirados
     */
    cleanExpired() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const cacheItem = JSON.parse(item);
                        if (this.isExpired(cacheItem)) {
                            keysToRemove.push(key);
                        }
                    }
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Error limpiando caché expirado:', error);
        }
    }

    /**
     * Obtiene datos con fallback a Firestore
     * @param {string} collection - Colección de Firestore
     * @param {object} queryOptions - Opciones de consulta
     * @param {function} fetchFn - Función para obtener datos de Firestore
     * @param {number} ttl - Tiempo de vida del caché
     * @returns {Promise<any>}
     */
    async getOrFetch(collection, queryOptions, fetchFn, ttl = this.defaultTTL) {
        const key = this.generateKey(collection, queryOptions);
        
        // Intentar obtener del caché
        const cachedData = this.get(key);
        if (cachedData !== null) {
            console.log(`📦 Datos obtenidos del caché: ${collection}`);
            return cachedData;
        }

        // Si no está en caché, obtener de Firestore
        console.log(`🔄 Obteniendo datos de Firestore: ${collection}`);
        const data = await fetchFn();
        
        // Guardar en caché
        this.set(key, data, ttl);
        
        return data;
    }

    /**
     * Invalida caché de una colección específica
     * @param {string} collection 
     */
    invalidateCollection(collection) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.prefix}${collection}_`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Caché invalidado para: ${collection}`);
        } catch (error) {
            console.warn('Error invalidando caché:', error);
        }
    }
}

// Instancia global
const firestoreCache = new FirestoreCache();

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirestoreCache, firestoreCache };
}
