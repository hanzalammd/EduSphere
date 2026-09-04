-- EduSphere: repair an existing Supabase database that is missing students.class_id
-- Run this in Supabase SQL Editor while signed in as the project owner.

begin;

-- 1. Make sure the classes table exists before adding the relationship.
create table if not exists public.classes(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text not null default '',
  academic_year text not null default extract(year from current_date)::text,
  class_teacher_id uuid references public.teachers(id) on delete set null,
  unique(name,section,academic_year)
);

-- 2. This is the column the Students page uses when saving a student.
alter table public.students
  add column if not exists class_id uuid references public.classes(id) on delete set null;

-- 3. Existing classes can have A/B/C sections. Create a clean section-less
--    class row for each class name used by students when one does not exist.
insert into public.classes(name, section, academic_year)
select distinct
  trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')),
  '',
  extract(year from current_date)::text
from public.students s
where nullif(trim(s.class_name), '') is not null
  and not exists (
    select 1
    from public.classes c
    where lower(trim(c.name)) = lower(trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')))
      and c.academic_year = extract(year from current_date)::text
      and c.section = ''
  );

-- 4. Link existing students to the clean class row first.
update public.students s
set class_id = c.id
from public.classes c
where s.class_id is null
  and nullif(trim(s.class_name), '') is not null
  and lower(trim(c.name)) = lower(trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')))
  and c.academic_year = extract(year from current_date)::text
  and c.section = '';

create index if not exists idx_students_class_id on public.students(class_id);

-- 5. Keep Supabase's schema metadata consistent after the DDL change.
notify pgrst, 'reload schema';

commit;

