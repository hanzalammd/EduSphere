# EduSphere — Smart School Management

A single React + Vite + TypeScript school-management project using Supabase for authentication and persistent shared data.

## Final setup

1. Extract the ZIP and open the folder in VS Code.
2. In Supabase, open **SQL Editor**.
3. Open `supabase/ONE_CLICK_SETUP.sql` from this project.
4. Copy the complete SQL file and run it.
5. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the root `.env` file.
6. Run `npm install` then `npm run dev`.

## Included

- Professional responsive admin/teacher workspace
- Students, teachers and classes with persistent Supabase data
- Class/section detail open/close flow
- Weekly timetable with 8 periods per day
- Student and teacher attendance with Present / Absent / Leave only
- Fees, payments, balances and automatic Paid / Partial / Unpaid status
- Exams, results, assignments, submissions, notices and reports
- Visitor landing experience with crisp, stable typography
- GitHub/Vercel-ready single project folder

## Important

The browser app cannot create Supabase tables by itself. The one-time `ONE_CLICK_SETUP.sql` step is required for the database features to work. The SQL is safe to run again and repairs the fee status from existing payment records.

## Existing database repair

If an existing Supabase project shows `Could not find the 'class_id' column of 'students' in the schema cache`, run `supabase/FIX_STUDENTS_CLASS_ID.sql` in the Supabase SQL Editor. This migration adds `students.class_id`, creates missing section-less class records from existing student class names, links existing students to those classes, adds the class index, and requests a PostgREST schema refresh.

For a new database, use `supabase/schema.sql` or `supabase/ONE_CLICK_SETUP.sql`. Both now define `students.class_id` as part of the schema and retain an idempotent compatibility migration for older installations.


## Existing Supabase database
If your deployed/local database was created from an older EduSphere schema, run `supabase/01_FIX_STUDENTS_CLASS_ID.sql` once in Supabase SQL Editor. This adds the `students.class_id` relationship and links existing students to section-less class records.
