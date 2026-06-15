/**
 * js/gallery.js - Lógica de Galerías
 * Sistema modular para páginas de galería (portadas, separadores, cubrepolvos)
 */

class GalleryManager {
    constructor() {
        this.state = {
            currentCategory: null,
            images: [],
            filteredImages: [],
            searchQuery: '',
            isLoading: false,
            displayedCount: 0
        };
        
        this.config = {
            batchSize: 20, // Cargar de 20 en 20
            placeholderImage: `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
                    <rect fill="#ecf0f1" width="300" height="200"/>
                    <text fill="#7f8c8d" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">Imagen no disponible</text>
                </svg>
            `)}`,
            masonryThreshold: 50
        };
    }

    /**
     * Carga las imágenes de una categoría
     * @param {string} category - Categoría a cargar
     * @param {object} db - Instancia de Firestore
     */
    async loadGallery(category, db) {
        this.state.currentCategory = category;
        this.state.isLoading = true;
        this.state.displayedCount = 0;
        
        const gallery = document.getElementById(`${category}-gallery`) || 
                        document.querySelector('.gallery-grid');
        
        if (!gallery) {
            console.error('No se encontró el contenedor de galería');
            return;
        }

        // Mostrar loading
        gallery.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1;">
                <div class="slider-spinner"></div>
                <p class="loading-text">Cargando ${category}...</p>
            </div>
        `;

