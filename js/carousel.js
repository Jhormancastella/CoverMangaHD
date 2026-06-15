/**
 * js/carousel.js - Carruseles con loop infinito sin rebobinado visible
 */

class CarouselManager {
    constructor() {
        this.carouselState = {
            portadas:    { currentIndex: 0, autoScroll: true, intervalId: null, images: [], realCount: 0 },
            separadores: { currentIndex: 0, autoScroll: true, intervalId: null, images: [], realCount: 0 },
            cubrepolvos: { currentIndex: 0, autoScroll: true, intervalId: null, images: [], realCount: 0 }
        };

        this.config = {
            autoScrollInterval:    4000,
            pauseAfterInteraction: 10000,
            maxImages:             10
        };

        // track jump-in-progress per category to suppress scroll listener during teleport
        this._jumping = {};
    }

    // ─── Auto-scroll ────────────────────────────────────────────────────────────

    startAutoScroll(category) {
        const state = this.carouselState[category];
        this.resetProgressBar(category);

        clearInterval(state.intervalId);
        state.intervalId = setInterval(() => {
            if (!state.autoScroll) return;
            this._advance(category, 1);
            this.resetProgressBar(category);
        }, this.config.autoScrollInterval);
    }

    /** Advance +1 or -1 using the infinite-clone technique */
    _advance(category, direction) {
        const slider = document.getElementById(`${category}-slider`);
        if (!slider) return;
        const state  = this.carouselState[category];
        const real   = state.realCount;
        if (real === 0) return;

        // currentIndex counts over the REAL items (0-based)
        state.currentIndex = (state.currentIndex + direction + real) % real;

        // In the DOM we have: [clone-last] [real-0..real-N] [clone-first]
        // real items sit at DOM positions 1 .. real (0-based offset by 1 clone)
        const domIndex = state.currentIndex + 1; // +1 because of leading clone
        this._scrollToDomIndex(category, slider, domIndex, 'smooth');
        this.updateIndicators(category, state.currentIndex);
    }

    _scrollToDomIndex(category, slider, domIndex, behavior) {
        const items = slider.querySelectorAll('.slider-item');
        if (!items[domIndex]) return;

        const item        = items[domIndex];
        const sliderW     = slider.clientWidth;
        const itemW       = item.offsetWidth;
        // center the item in the viewport
        const scrollLeft  = item.offsetLeft - (sliderW / 2) + (itemW / 2);

        slider.scrollTo({ left: scrollLeft, behavior });
    }

    // ─── Infinite clone setup ────────────────────────────────────────────────────

