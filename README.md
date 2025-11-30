# CaseStudyReact

Minimal Vite + React app that mirrors the structure of `casestudy/` (client-side).

What it contains:
- A list of available cases (from `public/cases/index.json`)
- Case detail page that reads `skeleton.json` and `personas.json` and displays canon events
- A tiny simulator that steps through canon events and logs simple actions

How to run:
1. npm install
2. npm run dev
3. npm start

Notes:
- This is a minimal front-end port; the original `casestudy` project is Python CLI and backend-oriented. The React app keeps data in `public/cases` for simplicity.
