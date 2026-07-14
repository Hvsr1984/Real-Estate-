/* js/services/search/searchService.js - Search Service Domain */

export class SearchService {
    /**
     * Haversine formula to compute distance between two coordinates in kilometers.
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }

    /**
     * Format distance (meters vs kilometers).
     */
    formatDistance(distInKm) {
        if (distInKm < 1) {
            return `${Math.round(distInKm * 1000)} m away`;
        } else if (distInKm < 10) {
            return `${distInKm.toFixed(1)} km away`;
        } else {
            return `${Math.round(distInKm)} km away`;
        }
    }

    /**
     * Fuzzy matching logic for parsing inputs.
     */
    fuzzyMatch(text, query) {
        if (!query) return true;
        if (!text) return false;

        const textLower = String(text).toLowerCase();
        const queryLower = String(query).toLowerCase();

        if (textLower.includes(queryLower)) return true;

        // Sequence fuzzy match check
        let queryIdx = 0;
        for (let i = 0; i < textLower.length; i++) {
            if (textLower[i] === queryLower[queryIdx]) {
                queryIdx++;
                if (queryIdx === queryLower.length) return true;
            }
        }
        return false;
    }

    saveSearchQuery(query) {
        const text = String(query).trim();
        if (!text) return;
        const list = this.getRecentSearches();
        const filtered = list.filter(item => item !== text);
        filtered.unshift(text);
        localStorage.setItem('recent_searches', JSON.stringify(filtered.slice(0, 5)));
    }

    getRecentSearches() {
        return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    }

    getPopularSearches() {
        return ['Villa with Infinity Pool', 'Worli Mumbai', 'DLF Camellias Gurgaon', 'UB City Bangalore'];
    }

    saveUserSearchConfiguration(name, filters) {
        const saved = JSON.parse(localStorage.getItem('saved_searches_db') || '[]');
        const record = {
            id: `search-${Date.now()}`,
            name,
            filters,
            createdAt: new Date().toISOString()
        };
        saved.push(record);
        localStorage.setItem('saved_searches_db', JSON.stringify(saved));
        return record;
    }

    getSavedSearchConfigurations() {
        return JSON.parse(localStorage.getItem('saved_searches_db') || '[]');
    }
}

export const searchService = new SearchService();
export default searchService;
