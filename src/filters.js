/* js/filters.js - Search input and tag validation utilities */

export function sanitizeSearchQuery(query) {
    if (!query) return '';
    return query.trim().replace(/[|&;$%@"<>()+,]/g, "").toLowerCase();
}

export function formatRegionName(cityName) {
    if (!cityName) return '';
    return cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
}
