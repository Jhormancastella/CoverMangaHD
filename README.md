# 🎴 CoverMangaHD

## Url

<div align="center">

Explóralo y dime qué te parece.

[![Ver CoverMangaHD en Vivo](https://img.shields.io/badge/🎴_Ver_CoverMangaHD_En_Vivo-Click_Aquí-2EA043?style=for-the-badge&logo=google-chrome&logoColor=white)](https://jhormancastella.github.io/CoverMangaHD/)
</div>


## Portadas + Cubrepolvos y Separadores para Fans del Manga.

**-CoverMangaHD-** es un repositorio el cual no almacena las imagenes 
**portadas, cubrepolvos y separadores imprimibles** en alta calidad para preservar, restaurar o personalizar tus mangas, manhwas y novelas ligeras. Inspirado en [Mokuton Covers](https://mokuton.com/covers/index.php), pero con mejor organización, visualización interactiva y diseño adaptado a todos los dispositivos.

---

## 🚀 Características

- ✅ **PWA (Progressive Web App)** - Instalable en dispositivos móviles
- ✅ **Offline Support** - Funciona sin conexión gracias al Service Worker
- ✅ **Sistema de Caché** - Mejora el rendimiento con localStorage
- ✅ **Notificaciones Toast** - Feedback visual al usuario
- ✅ **SEO Optimizado** - Metadatos, JSON-LD, sitemap
- ✅ **Responsive Design** - Adaptado a todos los dispositivos
- ✅ **Accesibilidad** - ARIA labels, navegación por teclado
- ✅ **Código Modular** - CSS y JS organizados en archivos separados

---

## 📂 Estructura del Proyecto

```
CoverMangaHD/
├── index.html              # Página principal con carruseles
├── portadas.html           # Galería de portadas
├── separadores.html        # Galería de separadores
├── cubrepolvos.html        # Galería de cubre polvos
├── admin.html              # Panel de administración
├── style.css               # Estilos base
├── css/
│   ├── carousel.css        # Estilos del carrusel
│   ├── modal.css           # Estilos de modales
│   └── notifications.css   # Estilos de notificaciones toast
├── js/
│   ├── carousel.js         # Lógica de carruseles
│   ├── gallery.js          # Lógica de galerías
│   ├── preview-modal.js    # Modal de vista previa
│   ├── notifications.js    # Sistema de notificaciones
│   ├── cache.js            # Sistema de caché
│   └── admin-auth.js       # Autenticación admin
├── firebase-config.js      # Configuración de Firebase
├── security-utils.js       # Utilidades de seguridad
├── download-utils.js       # Utilidades de descarga
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── firestore.rules         # Reglas de Firestore
├── storage.rules           # Reglas de Storage
├── robots.txt              # Configuración para bots
└── sitemap.xml             # Mapa del sitio
```

---

## 🔧 Seguridad y Configuración de Admin

Este proyecto usa Firebase Auth para acceder al panel `admin.html`.

### Pasos de configuración:

1. Crea un usuario admin en Firebase Authentication (Email/Password).
2. Reemplaza el correo de allowlist en `firebase-config.js`:
   ```javascript
   ADMIN_CONFIG.allowlist = ["tu_correo_admin@dominio.com"]
   ```
3. Publica reglas de Firestore usando `firestore.rules`.
4. Publica reglas de Storage usando `storage.rules`.

### Recomendaciones de seguridad:

- Configura restricciones de dominio en Firebase Console
- Considera usar Firebase App Check para evitar abuso
- En producción, usa Firebase Custom Claims en lugar de email allowlist

---

## 📥 Descarga de Imágenes (UX)

El botón de descarga implementa un sistema inteligente:

1. **Intenta primero descarga real por `blob`** (mejor experiencia)
2. **Si el origen bloquea CORS**, usa un fallback de enlace directo

Esto mejora compatibilidad entre navegadores y distintos hostings de imágenes.

---

## 🔍 SEO e Indexación en Google

### Archivos SEO incluidos:

- `robots.txt` - Control de indexación
- `sitemap.xml` - Mapa del sitio
- Metadatos `title`, `description`, `canonical`, Open Graph y Twitter
- Datos estructurados JSON-LD (WebSite, Organization, CollectionPage)
- `admin.html` marcado con `noindex`

### Pasos para completar en Google:

1. Publica/deploya los cambios.
2. Abre [Google Search Console](https://search.google.com/search-console) y verifica la propiedad.
3. En Search Console, envía este sitemap:
   ```
   https://jhormancastella.github.io/CoverMangaHD/sitemap.xml
   ```
4. Usa "Inspección de URL" y solicita indexación para cada página.

---

## ✨ ¿Por qué CoverManga?

El nombre directo lo que se quiere lograr es que los fans del manga tengan en su mejor estado sus mangas y demás colecciones.

---

## 🎯 Características y Beneficios

| Característica                  | Beneficio                                             |
| --------------------------------|------------------------------------------------------ |
| 🖼️ **Portadas HD**             | Restaura ediciones dañadas o personaliza tu colección |
| 🛡️ **Cubrepolvos imprimibles** | Protege tomos del polvo y desgaste diario             |
| 📏 **Separadores cada manga**  | Ordena tu colección con estilo y coherencia           |
| ↺ **Multi-formato**            | Compatible con manga, manhwa y novelas ligeras        |
| 🎨 **Recursos editables**      | Personaliza a tu gusto con PSD y AI                   |

---

## 🌐 Inspiración Visual

CoverMangaHD toma lo mejor de [Mokuton Covers](https://mokuton.com/covers/index.php) y lo eleva con:

* ✅ **Navegación intuitiva** por series y categorías
* ✅ **Previsualizaciones interactivas de portadas**
* ✅ **Sistema de búsqueda inteligente**
* ✅ **Diseño responsive** (móvil y escritorio)
* ✅ **Paleta de colores moderna y elegante**

---

## 📈 Tecnologías Utilizadas

### Frontend
- HTML5 semántico
- CSS3 con variables CSS
- JavaScript ES6+ modular
- PWA (Service Worker, Web App Manifest)

### Backend & Database
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Herramientas
- GitHub Pages (hosting)
- Google Search Console (SEO)

---

## 🌈 Estilo Visual (Guía de Diseño)

### Paleta principal:

* Fondo claro: `#f8f9fa`
* Primario: `#2c3e50`
* Secundario: `#3498db`
* Acento: `#e74c3c`
* Texto: `#333`

### Tipografía:

* Títulos: Segoe UI Bold
* Texto general: Segoe UI

---

## 📱 PWA Installation

CoverMangaHD se puede instalar como una aplicación en tu dispositivo:

1. Visita el sitio en Chrome o Edge
2. Haz clic en el icono de instalación en la barra de direcciones
3. O usa el menú "Instalar aplicación"

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Jhorman Jesús Castellanos Morales**

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella! ⭐**

</div>
