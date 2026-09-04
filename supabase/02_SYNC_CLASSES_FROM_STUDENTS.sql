-- EduSphere: create clean section-less classes from existing student records.
-- Run after 01_FIX_STUDENTS_CLASS_ID.sql.

begin;

-- Create one clean class for every distinct class name already used by students.
insert into public.classes(name, section, academic_year)
select distinct
  trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')),
  '',
  extract(year from current_date)::text
from public.students s
where nullif(trim(s.class_name), '') is not null
  and not exists (
    select 1 from public.classes c
    where lower(trim(c.name)) = lower(trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')))
      and coalesce(c.section,'') = ''
      and c.academic_year = extract(year from current_date)::text
  );

-- Link every existing student to the clean class with the same normalized name.
update public.students s
set class_id = c.id,
    section = null,
    class_name = c.name
from public.classes c
where nullif(trim(s.class_name), '') is not null
  and lower(trim(c.name)) = lower(trim(regexp_replace(s.class_name, '\\s+', ' ', 'g')))
  and coalesce(c.section,'') = ''
  and c.academic_year = extract(year from current_date)::text;

create index if not exists idx_students_class_id on public.students(class_id);
notify pgrst, 'reload schema';
commit;
