# 🎴 CoverMangaHD.

## Url

<div align="center">

Explóralo y dime qué te parece.

[![Ver CoverMangaHD en Vivo](https://img.shields.io/badge/🎴_Ver_CoverMangaHD_En_Vivo-Click_Aquí-2EA043?style=for-the-badge&logo=google-chrome&logoColor=white)](https://jhormancastella.github.io/CoverMangaHD/)
</div>


## Portadas + Cubrepolvos y Separadores para Fans del Manga.

**-CoverMangaHD-** es un repositorio el cual no almacena las imagenes 
**portadas, cubrepolvos y separadores imprimibles** en alta calidad para preservar, restaurar o personalizar tus mangas, manhwas y novelas ligeras. Inspirado en [Mokuton Covers](https://mokuton.com/covers/index.php), pero con mejor organización, visualización interactiva y diseño adaptado a todos los dispositivos.

---

## Seguridad y configuracion de Admin (actualizado)

Este proyecto ahora usa Firebase Auth para acceder al panel `admin.html`.

1. Crea un usuario admin en Firebase Authentication (Email/Password).
2. Reemplaza el correo de allowlist en `firebase-config.js`:
   - `ADMIN_EMAIL_ALLOWLIST = ["tu_correo_admin@dominio.com"]`
3. Publica reglas de Firestore usando `firestore.rules`.
4. Publica reglas de Storage usando `storage.rules`.

Reglas recomendadas:

- Lectura publica de imagenes.
- Escritura solo para usuarios autenticados y autorizados como admin.
- Validacion de categorias permitidas.
- Validacion de tamano/tipo MIME en Storage.

## Descarga de imagenes (UX)

El boton de descarga ahora intenta primero descarga real por `blob` (mejor experiencia).
Si el origen bloquea CORS o no permite blob directo, usa un fallback de enlace directo.
Esto mejora compatibilidad entre navegadores y distintos hostings de imagenes.

## SEO e indexacion en Google (actualizado)

Archivos SEO agregados al proyecto:

- `robots.txt`
- `sitemap.xml`
- Metadatos `title`, `description`, `canonical`, Open Graph y Twitter en paginas publicas
- Datos estructurados JSON-LD en pagina principal y colecciones
- `admin.html` marcado con `noindex`

Pasos para completar en Google:

1. Publica/deploya los cambios.
2. Abre Google Search Console y verifica la propiedad:
   - `https://jhormancastella.github.io/CoverMangaHD/`
3. En Search Console, envia este sitemap:
   - `https://jhormancastella.github.io/CoverMangaHD/sitemap.xml`
4. Usa "Inspeccion de URL" y solicita indexacion para:
   - `/`
   - `/portadas.html`
   - `/separadores.html`
   - `/cubrepolvos.html`

## ✨ ¿Por qué -CoverManga- ?
- el nombre directo lo que se quiere logar 
es que los fans del manga tenga en su mejor estado sus mangas y demas colecciones.

---
## Característica y Beneficio.

| Característica                  | Beneficio                                             |
| --------------------------------|------------------------------------------------------ |
| 🖼️ **Portadas HD**             | Restaura ediciones dañadas o personaliza tu colección |
| 🛡️ **Cubrepolvos imprimibles** | Protege tomos del polvo y desgaste diario             |
| 📏 **Separadores cada manga**  | Ordena tu colección con estilo y coherencia           |
| ↺ **Multi-formato**            | Compatible con manga, manhwa y novelas ligeras        |
| 🎨 **Recursos editables**      | Personaliza a tu gusto con PSD y AI                   |

---

## 🌐 Inspiración Visual

CoverManga+ toma lo mejor de [Mokuton Covers](https://mokuton.com/covers/index.php) y lo eleva con:

* ✅ **Navegación intuitiva** por series y categorías
* ✅ **Previsualizaciones interactivas de portadas**
* ✅ **Sistema de búsqueda inteligente**
* ✅ **Diseño responsive** (móvil y escritorio)
* ✅ **Paleta de colores moderna y elegante**

---

## 📂 Estructura del Repositorio

```bash
CoverManga+/
├── manga/               # Portadas de manga japonés
│   ├── one-piece/
│   │   ├── vol-1.jpg
│   │   ├── vol-1.psd
│   │   └── ComoUsar.jpg
│   └── attack-on-titan/
├── manhwa/              # Recursos para manhwa coreano
├── light-novels/        # Cubiertas para novelas ligeras
├── cubrepolvos/         # Cubrepolvos universales
├── separadores/         # Separadores de hojas
└── uploads/             # Archivos enviados por la comunidad
```

---

## 🎡 Próximamente en la Web

### 📢 Bienvenida

Al ingresar, el usuario verá una pantalla de bienvenida con una descripción corta del proyecto.

### 🔻 Navegación (Escritorio)

* **Inicio**: portada y novedades
* **Categorías**:
  * Manga
  * Manhwa
  * Novelas Ligeras
* **Sobre CoverManga+**: información y misión del proyecto.
  
* **Aporta o Solicita**: formulario para subir portadas o hacer peticiones

### 🌎 Navegación (Móvil)

* Menú hamburguesa con las mismas opciones anteriores

### 🔍 Dentro de cada categoría

* **Filtros por nombre, género, tipo o idioma**
* Ejemplo: en *Manga* se puede buscar por nombre o filtrar por *Shōnen*, *Isekai*, etc.
* Cada portada se podrá previsualizar y descargar en varios formatos

---

## 📈 Tecnologías a utilizar (fase web) / actualmente solo local para pruebas.

* **Frontend**: HTML, CSS, JavaScript (y opcionalmente Tailwind)
* **Backend**: Java + Spring Boot (con API REST)
* **Base de datos**: H2 en local, PostgreSQL para producción / actualmente solo local para pruebas.

---

## 🌈 Estilo visual (guía de diseño)

* **Paleta principal:**

  * Fondo oscuro: `#1E1E2F`
  * Acento rosa: `#FF69B4`
  * Texto claro: `#FFFFFF`
  * Detalles en violeta: `#8A2BE2`

* **Tipografía:**

  * Títulos: *"Bebas Neue", sans-serif*
  * Texto general: *"Inter", sans-serif*

---
