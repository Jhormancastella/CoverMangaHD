/**
 * js/preview-modal.js - Modal de Vista Previa
 * Sistema modular para visualizar imágenes en detalle
 */

class PreviewModal {
    constructor() {
        this.state = {
            currentCategory: null,
            currentIndex: 0,
            images: []
        };
        this.modal = null;
        this.initialized = false;
        this.zoomed = false;
        this.pan = { x: 0, y: 0, dragging: false, startX: 0, startY: 0 };
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.observer = null;
    }

    /**
     * Inicializa el modal
     */
    init() {
        if (this.initialized) return;
        
        // Crear el modal si no existe
        if (!document.getElementById('previewModal')) {
            this.createModalHTML();
        }
        
        this.modal = document.getElementById('previewModal');
        this.initialized = true;
        
        // Agregar botón "Descargar todas" si no existe
        this.ensureDownloadAllButton();

        // Agregar eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Agregar eventos de zoom/pan
        this.setupZoomPan();

        // Agregar eventos de swipe
        this.setupSwipe();
    }

    /**
     * Crea el HTML del modal
     */
    createModalHTML() {
        const modalHTML = `
            <div id="previewModal" class="preview-modal">
                <div class="preview-content">
                    <div class="preview-header">
                        <h3 class="preview-title" id="previewImageTitle">Título de la Imagen</h3>
                        <button class="preview-close" onclick="previewModal.close()" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="preview-body">
                        <div class="preview-image-container">
                            <img id="previewImage" src="" alt="Vista previa" class="preview-image">
                        </div>
                        <div class="preview-info">
                            <div class="preview-details">
                                <h3 id="previewDetailTitle">Título de la Imagen</h3>
                                <div class="preview-meta">
                                    <p><strong>Categoría:</strong> <span id="previewCategory">Portada</span></p>
                                    <p><strong>Serie:</strong> <span id="previewSeries">N/A</span></p>
                                    <p><strong>Volumen:</strong> <span id="previewVolume">N/A</span></p>
                                    <p><strong>Fecha:</strong> <span id="previewDate">N/A</span></p>
                                </div>
                            </div>
                            <div class="preview-actions">
                                <button class="preview-btn download" onclick="previewModal.download()">
                                    ⬇️ Descargar Imagen
                                </button>
                                <button class="preview-btn download-all" onclick="previewModal.downloadAll()">
                                    ⬇️ Descargar Todas
                                </button>
                                <button class="preview-btn view-original" onclick="previewModal.viewOriginal()">
                                    👁️ Ver Original
                                </button>
                                <button class="preview-btn close-preview" onclick="previewModal.close()">
                                    ❌ Cerrar Vista Previa
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="preview-navigation">
                        <button class="nav-btn" id="prevBtn" onclick="previewModal.navigate(-1)">
                            ◀️ Anterior
                        </button>
                        <span class="image-counter" id="imageCounter">1 de 10</span>
                        <button class="nav-btn" id="nextBtn" onclick="previewModal.navigate(1)">
                            Siguiente ▶️
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Asegura que el botón "Descargar todas" exista
     */
    ensureDownloadAllButton() {
        const actions = document.querySelector('.preview-actions');
        if (!actions) return;
        if (!actions.querySelector('.download-all')) {
            const btn = document.createElement('button');
            btn.className = 'preview-btn download-all';
            btn.textContent = '⬇️ Descargar Todas';
            btn.setAttribute('onclick', 'previewModal.downloadAll()');
            const downloadBtn = actions.querySelector('.preview-btn.download');
            if (downloadBtn) {
                downloadBtn.after(btn);
            } else {
                actions.prepend(btn);
            }
        }
    }

    /**
     * Abre el modal con una imagen específica
     * @param {string} category - Categoría de la imagen
     * @param {number} index - Índice de la imagen
     * @param {Array} images - Array de imágenes (opcional, usa carouselManager si no se proporciona)
     */
    open(category, index, images = null) {
        this.init();
        
        // Obtener imágenes del carouselManager si no se proporcionan
        if (!images && typeof carouselManager !== 'undefined') {
            images = carouselManager.getImages(category);
        }
        
        if (!images || images.length === 0) return;

        this.state = {
            currentCategory: category,
            currentIndex: index,
            images: images
        };

        this.updateContent();
        this.modal.classList.add('active');

        // Animación de apertura con anime.js
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.preview-modal',
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 400,
                easing: 'easeOutExpo'
            });
        }
        
        // Pausar carruseles
        if (typeof carouselManager !== 'undefined') {
            carouselManager.pauseAllCarousels();
        }
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }

    /**
     * Cierra el modal
     */
    close() {
        if (!this.modal) return;
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.preview-modal',
                opacity: [1, 0],
                scale: [1, 0.95],
                duration: 300,
                easing: 'easeInExpo',
                complete: () => {
                    this.modal.classList.remove('active');
                    this.resetZoom();
                }
            });
        } else {
            this.modal.classList.remove('active');
            this.resetZoom();
        }
        
        // Reanudar carruseles
        if (typeof carouselManager !== 'undefined') {
            carouselManager.resumeAllCarousels();
        }
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }

    /**
     * Actualiza el contenido del modal
     */
    updateContent() {
        const { currentIndex, images } = this.state;
        const image = images[currentIndex];

        if (!image) return;

        // Actualizar imagen con lazy loading via IntersectionObserver
        const imgElement = document.getElementById('previewImage');
        if (imgElement) {
            if (this.observer) {
                this.observer.disconnect();
            }
            imgElement.removeAttribute('src');
            imgElement.setAttribute('data-src', image.url);
            imgElement.alt = image.title;
            this.resetZoom();

            const container = document.querySelector('.preview-image-container');
            if (container && typeof IntersectionObserver !== 'undefined') {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const src = imgElement.getAttribute('data-src');
                            if (src) {
                                imgElement.src = src;
                                imgElement.removeAttribute('data-src');
                            }
                            this.observer.disconnect();
                        }
                    });
                }, { root: container, threshold: 0.1 });
                this.observer.observe(imgElement);
            } else {
                imgElement.src = image.url;
            }
        }

        // Actualizar información
        const titleEl = document.getElementById('previewImageTitle');
        if (titleEl) titleEl.textContent = image.title;
        
        const detailTitleEl = document.getElementById('previewDetailTitle');
        if (detailTitleEl) detailTitleEl.textContent = image.title;
        
        const catEl = document.getElementById('previewCategory');
        if (catEl) catEl.textContent = this.state.currentCategory || 'N/A';
        
        const seriesEl = document.getElementById('previewSeries');
        if (seriesEl) seriesEl.textContent = image.series || 'N/A';
        
        const volumeEl = document.getElementById('previewVolume');
        if (volumeEl) volumeEl.textContent = image.volume || 'N/A';
        
        const dateEl = document.getElementById('previewDate');
        if (dateEl) dateEl.textContent = image.timestamp?.toDate?.().toLocaleDateString('es-ES') || 'N/A';

        // Actualizar contador
        const counterEl = document.getElementById('imageCounter');
        if (counterEl) counterEl.textContent = `${currentIndex + 1} de ${images.length}`;

        // Actualizar estado de botones de navegación
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === images.length - 1;
    }

    /**
     * Navega entre imágenes
     * @param {number} direction - -1 para anterior, 1 para siguiente
     */
    navigate(direction) {
        const { currentIndex, images } = this.state;
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < images.length) {
            this.state.currentIndex = newIndex;
            this.updateContent();
        }
    }

    /**
     * Descarga la imagen actual
     */
    async download() {
        const { images, currentIndex } = this.state;
        const image = images[currentIndex];

        if (!image) return;

        try {
            if (typeof downloadImageWithFallback !== 'undefined') {
                const result = await downloadImageWithFallback(image.url, image.title);
                if (result.method === 'blob') {
                    if (typeof toast !== 'undefined') {
                        toast.success('Descarga iniciada');
                    } else {
                        showNotification('Descarga iniciada', 'success');
                    }
                } else {
                    if (typeof toast !== 'undefined') {
                        toast.info('Descarga iniciada (modo compatibilidad)');
                    } else {
                        showNotification('Descarga iniciada (modo compatibilidad)', 'info');
                    }
                }
            }
        } catch (error) {
            console.error('Error descargando imagen:', error);
            if (typeof toast !== 'undefined') {
                toast.error('Error al descargar la imagen');
            } else {
                showNotification('Error al descargar la imagen', 'error');
            }
        }
    }

    /**
     * Descarga todas las imágenes de la categoría actual
     */
    async downloadAll() {
        const { images, currentCategory } = this.state;
        if (typeof downloadGalleryCategory !== 'undefined') {
            await downloadGalleryCategory(images, currentCategory);
        } else {
            if (typeof toast !== 'undefined') {
                toast.error('Función de descarga masiva no disponible');
            } else {
                showNotification('Función de descarga masiva no disponible', 'error');
            }
        }
    }

    /**
     * Abre la imagen original en una nueva pestaña
     */
    viewOriginal() {
        const { images, currentIndex } = this.state;
        const image = images[currentIndex];

        if (!image) return;

        window.open(image.url, '_blank', 'noopener,noreferrer');
    }

    /**
     * Maneja eventos de teclado
     * @param {KeyboardEvent} e 
     */
    handleKeyboard(e) {
        if (!this.modal || !this.modal.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.navigate(-1);
                break;
            case 'ArrowRight':
                this.navigate(1);
                break;
        }
    }

    /**
     * Configura zoom/pan en la imagen
     */
    setupZoomPan() {
        const img = document.getElementById('previewImage');
        if (!img) return;

        img.style.cursor = 'zoom-in';
        img.style.transition = 'transform 0.3s ease';
        img.addEventListener('click', () => this.toggleZoom());

        // Pan con drag
        const container = document.querySelector('.preview-image-container');
        if (!container) return;

        container.addEventListener('mousedown', (e) => {
            if (!this.zoomed) return;
            this.pan.dragging = true;
            this.pan.startX = e.clientX - this.pan.x;
            this.pan.startY = e.clientY - this.pan.y;
            container.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.pan.dragging || !this.zoomed) return;
            e.preventDefault();
            this.pan.x = e.clientX - this.pan.startX;
            this.pan.y = e.clientY - this.pan.startY;
            this.applyTransform();
        });

        window.addEventListener('mouseup', () => {
            this.pan.dragging = false;
            if (container) container.style.cursor = this.zoomed ? 'grab' : 'zoom-in';
        });
    }

    /**
     * Alterna zoom en la imagen
     */
    toggleZoom() {
        const img = document.getElementById('previewImage');
        if (!img) return;

        this.zoomed = !this.zoomed;
        if (!this.zoomed) {
            this.resetZoom();
        } else {
            img.style.cursor = 'zoom-out';
            const container = document.querySelector('.preview-image-container');
            if (container) container.style.cursor = 'grab';
            this.applyTransform();
        }
    }

    /**
     * Aplica transform de zoom/pan
     */
    applyTransform() {
        const img = document.getElementById('previewImage');
        if (!img) return;
        const scale = this.zoomed ? 1.5 : 1;
        img.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${scale})`;
        img.style.transition = this.pan.dragging ? 'none' : 'transform 0.3s ease';
    }

    /**
     * Resetea zoom y pan
     */
    resetZoom() {
        this.zoomed = false;
        this.pan = { x: 0, y: 0, dragging: false, startX: 0, startY: 0 };
        const img = document.getElementById('previewImage');
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.transition = 'transform 0.3s ease';
            img.style.cursor = 'zoom-in';
        }
        const container = document.querySelector('.preview-image-container');
        if (container) container.style.cursor = 'default';
    }

    /**
     * Configura navegación por swipe en móvil
     */
    setupSwipe() {
        const modal = document.getElementById('previewModal');
        if (!modal) return;

        modal.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modal.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

    /**
     * Maneja swipe para navegación
     */
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const threshold = 50;

        if (deltaX > threshold) {
            this.navigate(-1);
        } else if (deltaX < -threshold) {
            this.navigate(1);
        }
    }
}

// Instancia global
const previewModal = new PreviewModal();

// Función global para compatibilidad
function openPreviewModal(category, index) {
    previewModal.open(category, index);
}

function closePreviewModal() {
    previewModal.close();
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PreviewModal, previewModal };
}
