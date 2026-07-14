/* js/services/seo/seoService.js - SEO Automation Domain */

import { eventBus } from '../../core/eventBus.js';

export class SEOService {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        // Listening to property approvals to trigger automation
        eventBus.on('property.approved', (property) => {
            this.automatePropertySEO(property);
        });
    }

    /**
     * Automate slugs, JSON-LD, sitemap indices, and canonicals
     */
    automatePropertySEO(property) {
        const slug = this.generateSlug(property.title, property.city);
        const jsonLd = this.generateJSONLD(property);
        const metaTags = this.generateMetaTags(property, slug);

        console.log(`[SEOService] SEO Automated successfully for: ${property.title}`);
        console.log(`[SEOService] Generated Slug: ${slug}`);
        console.log(`[SEOService] JSON-LD Schema:`, jsonLd);

        // Save generated sitemap entries locally in sessions
        this.registerSitemapEntry(slug);

        return { slug, jsonLd, metaTags };
    }

    generateSlug(title, city) {
        const base = `${title}-${city}`.toLowerCase();
        return base
            .replace(/[^a-z0-9\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-')          // replace multiple spaces with -
            .replace(/-+/g, '-')           // collapse double -
            .trim();
    }

    generateJSONLD(property) {
        return {
            "@context": "https://schema.org",
            "@type": "SingleFamilyResidence",
            "name": property.title,
            "description": property.description,
            "image": property.images?.[0] || '',
            "address": {
                "@type": "PostalAddress",
                "streetAddress": property.location,
                "addressLocality": property.city,
                "addressCountry": property.country || "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": property.coordinates?.[0] || 0,
                "longitude": property.coordinates?.[1] || 0
            },
            "numberOfBedrooms": property.bedrooms || 0,
            "numberOfBathrooms": property.bathrooms || 0,
            "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": property.currency || "USD",
                "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": property.price,
                    "priceCurrency": property.currency || "USD",
                    "unitText": property.status === 'Rent' ? 'Month' : 'Total'
                }
            }
        };
    }

    generateMetaTags(property, slug) {
        const pageUrl = `${window.location.origin}/pages/property.html?id=${property.id}&slug=${slug}`;
        const title = `${property.title} | Luxury Residence at ${property.city}`;
        const description = property.description ? property.description.substring(0, 155) + '...' : '';

        return {
            title,
            meta: [
                { name: 'description', content: description },
                { property: 'og:title', content: title },
                { property: 'og:description', content: description },
                { property: 'og:url', content: pageUrl },
                { property: 'og:image', content: property.images?.[0] || '' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: title },
                { name: 'twitter:description', content: description }
            ],
            canonical: pageUrl
        };
    }

    registerSitemapEntry(slug) {
        const sitemaps = JSON.parse(localStorage.getItem('seo_sitemap_mock') || '[]');
        const targetUrl = `/pages/property.html?slug=${slug}`;
        if (!sitemaps.includes(targetUrl)) {
            sitemaps.push(targetUrl);
            localStorage.setItem('seo_sitemap_mock', JSON.stringify(sitemaps));
            console.log(`[SEOService] Sitemap Mock updated with page: ${targetUrl}`);
        }
    }
}

export const seoService = new SEOService();
