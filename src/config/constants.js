/* js/config/constants.js - Enterprise Static Constants & Enums */

export const PROPERTY_TYPES = {
    VILLA: 'Villa',
    APARTMENT: 'Apartment',
    PENTHOUSE: 'Penthouse',
    COMMERCIAL: 'Commercial',
    LAND: 'Land'
};

export const LISTING_STATUSES = {
    BUY: 'Buy',
    RENT: 'Rent'
};

export const CONSTRUCTION_STATUSES = {
    READY: 'Ready',
    UNDER_CONSTRUCTION: 'Under Construction'
};

export const SUBMISSION_STATUSES = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DRAFT: 'Draft',
    ARCHIVED: 'Archived',
    SOLD: 'Sold',
    RENTED: 'Rented'
};

export const BADGE_TYPES = {
    VERIFIED: 'Verified Listing',
    PREMIUM: 'Premium Listing',
    FEATURED: 'Featured Listing',
    TRUSTED: 'Trusted Agent'
};

export const COLLECTIONS = {
    PROPERTIES: 'properties',
    SUBMISSIONS: 'property_submissions',
    AGENTS: 'agents',
    USERS: 'users',
    REVIEWS: 'reviews',
    FAVORITES: 'favorites',
    BOOKINGS: 'bookings',
    INQUIRIES: 'inquiries',
    BLOGS: 'blogs',
    NOTIFICATIONS: 'notifications',
    AUDIT_LOGS: 'audit_logs',
    VERSIONS: 'property_versions'
};

export const MAP_DEFAULTS = {
    DEFAULT_CENTER: [19.0760, 72.8777], // Mumbai, India
    DEFAULT_ZOOM: 11,
    HQ_COORDINATES: [19.0150, 72.8180] // Worli, Mumbai
};

export const UPLOAD_LIMITS = {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};
