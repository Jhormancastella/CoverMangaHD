function escapeHtml(value) {
    const str = String(value == null ? "" : value);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sanitizeText(value, maxLength = 180) {
    const trimmed = String(value == null ? "" : value).trim();
    return escapeHtml(trimmed.slice(0, maxLength));
}

function sanitizeCategory(value) {
    const category = String(value || "").toLowerCase();
    const allowed = ["portadas", "separadores", "cubrepolvos"];
    return allowed.includes(category) ? category : "";
}

function sanitizeImageUrl(url) {
    try {
        const parsed = new URL(String(url || ""), window.location.origin);
        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== "https:" && protocol !== "http:") return "";
        return parsed.href;
    } catch (error) {
        return "";
    }
}

function sanitizeImageRecord(record) {
    return {
        id: String(record && record.id ? record.id : ""),
        title: sanitizeText(record && record.title ? record.title : "Sin titulo", 120),
        url: sanitizeImageUrl(record && record.url ? record.url : ""),
        category: sanitizeCategory(record && record.category ? record.category : ""),
        series: sanitizeText(record && record.series ? record.series : "", 120),
        volume: sanitizeText(record && record.volume ? record.volume : "", 20),
        featured: !!(record && record.featured),
        type: sanitizeText(record && record.type ? record.type : "url", 30),
        timestamp: record ? record.timestamp : null
    };
}
