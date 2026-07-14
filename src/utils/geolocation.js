/* src/utils/geolocation.js - Geolocation and Proximity Services */

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0;
    
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
 * Formats a distance in kilometers or meters.
 */
export function formatDistance(distInKm) {
    if (distInKm === undefined || distInKm === null) return '';
    if (distInKm < 1) {
        return `${Math.round(distInKm * 1000)} m away`;
    } else {
        return `${distInKm.toFixed(1)} km away`;
    }
}

/**
 * Calculates travel duration estimate assuming city traffic speed (average 35 km/h).
 * Time in minutes = (Distance in km / 35) * 60 = Distance * 1.71 minutes.
 */
export function formatDuration(distInKm) {
    if (distInKm === undefined || distInKm === null) return '';
    const speedKmh = 30; // 30 km/h average city drive speed in India
    const timeHr = distInKm / speedKmh;
    const timeMin = Math.round(timeHr * 60);
    
    if (timeMin < 1) {
        return 'Less than a minute';
    } else if (timeMin < 60) {
        return `${timeMin} mins drive`;
    } else {
        const hrs = Math.floor(timeMin / 60);
        const mins = timeMin % 60;
        return `${hrs} hr ${mins} mins drive`;
    }
}

/**
 * Prompts user for browser geolocation and returns a Promise with coordinates.
 */
export function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    });
}
