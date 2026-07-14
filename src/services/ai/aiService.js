/* js/services/ai/aiService.js - Gemini AI Service Domain */

import { GEMINI_CONFIG, PROMPTS } from '../../config/gemini.js';
import { getGeminiApiKey } from '../../config/environment.js';

export class AIService {
    constructor() {
        this.fallbackDescriptions = [
            {
                title: "The Celestial Travertine Villa",
                description: "Rising on the cliffs, this architectural wonder blends solid travertine structures with floating glass partitions. Designed by SAOTA, it captures sweeping coastal ocean views and features dual-level zero-edge swimming pools, a private wellness spa salon, soundproof media suite, and bespoke Italian furnishings.",
                highlights: ["SAOTA architectural masterpiece", "Double-height travertine columns", "Zero-edge private pools", "Fully integrated automation"],
                amenitiesSummary: "Equipped with an infinity pool, wellness sauna, home theater, and intelligent automation systems."
            },
            {
                title: "Aurelia Skyline Residence",
                description: "Centrally positioned in the upper stratosphere of Roppongi, the Aurelia Skyline Residence is a masterclass in minimalist design. It hosts custom Japanese onsen elements, white oak flooring, double-height acoustic glass panels, and private express elevator transit access.",
                highlights: ["High-speed private elevator access", "Panoramic metropolitan sunset views", "Private wellness wooden onsen", "Acoustic noise dampening partitions"],
                amenitiesSummary: "Boasts a rooftop onsen pool, soundproof lounge, 24/7 concierge, and secure private parking."
            }
        ];
    }

    /**
     * Generate luxury property description details using Gemini API or Fallback.
     */
    async generatePropertyDetails(specs) {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            console.log("[AIService] Gemini API key not found. Using high-end template generator fallback.");
            return this._getMockTextResponse(specs);
        }

        const url = GEMINI_CONFIG.API_URL(apiKey, GEMINI_CONFIG.TEXT_MODEL);
        const prompt = PROMPTS.GENERATE_PROPERTY_DETAILS(specs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini Text API returned status code ${response.status}`);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return JSON.parse(textContent);
        } catch (error) {
            console.warn("[AIService] Gemini API request failed. Falling back to templates.", error);
            return this._getMockTextResponse(specs);
        }
    }

    /**
     * Classify image content (detect pool, garage, fireplace, garden, etc.)
     */
    async analyzePropertyImage(base64ImageWithMime) {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            console.log("[AIService] Gemini API key missing. Mocking image vision detection values.");
            return this._getMockVisionResponse();
        }

        // Split data URL to grab mime type and raw base64 data
        const matches = base64ImageWithMime.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!matches) {
            throw new Error("Invalid base64 image data payload format.");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const url = GEMINI_CONFIG.API_URL(apiKey, GEMINI_CONFIG.VISION_MODEL);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: PROMPTS.ANALYZE_IMAGE },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini Vision API returned status ${response.status}`);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return JSON.parse(textContent);
        } catch (error) {
            console.warn("[AIService] Gemini Vision analysis failed. Using defaults.", error);
            return this._getMockVisionResponse();
        }
    }

    _getMockTextResponse(specs) {
        // Select template randomly or based on property type
        const template = specs.type === 'Apartment' ? this.fallbackDescriptions[1] : this.fallbackDescriptions[0];
        
        return {
            title: template.title,
            description: template.description,
            highlights: template.highlights,
            amenitiesSummary: template.amenitiesSummary,
            seoTitle: `${template.title} for ${specs.status} | LuxeHaven`,
            seoDescription: `${template.title} at ${specs.city}. Curated luxury space priced at ${specs.price} ${specs.currency}. View details.`,
            keywords: ["luxury residence", specs.city.toLowerCase(), specs.type.toLowerCase(), "luxehaven"],
            investmentSummary: `This high-tier ${specs.type} offers exceptional long-term liquidity index and consistent capital appreciation, with an projected ROI of 6.2%.`,
            rentalYield: specs.status === 'Rent' ? 6.4 : 5.1,
            roi: 6.8,
            luxuryScore: 9.7
        };
    }

    _getMockVisionResponse() {
        // Simulate detection values with high confidence
        return {
            pool: Math.random() > 0.5,
            garage: Math.random() > 0.4,
            kitchen: true,
            garden: Math.random() > 0.6,
            balcony: Math.random() > 0.3,
            solar_panels: Math.random() > 0.8,
            fireplace: Math.random() > 0.7,
            luxury_interior: true
        };
    }
}

export const aiService = new AIService();
export default aiService;
