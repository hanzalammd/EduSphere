-- EduSphere: normalize student classes for the attendance module.
-- Run this after 01_FIX_STUDENTS_CLASS_ID.sql and 02_SYNC_CLASSES_FROM_STUDENTS.sql.
-- It keeps the visible class model simple: Grade 5, Grade 6, Grade 10, etc.

-- Create a section-less class for every distinct class name used by students.
insert into public.classes (name, section, academic_year)
select distinct trim(s.class_name), '', (extract(year from current_date)::int)::text || '-' || right((extract(year from current_date)::int + 1)::text, 2)
from public.students s
where nullif(trim(s.class_name), '') is not null
and not exists (
  select 1 from public.classes c
  where lower(trim(c.name)) = lower(trim(s.class_name))
    and trim(coalesce(c.section, '')) = ''
);

-- Link every student to the section-less class with the same name.
update public.students s
set class_id = c.id, section = null
from public.classes c
where nullif(trim(s.class_name), '') is not null
  and lower(trim(c.name)) = lower(trim(s.class_name))
  and trim(coalesce(c.section, '')) = '';

-- Keep class_name synchronized with the canonical class name.
update public.students s
set class_name = c.name
from public.classes c
where s.class_id = c.id;

create index if not exists idx_students_class_id_attendance on public.students(class_id);

-- Refresh PostgREST's schema cache.
notify pgrst, 'reload schema';
