-- Run after schema.sql. Admin = full control. Teacher = insert-only teaching records.
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['students','teachers','classes','student_attendance','teacher_attendance','fees','fee_payments','assignments','assignment_submissions','exams','results','notices']) LOOP EXECUTE 'drop policy if exists "role_write" on public.'||t; EXECUTE 'drop policy if exists "teacher_insert" on public.'||t; END LOOP; END $$;
create policy "admin_all_students" on public.students for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_teachers" on public.teachers for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_classes" on public.classes for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "teacher_insert_student_attendance" on public.student_attendance for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_teacher_attendance" on public.teacher_attendance for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_assignments" on public.assignments for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_submissions" on public.assignment_submissions for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_exams" on public.exams for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_results" on public.results for insert to authenticated with check(public.current_role()='teacher');
create policy "teacher_insert_notices" on public.notices for insert to authenticated with check(public.current_role()='teacher');
create policy "admin_all_student_attendance" on public.student_attendance for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_teacher_attendance" on public.teacher_attendance for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_fees" on public.fees for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "accountant_fees" on public.fees for all to authenticated using(public.current_role()='accountant') with check(public.current_role()='accountant');
create policy "admin_all_fee_payments" on public.fee_payments for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "accountant_fee_payments" on public.fee_payments for all to authenticated using(public.current_role()='accountant') with check(public.current_role()='accountant');
create policy "admin_all_assignments" on public.assignments for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_submissions" on public.assignment_submissions for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_exams" on public.exams for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_results" on public.results for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_notices" on public.notices for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');

-- Teacher access model: teachers may INSERT operational records, but may never UPDATE or DELETE them.
-- Admin remains the only role that can change/delete existing records.
drop policy if exists "teacher_insert_fees" on public.fees;
create policy "teacher_insert_fees" on public.fees for insert to authenticated with check(public.current_role()='teacher');
drop policy if exists "teacher_insert_fee_payments" on public.fee_payments;
create policy "teacher_insert_fee_payments" on public.fee_payments for insert to authenticated with check(public.current_role()='teacher');
