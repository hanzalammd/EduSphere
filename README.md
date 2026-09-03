# EduSphere Full-Stack School Management

Single Vite + React + TypeScript project with Supabase integration and PostgreSQL schema/RLS. It is designed for shared online school data.

## Setup
1. Install Node.js LTS and VS Code.
2. Open this folder in VS Code and run `npm install`.
3. Create a Supabase project.
4. In Supabase SQL Editor, run **all** of `supabase/schema.sql`.
5. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings → API.
6. Run `npm run dev` and open the Vite URL.
7. Test production build with `npm run build`.
8. Push the folder to GitHub and import it into Vercel. Build command: `npm run build`; output: `dist`. Add the same two environment variables in Vercel.

## First admin
Create a user in Supabase Authentication → Users. Then in SQL Editor run:
`update public.profiles set role='admin' where id='USER_UUID';`

## Roles
`admin`, `teacher`, `accountant`, `student`, `parent`.

## Important security
Never commit `.env`. Never expose a Supabase service-role/secret key in the frontend. The schema enables Row Level Security, but before real school production use, tighten student/parent visibility policies to your exact school rules.

## Included
Dashboard, Students CRUD example, responsive UI, teachers, classes, student/teacher attendance, fees, assignments, exams/results, notices, reports, settings module shells, Supabase client, SQL relationships, auth profile trigger, RLS, seed students and Vercel config.

The remaining modules are deliberately scaffolded cleanly so their full CRUD/forms can be expanded without changing the project architecture.
