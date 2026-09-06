# EduSphere — Cinematic 3D Workspace Update

This folder is the complete EduSphere React/Vite project with the new reference-inspired visual layer.

## What was changed
- Dashboard redesigned toward the supplied reference: blue navigation rail, clean white workspace, large welcome area, stat cards, activity/quick-access panels and subtle depth.
- Students, Teachers, Attendance, Results, Fees, Fee Payments, Assignments, Reports and other internal pages inherit the same visual system.
- Page transitions, card lift, table hover, form focus, modal entrance and buttons have restrained motion.
- Existing application logic and Supabase data calls were not intentionally replaced.
- Login remains a separate screen and keeps its existing authentication flow.
- Responsive/mobile navigation remains supported.
- `prefers-reduced-motion` is respected.

## Run in VS Code
1. Extract this folder.
2. Open the folder in VS Code.
3. Run `npm install`.
4. Create `.env` from `.env.example` and add your Supabase values.
5. Run `npm run dev`.

## Build
`npm run build`

The included `REFERENCE_DASHBOARD.jpg` is the user's supplied visual reference only.
