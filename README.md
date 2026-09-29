# LuxeHaven — Award-Winning Luxury Real Estate Platform

An elite, multi-page, production-ready luxury real estate web platform designed with world-class agency aesthetics (Awwwards, Obys, Locomotive, Dribbble). It combines custom editorial layouts and typography with robust, client-side product functionality.

---

## 📌 Overview

**LuxeHaven** redefines the luxury property discovery experience. Moving beyond standard real-estate grids, the platform blends high-fashion editorial aesthetics, interactive vector CAD drafting blueprints on HTML5 Canvas, geographic proximity calculations with Leaflet GIS mapping, 360° virtual property tours, and full client-side mortgage calculators.

---

## ✨ Core Features

1. **Editorial Hero & CAD Blueprint Canvas:** Fullscreen visual experience overlaid with oversized typography and an animated canvas drafting vector architectural CAD blueprints line-by-line in real time.
2. **Proximity-Aware GIS Map (Leaflet):** Plots active coordinates using dark tilesets. Users can query nearby transit stations, schools, healthcare, and dining, calculating proximity distances dynamically.
3. **Immersive 360° Virtual Tours (Pannellum):** Panoramic walkthrough capabilities inside showroom details with interactive drag-and-pan controls.
4. **Mortgage EMI Calculation & Graphing:** Live payment estimations on loan inputs using Chart.js doughnut breakdowns.
5. **Interactive Floorplans (SVG):** Interactive floor selection with hoverable zones mapping directly to spatial room dimensions.
6. **Curated Property Compare:** Multi-property side-by-side spec comparison table stored in local state.
7. **Client Identity & CMS Dashboard:** Authenticated dashboard for saving wishlists, viewing scheduled private walkthroughs, and managing property listings.

---

## 🛠️ Tech Stack

- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+ Modules)
- **Mapping & GIS:** Leaflet.js
- **Virtual Tours:** Pannellum (WebGL 360° panorama viewer)
- **Charts & Data:** Chart.js
- **Animations:** GSAP (GreenSock), Lenis Smooth Scroll
- **Cloud Backend:** Firebase SDK (Auth, Firestore integration ready)
- **Typography:** Syne, Playfair Display, Space Grotesk, JetBrains Mono

---

## 🚀 Live Demo

- **Live Web Application:** [https://luxehaven-seven.vercel.app](https://luxehaven-seven.vercel.app)

---

## 📂 Project Structure

```
Real-Estate-/
├── index.html               # Dribbble Editorial Home
├── properties.html          # Split-pane Search & Map Showcase
├── property.html            # Luxury Residences Showroom Details
├── about.html               # Legacy timeline & Brand Manifesto
├── agents.html              # Curator advisors directory
├── blog.html                # Insights Journal
├── contact.html             # Viewing schedule desk
├── dashboard.html           # CMS analytical CRUD panel
├── 404.html                 # Custom 404 error page
├── src/                     # Core scripts, controllers, and services
│   ├── app.js               # Application orchestration
│   ├── firebase.js          # Client auth & Firestore configuration
│   ├── map.js               # Leaflet GIS integration
│   ├── slider.js            # Showcase sliders
│   └── styles/              # Design tokens and bespoke CSS
├── robots.txt               # SEO crawler directives
└── sitemap.xml              # SEO XML sitemap
```

---

## 💻 Installation & Local Run

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Optional: VS Code Live Server or any static HTTP server

### 1. Clone the Repository
```bash
git clone https://github.com/Hvsr1984/Real-Estate-.git
cd Real-Estate-
```

### 2. Run Locally
Open `index.html` directly in your browser, or start a local static server:
```bash
npx serve .
```

### 3. CMS Dashboard Access
Access the **CMS Dashboard** via the navigation header to test client-side property management and saved wishlists.

---

## 👤 Author

**Harshvardhan Singh Rajawat**  
*CSE Student • Web Developer • AI Builder*  
Poornima Institute of Engineering and Technology, Jaipur

- **GitHub:** [@Hvsr1984](https://github.com/Hvsr1984)
- **Live Demo:** [luxehaven-seven.vercel.app](https://luxehaven-seven.vercel.app)
- **Email:** [2025pietcsharshvardhan063@poornima.org](mailto:2025pietcsharshvardhan063@poornima.org)