    /**
     * Sets up the infinite-scroll illusion by:
     * 1. Prepending a clone of the LAST real item
     * 2. Appending a clone of the FIRST real item
     * 3. Silently scrolling to the first real item (position 1) on init
     * 4. Listening for scroll-end to teleport when a clone is visible
     */
    _setupInfiniteScroll(category) {
        const slider = document.getElementById(`${category}-slider`);
        if (!slider) return;

        const state    = this.carouselState[category];
        const realItems = Array.from(slider.querySelectorAll('.slider-item'));
        const real      = realItems.length;
        if (real < 2) return; // no point looping a single item

        state.realCount = real;

        // Prepend clone of last item
        const cloneLast  = realItems[real - 1].cloneNode(true);
        cloneLast.setAttribute('aria-hidden', 'true');
        cloneLast.classList.add('slider-clone');
        slider.insertBefore(cloneLast, realItems[0]);

        // Append clone of first item
        const cloneFirst = realItems[0].cloneNode(true);
        cloneFirst.setAttribute('aria-hidden', 'true');
        cloneFirst.classList.add('slider-clone');
        slider.appendChild(cloneFirst);

        // Jump silently to item at DOM index 1 (first real item)
        requestAnimationFrame(() => {
            this._scrollToDomIndex(category, slider, 1, 'instant');

            // Listen for scroll stop → teleport if on a clone
            let scrollTimer = null;
            slider.addEventListener('scroll', () => {
                if (this._jumping[category]) return;
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => this._checkCloneJump(category, slider), 80);
            }, { passive: true });
        });
    }

    _checkCloneJump(category, slider) {
        const state    = this.carouselState[category];
        const real     = state.realCount;
        if (real === 0) return;

        const allItems = slider.querySelectorAll('.slider-item');
        // clone positions: 0 (last-clone) and real+1 (first-clone)
        const cloneLast  = allItems[0];
        const cloneFirst = allItems[real + 1];
        if (!cloneLast || !cloneFirst) return;

        const sliderW = slider.clientWidth;
        const scrollL = slider.scrollLeft;

        // Centre of viewport
        const center = scrollL + sliderW / 2;

        // If we're centred on the last-clone → jump to the real last item (DOM index `real`)
        const lastCloneCenter = cloneLast.offsetLeft + cloneLast.offsetWidth / 2;
        if (Math.abs(center - lastCloneCenter) < cloneLast.offsetWidth * 0.6) {
            this._jumping[category] = true;
            state.currentIndex = real - 1;
            this._scrollToDomIndex(category, slider, real, 'instant');
            this.updateIndicators(category, state.currentIndex);
            requestAnimationFrame(() => { this._jumping[category] = false; });
            return;
        }

        // If we're centred on the first-clone → jump to the real first item (DOM index 1)
        const firstCloneCenter = cloneFirst.offsetLeft + cloneFirst.offsetWidth / 2;
        if (Math.abs(center - firstCloneCenter) < cloneFirst.offsetWidth * 0.6) {
            this._jumping[category] = true;
            state.currentIndex = 0;
            this._scrollToDomIndex(category, slider, 1, 'instant');
            this.updateIndicators(category, state.currentIndex);
            requestAnimationFrame(() => { this._jumping[category] = false; });
        }
    }

    // ─── scrollToItem (public, called by indicators & touch) ────────────────────

    scrollToItem(category, realIndex) {
        const slider = document.getElementById(`${category}-slider`);
        if (!slider) return;
        const state = this.carouselState[category];
        const real  = state.realCount || (slider.querySelectorAll('.slider-item:not(.slider-clone)').length);

        realIndex = (realIndex + real) % real;
        state.currentIndex = realIndex;

        const domIndex = realIndex + 1; // +1 for leading clone
        this._scrollToDomIndex(category, slider, domIndex, 'smooth');
        this.updateIndicators(category, realIndex);
        this.resetProgressBar(category);
    }

    // ─── Indicators ─────────────────────────────────────────────────────────────

    updateIndicators(category, activeIndex) {
        const indicators = document.getElementById(`${category}-indicators`);
        if (!indicators) return;
        indicators.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
    }

    createIndicators(category, count) {
        const indicators = document.getElementById(`${category}-indicators`);
        if (!indicators) return;
        indicators.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            dot.addEventListener('click', () => {
                this.scrollToItem(category, i);
                this.pauseAutoScrollTemporarily(category);
            });
            indicators.appendChild(dot);
        }
    }

    // ─── Pause / Resume ──────────────────────────────────────────────────────────

    pauseAutoScrollTemporarily(category) {
        const state  = this.carouselState[category];
        state.autoScroll = false;
        this._updatePauseBtn(category, false);
        setTimeout(() => {
            if (!state.autoScroll) {
                state.autoScroll = true;
                this._updatePauseBtn(category, true);
            }
        }, this.config.pauseAfterInteraction);
    }

    toggleAutoScroll(category) {
        const state = this.carouselState[category];
        state.autoScroll = !state.autoScroll;
        this._updatePauseBtn(category, state.autoScroll);
    }

    _updatePauseBtn(category, playing) {
        const btn = document.querySelector(`[onclick="toggleAutoScroll('${category}')"]`);
        if (!btn) return;
        const span = btn.querySelector('[data-i18n]') || btn;
        if (playing) {
            span.textContent = '⏸ Pausar';
            btn.classList.add('active');
        } else {
            span.textContent = '▶ Reanudar';
            btn.classList.remove('active');
        }
    }

    pauseAllCarousels() {
        Object.keys(this.carouselState).forEach(cat => {
            this.carouselState[cat].autoScroll = false;
            this._updatePauseBtn(cat, false);
        });
    }

    resumeAllCarousels() {
        Object.keys(this.carouselState).forEach(cat => {
            if (!this.carouselState[cat].autoScroll) {
                this.carouselState[cat].autoScroll = true;
                this._updatePauseBtn(cat, true);
            }
        });
    }

    // ─── Load & Render ───────────────────────────────────────────────────────────

    async loadCategoryCarousel(category, db, onImageClick) {
        try {
            if (typeof firestoreCache !== 'undefined') {
                const cached = firestoreCache.get(`cmhd_cache_carousel_${category}`);
                if (cached) { this.renderCarousel(category, cached, onImageClick); return; }
            }

            const snapshot = await db.collection('imagenes')
                .where('category', '==', category)
                .orderBy('timestamp', 'desc')
                .limit(this.config.maxImages)
                .get();

            const slider = document.getElementById(`${category}-slider`);

            if (snapshot.empty) {
                slider.innerHTML = `
                    <div class="no-images-slider">
                        <h3>No hay ${category} disponibles</h3>
                        <p>Ve al panel de administración para agregar imágenes.</p>
                    </div>`;
                return;
            }

            const images = [];
            snapshot.forEach(doc => images.push(sanitizeImageRecord({ id: doc.id, ...doc.data() })));

            if (typeof firestoreCache !== 'undefined') {
                firestoreCache.set(`cmhd_cache_carousel_${category}`, images, 2 * 60 * 1000);
            }

            this.renderCarousel(category, images, onImageClick);

        } catch (error) {
            console.error(`❌ Error cargando ${category}:`, error);
            const slider = document.getElementById(`${category}-slider`);
            slider.innerHTML = `
                <div class="no-images-slider">
                    <h3>Error cargando ${category}</h3>
                    <button onclick="carouselManager.loadCategoryCarousel('${category}', db, openPreviewModal)" style="margin-top:10px;">🔄 Reintentar</button>
                </div>`;
        }
    }

    renderCarousel(category, images, onImageClick) {
        const slider = document.getElementById(`${category}-slider`);
        slider.innerHTML = '';

        this.carouselState[category].images    = images;
        this.carouselState[category].realCount = 0; // reset; set in _setupInfiniteScroll

        // Inject skeleton-shimmer style once
        if (!document.getElementById('skeleton-shimmer-style')) {
            const s = document.createElement('style');
            s.id = 'skeleton-shimmer-style';
            s.textContent = `
                @keyframes skeleton-shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                .skeleton-shimmer {
                    width:100%; height:100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.5s infinite;
                }
            `;
            document.head.appendChild(s);
        }

        // Render real items
        images.forEach((image, index) => {
            if (!image.url) return;

            const slide = document.createElement('div');
            slide.className = 'slider-item';

            const img = document.createElement('img');
            img.src     = image.url;
            img.alt     = image.title;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.cssText = 'opacity:0;transition:opacity 0.3s ease;';
            img.onload  = function () { this.style.opacity = '1'; };
            img.onerror = function () {
                this.src = 'data:image/svg+xml,' + encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="#ecf0f1" width="300" height="200"/><text fill="#7f8c8d" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">No disponible</text></svg>`
                );
                this.style.opacity = '1';
            };

            const info  = document.createElement('div');
            info.className = 'info';
            const title = document.createElement('h3');
            title.textContent = image.title;
            info.appendChild(title);
            if (image.series) {
                const s = document.createElement('p');
                s.textContent = `📚 ${image.series}`;
                info.appendChild(s);
            }
            if (image.volume) {
                const v = document.createElement('p');
                v.textContent = `📖 Vol. ${image.volume}`;
                info.appendChild(v);
            }

            slide.appendChild(img);
            slide.appendChild(info);

            if (onImageClick) {
                slide.addEventListener('click', () => onImageClick(category, index));
            }

            slider.appendChild(slide);
        });

        // Create indicators (count = real items only)
        this.createIndicators(category, images.length);

        // Set up infinite clone loop
        this._setupInfiniteScroll(category);

        // Touch swipe
        this.handleTouchSwipe(category);

        // Start auto-scroll
        this.startAutoScroll(category);
    }

    // ─── Touch swipe ────────────────────────────────────────────────────────────

    handleTouchSwipe(category) {
        const slider = document.getElementById(`${category}-slider`);
        if (!slider) return;

        let startX = 0, startY = 0, isH = false;

        slider.addEventListener('touchstart', e => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
            isH = false;
        }, { passive: true });

        slider.addEventListener('touchmove', e => {
            const dx = Math.abs(e.changedTouches[0].screenX - startX);
            const dy = Math.abs(e.changedTouches[0].screenY - startY);
            if (dx > dy && dx > 10) isH = true;
        }, { passive: true });

        slider.addEventListener('touchend', e => {
            const delta = e.changedTouches[0].screenX - startX;
            if (isH && Math.abs(delta) > 50) {
                this._advance(category, delta > 0 ? -1 : 1);
                this.pauseAutoScrollTemporarily(category);
            }
        }, { passive: true });
    }

    // ─── Progress bar ────────────────────────────────────────────────────────────

    addProgressBar(category) {
        const slider = document.getElementById(`${category}-slider`);
        if (!slider) return null;
        const container = slider.closest('.slider-container');
        if (!container) return null;
        let bar = container.querySelector('.progress-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.innerHTML = '<div class="progress-fill"></div>';
            const indicators = document.getElementById(`${category}-indicators`);
            if (indicators) indicators.after(bar);
            else container.appendChild(bar);
        }
        return bar;
    }

    resetProgressBar(category) {
        const bar = this.addProgressBar(category);
        if (!bar) return;
        const fill = bar.querySelector('.progress-fill');
        if (!fill) return;
        if (typeof anime !== 'undefined') {
            anime.remove(fill);
            anime({ targets: fill, width: ['0%', '100%'], duration: this.config.autoScrollInterval, easing: 'linear' });
        } else {
            fill.style.width = '0%';
            fill.style.transition = `width ${this.config.autoScrollInterval}ms linear`;
            requestAnimationFrame(() => { fill.style.width = '100%'; });
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    getImages(category)  { return this.carouselState[category]?.images || []; }
    getState(category)   { return this.carouselState[category]; }

    addDownloadButton(category, images) {
        const slider = document.getElementById(`${category}-slider`);
        const section = slider?.closest('.slider-section');
        if (!section) return;
        if (section.querySelector('.download-carousel-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'download-carousel-btn';
        btn.textContent = '⬇️ Descargar carrusel';
        btn.style.marginTop = '10px';
        btn.addEventListener('click', () => {
            if (typeof downloadGalleryCategory !== 'undefined') downloadGalleryCategory(images, category);
        });
        section.appendChild(btn);
    }
}

// ─── Global instance ─────────────────────────────────────────────────────────
const carouselManager = new CarouselManager();

function toggleAutoScroll(category) {
    carouselManager.toggleAutoScroll(category);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarouselManager, carouselManager };
}
