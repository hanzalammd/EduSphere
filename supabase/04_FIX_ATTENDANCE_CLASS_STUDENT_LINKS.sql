-- EduSphere: make Student Attendance use the exact classes shown in Classes.
-- Safe to run on an existing database.

create extension if not exists "pgcrypto";

alter table public.students
  add column if not exists class_id uuid references public.classes(id) on delete set null;

-- Normalize/repair existing student -> class links from the student's legacy class_name.
do $$
declare
  r record;
  c record;
  clean_name text;
begin
  for r in
    select id, class_name
    from public.students
    where nullif(trim(class_name), '') is not null
  loop
    clean_name := regexp_replace(trim(r.class_name), '\\s+', ' ', 'g');

    select * into c
    from public.classes
    where lower(regexp_replace(trim(name), '\\s+', ' ', 'g')) = lower(clean_name)
      and coalesce(trim(section), '') = ''
    order by (academic_year = extract(year from current_date)::text) desc, academic_year desc
    limit 1;

    if c.id is null then
      insert into public.classes(name, section, academic_year)
      values(clean_name, '', extract(year from current_date)::text)
      returning * into c;
    end if;

    update public.students
    set class_id = c.id,
        section = null,
        updated_at = now()
    where id = r.id
      and (class_id is distinct from c.id or section is not null);
  end loop;
end $$;

create index if not exists idx_students_class_id on public.students(class_id);

-- PostgREST schema reload.
notify pgrst, 'reload schema';
