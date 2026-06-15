# 🎴 CoverMangaHD

<div align="center">

[![Ver CoverMangaHD en Vivo](https://img.shields.io/badge/🎴_Ver_CoverMangaHD_En_Vivo-Click_Aquí-2EA043?style=for-the-badge&logo=google-chrome&logoColor=white)](https://covermangahd.qd.je/)

**Portadas · Cubrepolvos · Separadores para fans del manga**

</div>

---

## ¿Qué es CoverMangaHD?

**CoverMangaHD** es una galería web de recursos imprimibles en alta calidad para coleccionistas de manga, manhwa y novelas ligeras. Permite descargar portadas, cubrepolvos y separadores para restaurar, personalizar o mejorar tus colecciones físicas.

Inspirado en [Mokuton Covers](https://mokuton.com/covers/index.php), pero con mejor organización, diseño moderno y experiencia interactiva.

---

## 🚀 Características

| Característica | Detalle |
|---|---|
| **PWA** | Instalable en móvil y escritorio |
| **Offline** | Service Worker con estrategia Stale-While-Revalidate |
| **Modo claro / oscuro** | Toggle en header, persiste en localStorage |
| **Idioma ES / EN** | Switch en header, i18n completo |
| **Marquee 3 columnas** | Animación CSS pura por categoría, hover pausa |
| **Preview modal** | Zoom, pan, navegación ←→, descarga, swipe táctil |
| **Búsqueda** | Debounce, filtra en tiempo real |
| **Caché inteligente** | localStorage con TTL, limpieza automática |
| **SEO** | Canonical, Open Graph, Twitter Card, JSON-LD |
| **Accesibilidad** | ARIA labels, navegación por teclado |
| **Auto-actualización** | SW notifica y recarga cuando hay nueva versión |

---

## 🌐 URL del sitio

```
https://covermangahd.qd.je/
```

### Páginas

| Página | URL |
|---|---|
| Inicio | https://covermangahd.qd.je/ |
| Portadas | https://covermangahd.qd.je/portadas.html |
| Separadores | https://covermangahd.qd.je/separadores.html |
| Cubre Polvos | https://covermangahd.qd.je/cubrepolvos.html |
| Admin *(privado)* | https://covermangahd.qd.je/admin.html |

---

## 📂 Estructura del proyecto

```
CoverMangaHD/
├── index.html              # Inicio — hero + marquee 3 columnas
├── portadas.html           # Galería de portadas
├── separadores.html        # Galería de separadores
├── cubrepolvos.html        # Galería de cubre polvos
├── admin.html              # Panel de administración (privado)
├── test-marquee.html       # Página de prueba del marquee
│
├── style.css               # Variables CSS tema claro/oscuro + componentes
├── css/
│   ├── animations.css      # Keyframes y clases .animate-*
│   ├── carousel.css        # Estilos carrusel horizontal (galerías)
│   ├── modal.css           # Admin modal + preview modal
│   └── notifications.css   # Toast notifications
│
├── js/
│   ├── carousel.js         # CarouselManager — infinite loop sin rebobinado
│   ├── gallery.js          # GalleryManager — búsqueda, caché, lazy load
│   ├── preview-modal.js    # PreviewModal — zoom, pan, descarga, swipe
│   ├── notifications.js    # ToastNotification — success/error/warning/info
│   ├── cache.js            # FirestoreCache — localStorage con TTL
│   └── admin-auth.js       # AdminAuth — Firebase Auth, allowlist
│
├── firebase-config.js      # Config Firebase + helpers auth
├── security-utils.js       # Sanitización XSS, validación de datos
├── download-utils.js       # Descarga individual y masiva (JSZip)
│
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker — caché + auto-update
├── firestore.rules         # Reglas Firestore (lectura pública, escritura admin)
├── storage.rules           # Reglas Storage (max 15MB, solo imágenes)
├── robots.txt              # /admin.html bloqueado a crawlers
├── sitemap.xml             # Mapa del sitio
└── CNAME                   # Dominio personalizado
```

---

## � Configuración de Admin

El panel `/admin.html` está protegido con Firebase Auth.

1. Crea un usuario en Firebase Authentication (Email/Password)
2. Agrega el correo a la allowlist en `firebase-config.js`:
   ```javascript
   ADMIN_CONFIG.allowlist = ["tu_correo@dominio.com"]
   ```
3. Despliega las reglas de Firestore y Storage:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

> En producción se recomienda migrar a Firebase Custom Claims en lugar de email allowlist.

---

## 🔄 Actualización automática

El Service Worker usa `CACHE_VERSION` para invalidar caché en todos los usuarios al hacer deploy.

Para forzar recarga en todos los clientes, incrementa la versión en `sw.js`:

```js
const CACHE_VERSION = 'v7'; // era v6 → cambiar a v7
```

Al detectar un nuevo SW, la página recarga automáticamente sin que el usuario haga nada.

---

## � Tecnologías

### Frontend
- HTML5 semántico + Tailwind CSS (CDN)
- CSS3 con variables (`--var`) para tema claro/oscuro
- JavaScript ES6+ modular
- Anime.js para animaciones de entrada
- PWA — Service Worker + Web App Manifest

### Backend & Database
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Hosting
- GitHub Pages con dominio personalizado (`covermangahd.qd.je`)

---

## 🎨 Diseño

### Tema oscuro (default)
- Fondo: `#0f172a` (slate-900)
- Superficie: `#1e293b` (slate-800)
- Acento: `#f43f5e` (rose-500)

### Tema claro
- Fondo: `#f8fafc`
- Superficie: `#ffffff`
- Acento: `#e11d48` (rose-600)

### Tipografía
- Títulos: **Poppins** (600–800)
- Texto: **Inter** (400–600)

---

## 📱 Instalar como PWA

1. Abre [covermangahd.qd.je](https://covermangahd.qd.je/) en Chrome o Edge
2. Haz clic en el ícono de instalación en la barra de direcciones
3. O: menú del navegador → "Instalar aplicación"

---

## 🔍 SEO

- `sitemap.xml` enviado a Google Search Console: `https://covermangahd.qd.je/sitemap.xml`
- Canonical, Open Graph y Twitter Card en todas las páginas
- JSON-LD structured data (WebSite, Organization, CollectionPage)
- `/admin.html` marcado con `noindex, nofollow`

---

## 👤 Autor

**Jhorman Jesús Castellanos Morales**

---

<div align="center">

⭐ Si te gusta el proyecto, dale una estrella ⭐

</div>
