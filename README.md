# EduLearn Frontend 🎨💻

Welcome to the client-side application of **EduLearn**—a premium, responsive, and highly interactive learning management system (LMS) built with **React 18**, **Vite**, and **Vanilla CSS**.

This frontend provides a modern single-page experience (SPA) split between two robust portals: the **Student Dashboard** and the **Instructor Console**, seamlessly integrated with our Spring Cloud Gateway backend microservices.

---

## ✨ Features & Portals

### 👨‍🎓 Student Dashboard
* **Course Catalog & Registration:** Browse all admin-approved courses, view details, lessons, and instantly enroll.
* **Interactive Learning Portal:** Watch lecture videos, read course materials, and progress step-by-step.
* **Assessment Engine:** Take quizzes, submit answers, and see auto-graded results immediately.
* **Certificate Generation:** Download official course certificates in PDF format upon 100% completion (integrated via `html2canvas` & `jspdf`).
* **Discussion Forum:** Connect with instructors and peers directly inside course modules.

### 👩‍🏫 Instructor Portal
* **Course Management:** Create, structure, and edit courses, lessons, and modules.
* **Interactive Dashboard:** View analytics like total enrollments, revenue, and quiz completion rates.
* **Content Delivery:** Upload video lectures, attach reading content, and draft quiz questions.
* **Certificates Management:** Customize and authorize certificate templates for specific courses.

---

## 🛠️ Technology Stack

* **Core Framework:** [React 18.2](https://react.dev/)
* **Build System:** [Vite 5.1](https://vitejs.dev/) (blazing-fast HMR and bundling)
* **Routing:** [React Router DOM v6](https://reactrouter.com/) (centralized layout routing)
* **API Client:** [Axios](https://github.com/axios/axios) (configured with global interceptors for JWT injection)
* **PDF Engine:** [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/) (for real-time certificate generation)
* **Reverse Proxy / Serving:** [Nginx](https://www.nginx.com/) (for optimized Docker static builds)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js (v18+ or v20+)** installed.
* **npm** or **yarn** installed.

### Step 1: Install Dependencies
Run the package installer from the `edulearn-vite` directory:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the sample environment values to a `.env` file:
```bash
cp .env.example .env
```
Ensure your configuration points to the central **API Gateway** (default port `8080`):
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Step 3: Run the Development Server
Launch Vite's hot-reloading local development server:
```bash
npm run dev
```
*Open `http://localhost:3000` (or the terminal-assigned port) to interact with the portal.*

---

## 🐳 Docker Production Setup
The frontend is fully containerized and uses Nginx to serve the optimized production build statically.

To compile and launch the production container separately:
```bash
docker build -t edulearn-frontend .
docker run -d -p 3000:80 edulearn-frontend
```

---

## 📦 Production Bundling
To generate an optimized production bundle with full treeshaking:
```bash
npm run build
```
*The compiled, minified static files will be placed inside the `dist/` directory, ready for Nginx or CDN deployment.*