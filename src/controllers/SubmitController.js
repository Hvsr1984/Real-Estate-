/* js/controllers/SubmitController.js - UI controller for property listing submissions */

import { propertyService } from '../services/property/propertyService.js';
import { aiService } from '../services/ai/aiService.js';
import { imagePipelineService } from '../services/image/imagePipelineService.js';
import { mapsService } from '../services/maps/mapsService.js';
import { jobQueue } from '../core/jobQueue.js';
import { showToast } from '../app.js';
import { ROUTES } from '../config/routes.js';

export class SubmitController {
    constructor() {
        this.uploadedImages = []; // Array of WebP base64 data URLs
        this.mapId = 'submit-location-map';
        this.mapMarker = null;
    }

    async init() {
        // 1. Initialize location picker map
        await this.initLocationPickerMap();

        // 2. Bind Drag & Drop uploads
        this.initDragAndDrop();

        // 3. Bind AI helper services
        this.initAIServiceBindings();

        // 4. Bind Form Submission
        this.bindFormSubmission();
    }

    async initLocationPickerMap() {
        const container = document.getElementById(this.mapId);
        if (!container) return;

        try {
            const mapInstance = await mapsService.initMap(this.mapId, { lat: 34.0522, lng: -118.2437 }, 10);
            if (!mapInstance) return;

            mapsService.loadGoogleMaps().then(maps => {
                // Drop initial marker
                this.mapMarker = new maps.Marker({
                    position: { lat: 34.0522, lng: -118.2437 },
                    map: mapInstance,
                    draggable: true,
                    title: "Drag to property location"
                });

                // Update inputs on drag end
                this.mapMarker.addListener('dragend', () => {
                    const pos = this.mapMarker.getPosition();
                    this.updateLatLngFields(pos.lat(), pos.lng());
                });

                // Update inputs on map click
                mapInstance.addListener('click', (e) => {
                    this.mapMarker.setPosition(e.latLng);
                    this.updateLatLngFields(e.latLng.lat(), e.latLng.lng());
                });

                // Hook up geocoding location search
                const addressInput = document.getElementById('sp-address');
                if (addressInput) {
                    const autocomplete = new maps.places.Autocomplete(addressInput);
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place.geometry && place.geometry.location) {
                            mapInstance.setCenter(place.geometry.location);
                            mapInstance.setZoom(15);
                            this.mapMarker.setPosition(place.geometry.location);
                            this.updateLatLngFields(place.geometry.location.lat(), place.geometry.location.lng());
                            
                            // Try parsing city and country
                            this.autofillLocationDetails(place.address_components);
                        }
                    });
                }
            });
        } catch (e) {
            console.error("Location picker map initialization failed:", e);
        }
    }

    updateLatLngFields(lat, lng) {
        const latInput = document.getElementById('sp-latitude');
        const lngInput = document.getElementById('sp-longitude');
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);
    }

    autofillLocationDetails(components) {
        if (!components) return;
        components.forEach(c => {
            const types = c.types;
            if (types.includes('locality')) {
                const cityInput = document.getElementById('sp-city');
                if (cityInput) cityInput.value = c.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
                const stateInput = document.getElementById('sp-state');
                if (stateInput) stateInput.value = c.short_name;
            }
            if (types.includes('country')) {
                const countryInput = document.getElementById('sp-country');
                if (countryInput) countryInput.value = c.long_name;
            }
            if (types.includes('postal_code')) {
                const zipInput = document.getElementById('sp-postal-code');
                if (zipInput) zipInput.value = c.long_name;
            }
        });
    }

    initDragAndDrop() {
        const dropZone = document.getElementById('sp-image-drop-zone');
        const fileInput = document.getElementById('sp-image-file-input');
        const previewContainer = document.getElementById('sp-images-preview-grid');

        if (!dropZone || !fileInput || !previewContainer) return;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleImageFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });
    }

    async handleImageFiles(files) {
        const progressWrapper = document.getElementById('sp-upload-progress-wrapper');
        const progressBar = document.getElementById('sp-upload-progress-bar');
        const progressLabel = document.getElementById('sp-upload-progress-label');

        if (!files || files.length === 0) return;

        if (progressWrapper) progressWrapper.style.display = 'block';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 1. Validation checks
            if (!file.type.startsWith('image/')) {
                showToast(`File "${file.name}" is not an image file format.`, 'error');
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast(`File "${file.name}" exceeds the maximum 5MB size limit.`, 'error');
                continue;
            }

            try {
                if (progressLabel) progressLabel.textContent = `Processing image ${i + 1}/${files.length}...`;

                // 2. Load WebP compression into background job queue
                const compressedBase64 = await jobQueue.add(
                    `Compress image: ${file.name}`,
                    (progress) => imagePipelineService.processImage(file, 1200, 800, 0.8, progress),
                    (pct) => {
                        if (progressBar) progressBar.style.width = `${pct}%`;
                    }
                );

                this.uploadedImages.push(compressedBase64);
                this.renderImagePreview(compressedBase64);
            } catch (e) {
                showToast(`Unable to compress "${file.name}": ${e.message}`, 'error');
            }
        }

        if (progressWrapper) {
            setTimeout(() => {
                progressWrapper.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }, 1000);
        }
    }

    renderImagePreview(base64) {
        const container = document.getElementById('sp-images-preview-grid');
        if (!container) return;

        const idx = this.uploadedImages.length - 1;
        const card = document.createElement('div');
        card.className = 'sp-preview-card';
        card.style = 'position:relative; width:100px; height:80px; border-radius:4px; overflow:hidden; border:1px solid var(--glass-border);';
        
        card.innerHTML = `
            <img src="${base64}" style="width:100%; height:100%; object-fit:cover;">
            <i class="fa-solid fa-circle-xmark delete-btn" data-idx="${idx}" style="position:absolute; top:4px; right:4px; color:var(--error); cursor:pointer; font-size:1.1rem; text-shadow:0 0 4px rgba(0,0,0,0.5);"></i>
        `;

        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-idx'));
            this.uploadedImages.splice(index, 1);
            card.remove();
            
            // Re-index remaining buttons
            container.querySelectorAll('.delete-btn').forEach((btn, newIdx) => {
                btn.setAttribute('data-idx', newIdx);
            });
        });

        container.appendChild(card);
    }

    initAIServiceBindings() {
        const writeDescriptionBtn = document.getElementById('sp-ai-write-btn');
        const analyzeImagesBtn = document.getElementById('sp-ai-analyze-btn');

        if (writeDescriptionBtn) {
            writeDescriptionBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                const city = document.getElementById('sp-city')?.value;
                const price = document.getElementById('sp-price')?.value;
                const type = document.getElementById('sp-type')?.value;
                const status = document.getElementById('sp-status')?.value;
                const bedrooms = document.getElementById('sp-bedrooms')?.value;
                const bathrooms = document.getElementById('sp-bathrooms')?.value;
                const area = document.getElementById('sp-area')?.value;

                if (!city || !price || !bedrooms || !area) {
                    showToast("Please input City, Price, Bedrooms, and Area specs before generating details.", "warning");
                    return;
                }

                writeDescriptionBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Writing...`;
                
                const selectedAmenities = [];
                document.querySelectorAll('.sp-amenity-checkbox:checked').forEach(c => {
                    selectedAmenities.push(c.value);
                });

                try {
                    const result = await aiService.generatePropertyDetails({
                        city, price, currency: 'INR', type, status, bedrooms, bathrooms, area, amenities: selectedAmenities
                    });

                    // Auto-fill values
                    const titleInput = document.getElementById('sp-title');
                    const descInput = document.getElementById('sp-description');
                    const highlightsInput = document.getElementById('sp-highlights');
                    const seoTitleInput = document.getElementById('sp-seo-title');
                    const seoDescInput = document.getElementById('sp-seo-description');

                    if (titleInput) titleInput.value = result.title;
                    if (descInput) descInput.value = result.description;
                    if (highlightsInput) highlightsInput.value = result.highlights.join('\n');
                    if (seoTitleInput) seoTitleInput.value = result.seoTitle;
                    if (seoDescInput) seoDescInput.value = result.seoDescription;

                    showToast("AI Details generated successfully!", "success");
                } catch (e) {
                    showToast("Failed to connect with Gemini text generation engine.", "error");
                } finally {
                    writeDescriptionBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Details`;
                }
            });
        }

        if (analyzeImagesBtn) {
            analyzeImagesBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                if (this.uploadedImages.length === 0) {
                    showToast("Please upload at least one image before running analysis.", "warning");
                    return;
                }

                analyzeImagesBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;
                
                try {
                    const tags = await aiService.analyzePropertyImage(this.uploadedImages[0]);
                    
                    // Map detected tags to checkboxes
                    const mapping = {
                        pool: 'Infinity Pool',
                        garage: 'Private Garage',
                        kitchen: 'Chef Kitchen',
                        garden: 'Zen Garden',
                        balcony: 'Private Balcony',
                        solar_panels: 'Solar Automation',
                        fireplace: 'Fireplace Hearth',
                        luxury_interior: 'Smart Automation'
                    };

                    let detectedCount = 0;
                    Object.entries(mapping).forEach(([key, amenityVal]) => {
                        if (tags[key]) {
                            const chk = document.querySelector(`.sp-amenity-checkbox[value="${amenityVal}"]`);
                            if (chk && !chk.checked) {
                                chk.checked = true;
                                detectedCount++;
                            }
                        }
                    });

                    if (detectedCount > 0) {
                        showToast(`Vision analysis matched & selected ${detectedCount} amenities!`, "success");
                    } else {
                        showToast("Vision analysis complete. No new matches detected.", "info");
                    }
                } catch (e) {
                    showToast("Gemini Vision model failed to analyze image contents.", "error");
                } finally {
                    analyzeImagesBtn.innerHTML = `<i class="fa-solid fa-eye"></i> Analyze Cover Image`;
                }
            });
        }
    }

    bindFormSubmission() {
        const form = document.getElementById('sp-submission-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Honeypot check
            const honey = document.getElementById('sp-bot-trap')?.value;
            if (honey) {
                console.warn("Spam protection lock triggered: bot detected.");
                return;
            }

            // 2. Image uploads check
            if (this.uploadedImages.length === 0) {
                showToast("Please upload at least one cover image before submitting.", "warning");
                return;
            }

            // 3. Captcha Turnstile verification check
            const turnstile = document.getElementById('sp-captcha-verify');
            if (turnstile && !turnstile.checked) {
                showToast("Please check Turnstile verification checkbox.", "warning");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

            // Compile amenities
            const amenities = [];
            document.querySelectorAll('.sp-amenity-checkbox:checked').forEach(c => {
                amenities.push(c.value);
            });

            // Parse specs
            const payload = {
                title: document.getElementById('sp-title').value.trim(),
                type: document.getElementById('sp-type').value,
                status: document.getElementById('sp-status').value,
                price: parseInt(document.getElementById('sp-price').value),
                currency: 'USD',
                address: document.getElementById('sp-address').value.trim(),
                city: document.getElementById('sp-city').value.trim(),
                state: document.getElementById('sp-state').value.trim(),
                country: document.getElementById('sp-country').value.trim(),
                zip: document.getElementById('sp-postal-code').value.trim(),
                coordinates: [
                    parseFloat(document.getElementById('sp-latitude').value),
                    parseFloat(document.getElementById('sp-longitude').value)
                ],
                bedrooms: parseInt(document.getElementById('sp-bedrooms').value),
                bhk: parseInt(document.getElementById('sp-bedrooms').value),
                bathrooms: parseInt(document.getElementById('sp-bathrooms').value),
                parking: parseInt(document.getElementById('sp-parking').value),
                area: parseInt(document.getElementById('sp-area').value),
                plotSize: parseFloat(document.getElementById('sp-plot-size').value) || 0,
                reraNumber: 'P' + Math.floor(50000000000 + Math.random() * 49999999999), // Mock RERA number
                yearBuilt: parseInt(document.getElementById('sp-year').value) || 2025,
                description: document.getElementById('sp-description').value.trim(),
                highlights: document.getElementById('sp-highlights').value.split('\n').filter(l => l.trim()),
                amenities,
                images: this.uploadedImages,
                ownerName: document.getElementById('sp-owner-name').value.trim(),
                email: document.getElementById('sp-owner-email').value.trim(),
                phone: document.getElementById('sp-owner-phone').value.trim(),
                whatsapp: document.getElementById('sp-owner-whatsapp').value.trim(),
                videoUrl: document.getElementById('sp-video').value || '',
                panoramaUrl: document.getElementById('sp-360').value || ''
            };

            try {
                await propertyService.submitProperty(payload);
                
                // Success screen dialog trigger
                this.renderSuccessModal();
                form.reset();
                this.uploadedImages = [];
                const previewGrid = document.getElementById('sp-images-preview-grid');
                if (previewGrid) previewGrid.innerHTML = '';
            } catch (err) {
                showToast(`Submission failed: ${err.message}`, 'error');
            } finally {
                if (submitBtn) submitBtn.innerHTML = `Submit Property for Review <i class="fa-solid fa-circle-check"></i>`;
            }
        });
    }

    renderSuccessModal() {
        const overlay = document.createElement('div');
        overlay.className = 'compare-modal-overlay active';
        overlay.style = 'z-index: 1100;';
        overlay.innerHTML = `
            <div class="compare-modal-container glass-panel animate-scale" style="max-width:450px; text-align:center; padding:3rem; display:flex; flex-direction:column; align-items:center; gap:1.5rem;">
                <i class="fa-solid fa-circle-check" style="font-size:4rem; color:#10B981; animation: pulse 2s infinite;"></i>
                <h3 style="font-family:var(--font-heading); text-transform:uppercase; color:#FFF; font-size:1.5rem;">Submission Successful</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6; margin:0;">
                    Your property listing proposal has been logged under verification review. LuxeHaven curators will verify coordinates, amenities, and owner documents before publishing.
                </p>
                <button class="btn-primary" id="success-done-btn" style="width:100%; justify-content:center;">Got It <i class="fa-solid fa-check"></i></button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#success-done-btn').addEventListener('click', () => {
            overlay.remove();
            window.location.href = ROUTES.PROPERTIES;
        });
    }
}
export default SubmitController;
