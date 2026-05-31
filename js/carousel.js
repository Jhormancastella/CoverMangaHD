/**
 * js/carousel.js - Lógica de Carruseles
 * Sistema modular para manejar carruseles de imágenes
 */

class CarouselManager {
    constructor() {
        // Estado de los carruseles
        this.carouselState = {
            portadas: { 
                currentIndex: 0, 
                autoScroll: true, 
                intervalId: null,
                images: [],
                currentCategory: 'portadas'
            },
            separadores: { 
                currentIndex: 0, 
                autoScroll: true, 
                intervalId: null,
                images: [],
                currentCategory: 'separadores'
            },
            cubrepolvos: { 
                currentIndex: 0, 
                autoScroll: true, 
                intervalId: null,
                images: [],
                currentCategory: 'cubrepolvos'
            }
        };

        // Configuración
        this.config = {
            autoScrollInterval: 4000, // 4 segundos
            pauseAfterInteraction: 10000, // 10 segundos
            maxImages: 10
        };
    }

    /**
     * Inicia el desplazamiento automático
     * @param {string} category - Categoría del carrusel
     */
    startAutoScroll(category) {
        const state = this.carouselState[category];
        const slider = document.getElementById(`${category}-slider`);
        const indicators = document.getElementById(`${category}-indicators`);
        
        if (!slider || !indicators) return;

        state.intervalId = setInterval(() => {
            if (!state.autoScroll) return;
            
            const items = slider.querySelectorAll('.slider-item');
            if (items.length === 0) return;

            state.currentIndex = (state.currentIndex + 1) % items.length;
            this.scrollToItem(category, state.currentIndex);
        }, this.config.autoScrollInterval);
    }

