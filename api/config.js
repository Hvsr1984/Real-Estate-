/* api/config.js - Vercel Serverless configuration endpoint */

export default function handler(request, response) {
    // Expose keys from environment variables securely at runtime
    response.status(200).json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
        firebaseApiKey: process.env.FIREBASE_API_KEY || "",
        geminiApiKey: process.env.GEMINI_API_KEY || ""
    });
}
