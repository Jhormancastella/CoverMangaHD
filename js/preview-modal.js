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
        
        // Agregar eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
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
        
        this.modal.classList.remove('active');
        
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

        // Actualizar imagen
        const imgElement = document.getElementById('previewImage');
        imgElement.src = image.url;
        imgElement.alt = image.title;

        // Actualizar información
        document.getElementById('previewImageTitle').textContent = image.title;
        document.getElementById('previewDetailTitle').textContent = image.title;
        document.getElementById('previewCategory').textContent = this.state.currentCategory || 'N/A';
        document.getElementById('previewSeries').textContent = image.series || 'N/A';
        document.getElementById('previewVolume').textContent = image.volume || 'N/A';
        document.getElementById('previewDate').textContent = image.timestamp?.toDate?.().toLocaleDateString('es-ES') || 'N/A';

        // Actualizar contador
        document.getElementById('imageCounter').textContent = `${currentIndex + 1} de ${images.length}`;

        // Actualizar estado de botones de navegación
        document.getElementById('prevBtn').disabled = currentIndex === 0;
        document.getElementById('nextBtn').disabled = currentIndex === images.length - 1;
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
                        toast.success('✅ Descarga iniciada');
                    } else {
                        showNotification('✅ Descarga iniciada', 'success');
                    }
                } else {
                    if (typeof toast !== 'undefined') {
                        toast.info('ℹ️ Descarga iniciada (modo compatibilidad)');
                    } else {
                        showNotification('ℹ️ Descarga iniciada (modo compatibilidad)', 'info');
                    }
                }
            }
        } catch (error) {
            console.error('Error descargando imagen:', error);
            if (typeof toast !== 'undefined') {
                toast.error('❌ Error al descargar la imagen');
            } else {
                showNotification('❌ Error al descargar la imagen', 'error');
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