    /**
     * Desplaza el carrusel a un ítem específico
     * @param {string} category - Categoría del carrusel
     * @param {number} index - Índice del ítem
     */
    scrollToItem(category, index) {
        const slider = document.getElementById(`${category}-slider`);
        const indicators = document.getElementById(`${category}-indicators`);
        const items = slider.querySelectorAll('.slider-item');
        
        if (items.length === 0) return;

        // Asegurar que el índice esté en el rango
        index = (index + items.length) % items.length;
        this.carouselState[category].currentIndex = index;

        // Desplazar al ítem
        const item = items[index];
        const scrollPosition = item.offsetLeft - slider.offsetLeft;
        
        slider.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });

        // Actualizar indicadores
        this.updateIndicators(category, index);
    }

    /**
     * Actualiza los indicadores de puntos
     * @param {string} category - Categoría del carrusel
     * @param {number} activeIndex - Índice activo
     */
    updateIndicators(category, activeIndex) {
        const indicators = document.getElementById(`${category}-indicators`);
        if (!indicators) return;
        
        const dots = indicators.querySelectorAll('.slider-dot');
        
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * Crea los indicadores de puntos
     * @param {string} category - Categoría del carrusel
     * @param {number} count - Cantidad de indicadores
     */
    createIndicators(category, count) {
        const indicators = document.getElementById(`${category}-indicators`);
        if (!indicators) return;
        
        indicators.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            dot.addEventListener('click', () => {
                this.scrollToItem(category, i);
                this.pauseAutoScrollTemporarily(category);
            });
            indicators.appendChild(dot);
        }
    }

    /**
     * Pausa el auto-scroll temporalmente
     * @param {string} category - Categoría del carrusel
     */
    pauseAutoScrollTemporarily(category) {
        const state = this.carouselState[category];
        state.autoScroll = false;
        
        // Actualizar botón
        const button = document.querySelector(`[onclick="toggleAutoScroll('${category}')"]`);
        if (button) {
            button.textContent = '▶️ Reanudar';
            button.classList.remove('active');
        }
        
        // Reanudar después del tiempo configurado
        setTimeout(() => {
            if (!state.autoScroll) {
                state.autoScroll = true;
                if (button) {
                    button.textContent = '⏸️ Pausar';
                    button.classList.add('active');
                }
            }
        }, this.config.pauseAfterInteraction);
    }

    /**
     * Alterna el auto-scroll
     * @param {string} category - Categoría del carrusel
     */
    toggleAutoScroll(category) {
        const state = this.carouselState[category];
        const button = document.querySelector(`[onclick="toggleAutoScroll('${category}')"]`);
        
        state.autoScroll = !state.autoScroll;
        
        if (state.autoScroll) {
            button.textContent = '⏸️ Pausar';
            button.classList.add('active');
        } else {
            button.textContent = '▶️ Reanudar';
            button.classList.remove('active');
        }
    }

    /**
     * Pausa todos los carruseles
     */
    pauseAllCarousels() {
        Object.keys(this.carouselState).forEach(cat => {
            this.carouselState[cat].autoScroll = false;
            const button = document.querySelector(`[onclick="toggleAutoScroll('${cat}')"]`);
            if (button) {
                button.textContent = '▶️ Reanudar';
                button.classList.remove('active');
            }
        });
    }

    /**
     * Reanuda todos los carruseles
     */
    resumeAllCarousels() {
        Object.keys(this.carouselState).forEach(cat => {
            const button = document.querySelector(`[onclick="toggleAutoScroll('${cat}')"]`);
            if (button && button.textContent === '▶️ Reanudar') {
                this.carouselState[cat].autoScroll = true;
                button.textContent = '⏸️ Pausar';
                button.classList.add('active');
            }
        });
    }

    /**
     * Carga un carrusel por categoría
     * @param {string} category - Categoría a cargar
     * @param {object} db - Instancia de Firestore
     * @param {function} onImageClick - Callback al hacer clic en imagen
     */
    async loadCategoryCarousel(category, db, onImageClick) {
        try {
            // Intentar obtener del caché primero
            const cacheKey = `carousel_${category}`;
            let snapshot = null;
            
            const queryPromise = async () => {
                return await db.collection('imagenes')
                    .where('category', '==', category)
                    .orderBy('timestamp', 'desc')
                    .limit(this.config.maxImages)
                    .get();
            };

            // Usar caché si está disponible
            if (typeof firestoreCache !== 'undefined') {
                const cachedData = firestoreCache.get(`cmhd_cache_carousel_${category}`);
                if (cachedData) {
                    this.renderCarousel(category, cachedData, onImageClick);
                    return;
                }
            }

            snapshot = await queryPromise();

            const slider = document.getElementById(`${category}-slider`);
            
            if (snapshot.empty) {
                slider.innerHTML = `
                    <div class="no-images-slider">
                        <h3>No hay ${category} disponibles</h3>
                        <p>Ve al panel de administración para subir el primer ${category.slice(0, -1)}</p>
                        <button class="admin-btn" onclick="openAdminModal()" style="margin-top: 10px;">
                            📤 Subir ${category.slice(0, -1)}
                        </button>
                    </div>
                `;
                return;
            }

            slider.innerHTML = '';
            const images = [];
            
            snapshot.forEach(doc => {
                images.push(sanitizeImageRecord({ id: doc.id, ...doc.data() }));
            });

            // Guardar en caché
            if (typeof firestoreCache !== 'undefined') {
                firestoreCache.set(`cmhd_cache_carousel_${category}`, images, 2 * 60 * 1000); // 2 minutos
            }

this.renderCarousel(category, images, onImageClick);

         } catch (error) {
            console.error(`❌ Error cargando ${category}:`, error);
            const slider = document.getElementById(`${category}-slider`);
            const safeMessage = sanitizeText(error.message || 'Error desconocido', 200);
            slider.innerHTML = `
                <div class="no-images-slider">
                    <h3>Error cargando ${category}</h3>
                    <p>${safeMessage}</p>
                    <button onclick="carouselManager.loadCategoryCarousel('${category}', db, openPreviewModal)" style="margin-top: 10px;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Renderiza el carrusel con las imágenes
     * @param {string} category - Categoría
     * @param {Array} images - Array de imágenes
     * @param {function} onImageClick - Callback al hacer clic
     */
    renderCarousel(category, images, onImageClick) {
        const slider = document.getElementById(`${category}-slider`);
        slider.innerHTML = '';

        // Guardar imágenes en el estado
        this.carouselState[category].images = images;

        images.forEach((image, index) => {
            if (!image.url) return;

            const slide = document.createElement('div');
            slide.className = 'slider-item';
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.title;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            img.onload = function() { this.style.opacity = '1'; };
            img.onerror = function() {
                this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
                        <rect fill="#ecf0f1" width="300" height="200"/>
                        <text fill="#7f8c8d" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">Imagen no disponible</text>
                    </svg>
                `);
                this.style.opacity = '1';
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

            slide.appendChild(img);
            slide.appendChild(info);
            
            // Hacer la imagen clickeable
            if (onImageClick) {
                slide.addEventListener('click', () => onImageClick(category, index));
            }
            
            slider.appendChild(slide);
        });

        // Crear indicadores
        this.createIndicators(category, images.length);
        
        // Iniciar auto-scroll
        this.startAutoScroll(category);
    }

    /**
     * Obtiene las imágenes de una categoría
     * @param {string} category 
     * @returns {Array}
     */
    getImages(category) {
        return this.carouselState[category]?.images || [];
    }

    /**
     * Obtiene el estado de una categoría
     * @param {string} category 
     * @returns {object}
     */
    getState(category) {
        return this.carouselState[category];
    }
}

// Instancia global
const carouselManager = new CarouselManager();

// Función global para compatibilidad
function toggleAutoScroll(category) {
    carouselManager.toggleAutoScroll(category);
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarouselManager, carouselManager };
}
