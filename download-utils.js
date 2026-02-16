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
