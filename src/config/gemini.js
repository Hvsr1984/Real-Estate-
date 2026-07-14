/* js/config/gemini.js - Gemini API Prompts & Settings */

export const GEMINI_CONFIG = {
    TEXT_MODEL: 'gemini-1.5-flash',
    VISION_MODEL: 'gemini-1.5-flash',
    API_URL: (key, model = 'gemini-1.5-flash') => 
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
};

export const PROMPTS = {
    GENERATE_PROPERTY_DETAILS: (specs) => `
You are an expert luxury real estate curator at LuxeHaven.
Generate an editorial listing for a property with these details:
- City: ${specs.city}
- Price: ${specs.price} ${specs.currency}
- Type: ${specs.type}
- Status: For ${specs.status}
- Bedrooms: ${specs.bedrooms}
- Bathrooms: ${specs.bathrooms}
- Area: ${specs.area} M²
- Amenities: ${specs.amenities.join(', ')}

Please return a valid JSON object matching this exact schema:
{
    "title": "A highly exclusive luxury name (e.g. The Planetarium Villa)",
    "description": "An editorial, poetic, high-end description focusing on luxury architecture and investment appeal (2-3 paragraphs)",
    "highlights": ["3-5 high-altitude bulleted highlights of the structure/assets"],
    "amenitiesSummary": "A short, elegant summary text of the amenities offered",
    "seoTitle": "A premium search-optimized title (under 60 chars)",
    "seoDescription": "A compelling meta description (under 160 chars)",
    "keywords": ["luxury", "real estate", "keywords"],
    "investmentSummary": "An insights-focused investment summary paragraph highlighting asset security and local indices",
    "rentalYield": 5.2,
    "roi": 6.5,
    "luxuryScore": 9.8
}
Do not return any markdown wraps or comments. Only raw JSON.
`,
    ANALYZE_IMAGE: `
Analyze this property image. Detect the presence of:
1. Swimming Pool
2. Garage
3. Kitchen
4. Garden
5. Balcony
6. Solar Panels
7. Fireplace
8. Luxury Interior

Return a valid JSON object showing booleans for detection (set to true only if confidence > 85%):
{
    "pool": boolean,
    "garage": boolean,
    "kitchen": boolean,
    "garden": boolean,
    "balcony": boolean,
    "solar_panels": boolean,
    "fireplace": boolean,
    "luxury_interior": boolean
}
Do not return markdown wraps or descriptions. Output ONLY raw JSON.
`
};
