/* js/services/image/imagePipelineService.js - Client-Side Image Processing Pipeline */

export class ImagePipelineService {
    /**
     * Compress and convert image file to WebP base64 data URL.
     * @param {File} file - Original file uploaded
     * @param {number} maxWidth - Max width bound
     * @param {number} maxHeight - Max height bound
     * @param {number} quality - WebP compression ratio (0.0 to 1.0)
     * @param {function(progress: number)} onProgress - Progress reporter
     * @returns {Promise<string>} WebP data URL
     */
    async processImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.8, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (onProgress) onProgress(10); // file load initiated

            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (event) => {
                if (onProgress) onProgress(30); // base64 loaded, image parsing starting

                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    if (onProgress) onProgress(60); // image parsed, drawing on canvas

                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Maintain aspect ratio constraints
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    if (onProgress) onProgress(80); // compression conversion starts

                    // Convert to WebP format directly!
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    
                    if (onProgress) onProgress(100); // completed
                    resolve(dataUrl);
                };

                img.onerror = (err) => {
                    reject(new Error("Unable to parse image data format."));
                };
            };

            reader.onerror = (err) => {
                reject(new Error("Failed to read image upload payload."));
            };
        });
    }

    /**
     * Generate low-res thumbnail WebP from base64 WebP.
     */
    async generateThumbnail(base64Data, width = 300, height = 200, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Data;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                // Crop center fit
                const sourceRatio = img.width / img.height;
                const targetRatio = width / height;
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

                if (sourceRatio > targetRatio) {
                    sWidth = img.height * targetRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    sHeight = img.width / targetRatio;
                    sy = (img.height - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', quality));
            };
            img.onerror = (err) => reject(err);
        });
    }
}

export const imagePipelineService = new ImagePipelineService();
export default imagePipelineService;