        try {
            console.log(`🚀 Cargando galería de ${category}...`);

            // Intentar obtener del caché
            const cacheKey = `gallery_${category}`;
            let images = null;
            
            if (typeof firestoreCache !== 'undefined') {
                images = firestoreCache.get(`cmhd_cache_${cacheKey}`);
            }

            if (!images) {
                // Consultar Firestore
                const snapshot = await db.collection('imagenes')
                    .where('category', '==', category)
                    .orderBy('timestamp', 'desc')
                    .get();

                images = [];
                snapshot.forEach(doc => {
                    images.push(sanitizeImageRecord({ id: doc.id, ...doc.data() }));
                });

                // Guardar en caché
                if (typeof firestoreCache !== 'undefined') {
                    firestoreCache.set(`cmhd_cache_${cacheKey}`, images, 3 * 60 * 1000); // 3 minutos
                }
            } else {
                console.log(`📦 Usando caché para galería de ${category}`);
            }

            this.state.images = images;
            this.state.filteredImages = images;
            this.state.isLoading = false;

            // Renderizar galería
            this.renderGallery(gallery, images);

            console.log(`✅ Galería de ${category} cargada: ${images.length} imágenes`);

        } catch (error) {
            console.error(`❌ Error cargando galería de ${category}:`, error);
            this.state.isLoading = false;
            
            const safeMessage = sanitizeText(error.message || 'Error desconocido', 200);
            gallery.innerHTML = `
                <div class="no-images-slider" style="grid-column: 1 / -1;">
                    <h3>Error cargando ${category}</h3>
                    <p>${safeMessage}</p>
                    <button onclick="galleryManager.loadGallery('${category}', db)" style="margin-top: 10px;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Renderiza la galería
     * @param {HTMLElement} container - Contenedor de la galería
     * @param {Array} images - Array de imágenes
     */
    renderGallery(container, images) {
        container.innerHTML = '';

        if (images.length === 0) {
            container.innerHTML = `
                <div class="no-images-slider" style="grid-column: 1 / -1;">
                    <h3>No hay ${this.state.currentCategory} disponibles</h3>
                    <p>Ve al panel de administración para subir contenido</p>
                </div>
            `;
            return;
        }

        // Agregar botón de descarga de categoría al inicio
        this.addDownloadButton(container, images);

        images.forEach((image, index) => {
            if (!image.url) return;

            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `Ver ${image.title}`);

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.title;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.objectFit = 'cover';
            img.onerror = () => {
                img.src = this.config.placeholderImage;
            };

            const info = document.createElement('div');
            info.className = 'info';

            const title = document.createElement('h3');
            title.textContent = image.title;
            info.appendChild(title);

            if (image.series) {
                const series = document.createElement('p');
                series.textContent = `📚 ${image.series}`;
                info.appendChild(series);
            }

            if (image.volume) {
                const volume = document.createElement('p');
                volume.textContent = `📖 Vol. ${image.volume}`;
                info.appendChild(volume);
            }

            item.appendChild(img);
            item.appendChild(info);

            // Eventos de clic
            const openPreview = () => {
                if (typeof previewModal !== 'undefined') {
                    previewModal.open(this.state.currentCategory, index, images);
                }
            };

            item.addEventListener('click', openPreview);
            item.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPreview();
                }
            });

            container.appendChild(item);
        });

        // Agregar botón "Cargar más" si hay más de 50 imágenes
        if (images.length > this.config.masonryThreshold) {
            const loadMore = document.createElement('button');
            loadMore.className = 'load-more-btn';
            loadMore.textContent = 'Cargar más';
            loadMore.style.gridColumn = '1 / -1';
            loadMore.style.marginTop = '20px';
            loadMore.addEventListener('click', () => {
                if (typeof toast !== 'undefined') {
                    toast.info('Todas las imágenes ya están cargadas.');
                } else {
                    showNotification('Todas las imágenes ya están cargadas.', 'info');
                }
            });
            container.appendChild(loadMore);
        }

        // Animar entrada con anime.js
        this.animateGrid(container);
    }

    /**
     * Anima la entrada de los items de la galería
     * @param {HTMLElement} container 
     */
    animateGrid(container) {
        if (typeof anime !== 'undefined') {
            anime({
                targets: container.querySelectorAll('.gallery-item'),
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(50),
                duration: 600,
                easing: 'easeOutExpo'
            });
        }
    }

    /**
     * Agrega botón de descarga de categoría
     * @param {HTMLElement} container 
     * @param {Array} images 
     */
    addDownloadButton(container, images) {
        const header = container.previousElementSibling;
        if (header && header.querySelector('.download-category-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'download-category-btn';
        btn.textContent = '⬇️ Descargar categoría';
        btn.style.marginBottom = '16px';
        btn.addEventListener('click', () => {
            this.downloadCategory(images);
        });

        // Insertar antes del grid si hay un header
        if (header && (header.classList.contains('gallery-header') || header.tagName === 'H2' || header.tagName === 'H1')) {
            header.appendChild(btn);
        } else {
            container.parentNode.insertBefore(btn, container);
        }
    }

    /**
     * Descarga todas las imágenes de la categoría actual
     * @param {Array} images 
     */
    async downloadCategory(images) {
        const category = this.state.currentCategory || 'categoria';
        if (typeof downloadGalleryCategory !== 'undefined') {
            await downloadGalleryCategory(images || this.state.images, category);
        } else {
            if (typeof toast !== 'undefined') {
                toast.error('Función de descarga masiva no disponible');
            } else {
                showNotification('Función de descarga masiva no disponible', 'error');
            }
        }
    }

    /**
     * Filtra las imágenes por término de búsqueda
     * @param {string} query - Término de búsqueda
     */
    search(query) {
        this.state.searchQuery = query.toLowerCase().trim();
        
        if (!this.state.searchQuery) {
            this.state.filteredImages = this.state.images;
        } else {
            this.state.filteredImages = this.state.images.filter(image => {
                return (
                    image.title.toLowerCase().includes(this.state.searchQuery) ||
                    (image.series && image.series.toLowerCase().includes(this.state.searchQuery)) ||
                    (image.volume && image.volume.toString().includes(this.state.searchQuery))
                );
            });
        }

        const gallery = document.querySelector('.gallery-grid');
        if (gallery) {
            this.renderGallery(gallery, this.state.filteredImages);
        }
    }

    /**
     * Obtiene las imágenes filtradas
     * @returns {Array}
     */
    getFilteredImages() {
        return this.state.filteredImages;
    }

    /**
     * Obtiene todas las imágenes
     * @returns {Array}
     */
    getAllImages() {
        return this.state.images;
    }

    /**
     * Refresca la galería (invalida caché)
     * @param {object} db - Instancia de Firestore
     */
    async refresh(db) {
        if (typeof firestoreCache !== 'undefined') {
            firestoreCache.invalidateCollection(this.state.currentCategory);
        }
        await this.loadGallery(this.state.currentCategory, db);
    }
}

// Instancia global
const galleryManager = new GalleryManager();

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GalleryManager, galleryManager };
}
