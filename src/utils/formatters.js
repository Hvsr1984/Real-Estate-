/* src/utils/formatters.js - Indian Formatting Utilities */

/**
 * Format numeric prices into Indian notation (Lakhs / Crores).
 * Example: 450000000 -> ₹45.00 Cr
 * Example: 9500000 -> ₹95.00 Lakh
 * @param {number} price 
 * @param {string} status 'Rent' or 'Buy'
 */
export function formatPrice(price, status = '') {
    if (!price || price <= 0) return 'Price on Request';
    
    const isRent = status === 'Rent' || (typeof status === 'string' && status.toLowerCase().includes('rent'));
    
    if (isRent) {
        if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} Lakh/mo`;
        }
        return `₹${price.toLocaleString('en-IN')}/mo`;
    } else {
        if (price >= 10000000) { // 1 Crore
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) { // 1 Lakh
            return `₹${(price / 100000).toFixed(2)} Lakh`;
        }
        return `₹${price.toLocaleString('en-IN')}`;
    }
}

/**
 * Format short/approx values for charts and dashboard cards.
 */
export function formatShortVal(val) {
    if (!val || val <= 0) return '₹0';
    if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(1)} Cr`;
    } else if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
}

/**
 * Format square feet area.
 */
export function formatArea(sqFt) {
    if (!sqFt) return 'N/A';
    return `${sqFt.toLocaleString('en-IN')} Sq Ft`;
}

/**
 * Format plot size in acres.
 */
export function formatPlot(acres) {
    if (!acres || acres <= 0) return 'N/A';
    return `${acres} Acres`;
}
