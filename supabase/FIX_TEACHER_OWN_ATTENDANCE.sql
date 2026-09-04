-- EduSphere: allow a teacher to mark attendance only for their own teacher record.
-- Run this once in the Supabase SQL Editor after the main schema/setup.

drop policy if exists "role_write" on public.teacher_attendance;
drop policy if exists "teacher_attendance_teacher_insert" on public.teacher_attendance;
drop policy if exists "teacher_insert_teacher_attendance" on public.teacher_attendance;
drop policy if exists "teacher_own_attendance_insert" on public.teacher_attendance;
drop policy if exists "admin_all_teacher_attendance" on public.teacher_attendance;

create policy "admin_all_teacher_attendance"
on public.teacher_attendance for all to authenticated
using (public.current_role()='admin')
with check (public.current_role()='admin');

create policy "teacher_own_attendance_insert"
on public.teacher_attendance for insert to authenticated
with check (
  public.current_role()='teacher'
  and exists (
    select 1
    from public.teachers t
    where t.id = teacher_attendance.teacher_id
      and t.profile_id = auth.uid()
  )
);
