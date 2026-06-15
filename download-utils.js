function toSafeFilename(baseName, extension) {
    const safeBase = String(baseName || "imagen")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80) || "imagen";

    const ext = String(extension || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    return `${safeBase}.${ext}`;
}

function inferExtensionFromUrl(url) {
    try {
        const parsed = new URL(url);
        const match = parsed.pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
        return match ? match[1].toLowerCase() : "jpg";
    } catch (error) {
        return "jpg";
    }
}

async function downloadImageWithFallback(imageUrl, title) {
    const safeUrl = sanitizeImageUrl(imageUrl);
    if (!safeUrl) {
        throw new Error("La URL de la imagen no es valida.");
    }

    const fileName = toSafeFilename(title, inferExtensionFromUrl(safeUrl));

    try {
        const response = await fetch(safeUrl, { method: "GET", mode: "cors" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return { method: "blob" };
    } catch (error) {
        const directLink = document.createElement("a");
        directLink.href = safeUrl;
        directLink.download = fileName;
        directLink.target = "_blank";
        directLink.rel = "noopener noreferrer";
        document.body.appendChild(directLink);
        directLink.click();
        document.body.removeChild(directLink);
        return { method: "direct" };
    }
}

async function loadJSZip() {
    if (typeof JSZip !== 'undefined') return JSZip;
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return JSZip;
}

async function downloadImageWithProgress(url, title, onProgress) {
    const safeUrl = sanitizeImageUrl(url);
    if (!safeUrl) {
        throw new Error("La URL de la imagen no es valida.");
    }

    const fileName = toSafeFilename(title, inferExtensionFromUrl(safeUrl));

    if (typeof onProgress === 'function') {
        onProgress(0, 'fetching');
    }

    try {
        const response = await fetch(safeUrl, { method: "GET", mode: "cors" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (typeof onProgress === 'function') {
            onProgress(50, 'processing');
        }

        const blob = await response.blob();

        if (typeof onProgress === 'function') {
            onProgress(90, 'processing');
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        if (typeof onProgress === 'function') {
            onProgress(100, 'done');
        }

        return { method: "blob", fileName };
    } catch (error) {
        const directLink = document.createElement("a");
        directLink.href = safeUrl;
        directLink.download = fileName;
        directLink.target = "_blank";
        directLink.rel = "noopener noreferrer";
        document.body.appendChild(directLink);
        directLink.click();
        document.body.removeChild(directLink);

        if (typeof onProgress === 'function') {
            onProgress(100, 'done');
        }

        return { method: "direct", fileName };
    }
}

async function downloadMultipleAsZip(images, zipName, onProgress) {
    if (!images || images.length === 0) {
        throw new Error("No hay imágenes para descargar.");
    }

    const JSZipLib = await loadJSZip();
    const zip = new JSZipLib();

    const total = images.length;
    let completed = 0;

    for (let i = 0; i < images.length; i++) {
        const { url, title } = images[i];
        const safeUrl = sanitizeImageUrl(url);
        if (!safeUrl) continue;

        try {
            const response = await fetch(safeUrl, { method: "GET", mode: "cors" });
            if (!response.ok) continue;

            const blob = await response.blob();
            const ext = inferExtensionFromUrl(safeUrl);
            const safeName = toSafeFilename(`${title || 'imagen'}_${i + 1}`, ext);
            zip.file(safeName, blob);
        } catch (error) {
            console.warn(`Error descargando imagen para ZIP: ${url}`, error);
        }

        completed++;
        if (typeof onProgress === 'function') {
            const percent = Math.round((completed / total) * 100);
            onProgress(percent, completed, total);
        }
    }

    if (completed === 0) {
        throw new Error("No se pudo descargar ninguna imagen para el ZIP.");
    }

    if (typeof onProgress === 'function') {
        onProgress(95, completed, total);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const blobUrl = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${toSafeFilename(zipName, 'zip')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    if (typeof onProgress === 'function') {
        onProgress(100, completed, total);
    }

    return { downloaded: completed, total, zipName };
}

async function downloadGalleryCategory(images, categoryName) {
    if (!images || images.length === 0) {
        if (typeof toast !== 'undefined') {
            toast.error('No hay imágenes para descargar en esta categoría.');
        } else {
            showNotification('No hay imágenes para descargar en esta categoría.', 'error');
        }
        return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const zipName = `${categoryName || 'categoria'}_${dateStr}`;

    if (typeof toast !== 'undefined') {
        toast.info(`Iniciando descarga de ${images.length} imágenes...`);
    } else {
        showNotification(`Iniciando descarga de ${images.length} imágenes...`, 'info');
    }

    try {
        await downloadMultipleAsZip(images, zipName, (percent, current, total) => {
            if (typeof toast !== 'undefined' && percent % 20 === 0) {
                toast.info(`Progreso ZIP: ${percent}% (${current}/${total})`);
            }
        });

        if (typeof toast !== 'undefined') {
            toast.success(`ZIP descargado: ${zipName}.zip`);
        } else {
            showNotification(`ZIP descargado: ${zipName}.zip`, 'success');
        }
    } catch (error) {
        console.error('Error descargando ZIP:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Error al crear el ZIP: ' + error.message);
        } else {
            showNotification('Error al crear el ZIP: ' + error.message, 'error');
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toSafeFilename,
        inferExtensionFromUrl,
        downloadImageWithFallback,
        loadJSZip,
        downloadImageWithProgress,
        downloadMultipleAsZip,
        downloadGalleryCategory
    };
}
