-- EduSphere: classes are derived from student records.
-- When the last student in a class is deleted, the empty class is deleted too.
-- When a student is added, Students.tsx creates the class first if it does not exist.

begin;

-- Do not seed Grade 7/8/9/10 automatically. Classes should appear only when students use them.

create or replace function public.cleanup_orphan_student_classes()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.classes c
  where not exists (
    select 1 from public.students s
    where s.class_id = c.id
       or (
         s.class_id is null
         and nullif(trim(s.class_name), '') is not null
         and lower(trim(s.class_name)) = lower(trim(c.name))
         and coalesce(trim(s.section), '') = coalesce(trim(c.section), '')
       )
  );
end;
$$;

create or replace function public.cleanup_orphan_student_classes_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.cleanup_orphan_student_classes();
  return null;
end;
$$;

revoke execute on function public.cleanup_orphan_student_classes() from public, anon, authenticated;
revoke execute on function public.cleanup_orphan_student_classes_trigger() from public, anon, authenticated;

drop trigger if exists cleanup_orphan_student_classes_after_delete on public.students;
create trigger cleanup_orphan_student_classes_after_delete
after delete on public.students
for each statement
execute function public.cleanup_orphan_student_classes_trigger();

-- Clean old empty classes now. This also removes previously seeded Grade 7/8/9/10
-- records if they have no students. Timetables/date sheets linked to those classes
-- are removed by the classes table's ON DELETE CASCADE relationships.
select public.cleanup_orphan_student_classes();

notify pgrst, 'reload schema';
commit;
