create extension if not exists "pgcrypto";
do $$ begin create type public.app_role as enum ('admin','teacher','accountant','student','parent'); exception when duplicate_object then null; end $$;
do $$ begin create type public.attendance_status as enum ('present','absent','leave','late'); exception when duplicate_object then null; end $$;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null,role public.app_role not null default 'student',phone text,created_at timestamptz not null default now());
create table if not exists public.teachers(id uuid primary key default gen_random_uuid(),profile_id uuid references public.profiles(id) on delete set null,employee_code text unique,full_name text not null,phone text,email text,subject text,status text not null default 'active',created_at timestamptz not null default now());
create table if not exists public.classes(id uuid primary key default gen_random_uuid(),name text not null,section text not null default '',academic_year text not null,class_teacher_id uuid references public.teachers(id) on delete set null,unique(name,section,academic_year));
create table if not exists public.students(id uuid primary key default gen_random_uuid(),student_code text not null unique,full_name text not null,gender text,date_of_birth date,phone text,email text,address text,parent_name text,parent_phone text,emergency_contact text,class_name text,section text,roll_no text,admission_date date,status text not null default 'active',class_id uuid references public.classes(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
-- Compatibility migration: adds class_id to databases created by an older EduSphere schema.
alter table public.students add column if not exists class_id uuid references public.classes(id) on delete set null;

create table if not exists public.student_attendance(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete cascade,attendance_date date not null,status public.attendance_status not null,marked_by uuid references public.profiles(id) on delete set null,note text,created_at timestamptz not null default now(),unique(student_id,attendance_date));
create table if not exists public.teacher_attendance(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.teachers(id) on delete cascade,attendance_date date not null,status public.attendance_status not null,marked_by uuid references public.profiles(id) on delete set null,note text,unique(teacher_id,attendance_date));
create table if not exists public.fees(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete cascade,month date not null,amount numeric(12,2) not null default 0,discount numeric(12,2) not null default 0,fine numeric(12,2) not null default 0,paid numeric(12,2) not null default 0,due_date date,status text not null default 'unpaid',created_at timestamptz not null default now());
create table if not exists public.fee_payments(id uuid primary key default gen_random_uuid(),fee_id uuid not null references public.fees(id) on delete cascade,amount numeric(12,2) not null,payment_date date not null default current_date,method text not null default 'cash',receipt_no text unique,received_by uuid references public.profiles(id) on delete set null);
create table if not exists public.assignments(id uuid primary key default gen_random_uuid(),title text not null,subject text not null,class_name text,section text,description text,due_date date,attachment_url text,teacher_id uuid references public.teachers(id) on delete set null,status text not null default 'active',created_at timestamptz not null default now());
create table if not exists public.assignment_submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.assignments(id) on delete cascade,student_id uuid not null references public.students(id) on delete cascade,submitted_at timestamptz,attachment_url text,marks numeric(6,2),feedback text,status text not null default 'pending',unique(assignment_id,student_id));
create table if not exists public.exams(id uuid primary key default gen_random_uuid(),name text not null,exam_date date,academic_year text,term text,created_at timestamptz not null default now());
create table if not exists public.results(id uuid primary key default gen_random_uuid(),exam_id uuid not null references public.exams(id) on delete cascade,student_id uuid not null references public.students(id) on delete cascade,subject text not null,total_marks numeric(8,2) not null,obtained_marks numeric(8,2) not null,grade text,unique(exam_id,student_id,subject));
create table if not exists public.notices(id uuid primary key default gen_random_uuid(),title text not null,body text not null,audience public.app_role[] default '{}',publish_at timestamptz not null default now(),expires_at timestamptz,created_by uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now());
create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New User'),'student') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['profiles','students','teachers','classes','student_attendance','teacher_attendance','fees','fee_payments','assignments','assignment_submissions','exams','results','notices']) LOOP EXECUTE format('alter table public.%I enable row level security',t); END LOOP; END $$;
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['profiles','students','teachers','classes','student_attendance','teacher_attendance','fees','fee_payments','assignments','assignment_submissions','exams','results','notices']) LOOP EXECUTE 'drop policy if exists "authenticated_read" on public.'||t; EXECUTE 'drop policy if exists "role_write" on public.'||t; END LOOP; END $$;
create policy "authenticated_read" on public.students for select to authenticated using(true); create policy "role_write" on public.students for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "authenticated_read" on public.teachers for select to authenticated using(true); create policy "role_write" on public.teachers for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "authenticated_read" on public.classes for select to authenticated using(true); create policy "role_write" on public.classes for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "authenticated_read" on public.student_attendance for select to authenticated using(true); create policy "role_write" on public.student_attendance for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "authenticated_read" on public.teacher_attendance for select to authenticated using(true); create policy "role_write" on public.teacher_attendance for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "authenticated_read" on public.fees for select to authenticated using(public.current_role() in('admin','accountant','teacher','student','parent')); create policy "role_write" on public.fees for all to authenticated using(public.current_role() in('admin','accountant')) with check(public.current_role() in('admin','accountant'));
create policy "authenticated_read" on public.fee_payments for select to authenticated using(public.current_role() in('admin','accountant','teacher','student','parent')); create policy "role_write" on public.fee_payments for all to authenticated using(public.current_role() in('admin','accountant')) with check(public.current_role() in('admin','accountant'));
create policy "authenticated_read" on public.assignments for select to authenticated using(true); create policy "role_write" on public.assignments for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "authenticated_read" on public.assignment_submissions for select to authenticated using(true); create policy "role_write" on public.assignment_submissions for all to authenticated using(public.current_role() in('admin','teacher','student')) with check(public.current_role() in('admin','teacher','student'));
create policy "authenticated_read" on public.exams for select to authenticated using(true); create policy "role_write" on public.exams for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "authenticated_read" on public.results for select to authenticated using(true); create policy "role_write" on public.results for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "authenticated_read" on public.notices for select to authenticated using(true); create policy "role_write" on public.notices for all to authenticated using(public.current_role() in('admin','teacher')) with check(public.current_role() in('admin','teacher'));
create policy "self_read" on public.profiles for select to authenticated using(id=auth.uid() or public.current_role()='admin'); create policy "admin_write" on public.profiles for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
insert into public.students(student_code,full_name,gender,class_name,section,roll_no,admission_date) values('ES-1001','Ali Khan','Male','Grade 9','A','01',current_date),('ES-1002','Ayesha Noor','Female','Grade 9','A','02',current_date),('ES-1003','Hamza Ahmed','Male','Grade 10','B','07',current_date),('ES-1004','Sara Iqbal','Female','Grade 8','A','12',current_date),('ES-1005','Usman Shah','Male','Grade 7','C','19',current_date) on conflict(student_code) do nothing;

-- Helpful indexes and automatic student updated_at maintenance
create index if not exists idx_students_class on public.students(class_name,section);
create index if not exists idx_student_attendance_date on public.student_attendance(attendance_date);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(attendance_date);
create index if not exists idx_fees_student on public.fees(student_id);
create index if not exists idx_results_student on public.results(student_id);
create or replace function public.touch_student() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists students_touch on public.students;
create trigger students_touch before update on public.students for each row execute procedure public.touch_student();

-- Consolidated security + audit layer
create table if not exists public.audit_logs(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null,
 table_name text not null,
 record_id text,
 old_data jsonb,
 new_data jsonb,
 created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists "admin_audit_read" on public.audit_logs;
create policy "admin_audit_read" on public.audit_logs for select to authenticated using(public.current_role()='admin');

create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.audit_logs(actor_id,action,table_name,record_id,old_data,new_data)
  values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce((case when TG_OP='DELETE' then OLD.id else NEW.id end)::text),case when TG_OP='DELETE' then to_jsonb(OLD) when TG_OP='UPDATE' then to_jsonb(OLD) end,case when TG_OP in('INSERT','UPDATE') then to_jsonb(NEW) end);
  return case when TG_OP='DELETE' then OLD else NEW end;
end; $$;

do $$ declare t text; begin for t in select unnest(array['students','teachers','classes','student_attendance','teacher_attendance','fees','fee_payments','assignments','assignment_submissions','exams','results','notices']) loop execute format('drop trigger if exists audit_%I on public.%I',t,t); execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.write_audit_log()',t,t); end loop; end $$;

-- Exactly one admin and no more than five teacher profiles.
create unique index if not exists one_admin_only on public.profiles(role) where role='admin';
create or replace function public.enforce_staff_limits() returns trigger language plpgsql as $$
begin
 if NEW.role='admin' and (TG_OP='INSERT' or OLD.role is distinct from 'admin') and exists(select 1 from public.profiles where role='admin' and id<>NEW.id) then raise exception 'Only one admin account is allowed'; end if;
 if NEW.role='teacher' and (TG_OP='INSERT' or OLD.role is distinct from 'teacher') and (select count(*) from public.profiles where role='teacher' and id<>NEW.id)>=5 then raise exception 'Maximum 5 teacher accounts allowed'; end if;
 return NEW;
end; $$;
drop trigger if exists staff_limits on public.profiles;
create trigger staff_limits before insert or update of role on public.profiles for each row execute function public.enforce_staff_limits();

-- Class timetable: eight daily periods, with a subject and teacher per period.
create table if not exists public.class_timetable(
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 period_no integer not null check(period_no between 1 and 8),
 start_time time not null,
 end_time time not null,
 subject text not null,
 teacher_id uuid references public.teachers(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(class_id,period_no)
);
alter table public.class_timetable enable row level security;
drop policy if exists "timetable_read" on public.class_timetable;
drop policy if exists "timetable_write" on public.class_timetable;
create policy "timetable_read" on public.class_timetable for select to authenticated using(true);
create policy "timetable_write" on public.class_timetable for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create index if not exists idx_class_timetable_class on public.class_timetable(class_id,period_no);

-- Starter class sections for the academic structure. Safe to re-run.
insert into public.classes(name,section,academic_year)
select x.name,'A',extract(year from current_date)::text
from (values ('Grade 7'),('Grade 8'),('Grade 9'),('Grade 10')) as x(name)
where not exists (select 1 from public.classes c where c.name=x.name and c.section='A' and c.academic_year=extract(year from current_date)::text);

-- Connected class/section records, weekly timetable, date sheets and immutable teacher entry rules.
update public.students s set class_id=c.id from public.classes c where s.class_id is null and s.class_name=c.name and s.section=c.section;
create index if not exists idx_students_class_id on public.students(class_id);
create unique index if not exists uq_classes_clean_name_year on public.classes(lower(trim(name)),academic_year) where section='';

-- Timetable is weekly: one teacher/subject assignment per class, day and period.
alter table public.class_timetable add column if not exists day_of_week text not null default 'Monday';
drop index if exists public.class_timetable_class_period_key;
drop index if exists public.class_timetable_class_period_no_key;
do $$ begin
  if exists(select 1 from pg_constraint where conrelid='public.class_timetable'::regclass and conname='class_timetable_class_id_period_no_key') then
    alter table public.class_timetable drop constraint class_timetable_class_id_period_no_key;
  end if;
exception when undefined_object then null; end $$;
create unique index if not exists uq_class_timetable_day_period on public.class_timetable(class_id,day_of_week,period_no);
create index if not exists idx_class_timetable_teacher_day on public.class_timetable(teacher_id,day_of_week,period_no);

create table if not exists public.class_date_sheet(
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 exam_name text not null,
 exam_date date not null,
 subject text not null,
 start_time time,
 end_time time,
 room text,
 created_at timestamptz not null default now(),
 unique(class_id,exam_name,exam_date,subject)
);
alter table public.class_date_sheet enable row level security;
drop policy if exists "date_sheet_read" on public.class_date_sheet;
drop policy if exists "date_sheet_admin_write" on public.class_date_sheet;
create policy "date_sheet_read" on public.class_date_sheet for select to authenticated using(true);
create policy "date_sheet_admin_write" on public.class_date_sheet for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create index if not exists idx_class_date_sheet_class_date on public.class_date_sheet(class_id,exam_date);

-- Attendance is only P/A/L. Existing installations with the old 'late' enum value keep it in the type for compatibility,
-- but all new UI and data-entry paths reject it. Admin can edit; teachers can insert only and cannot update/delete.
drop policy if exists "role_write" on public.student_attendance;
drop policy if exists "student_attendance_admin_all" on public.student_attendance;
drop policy if exists "student_attendance_teacher_insert" on public.student_attendance;
create policy "student_attendance_admin_all" on public.student_attendance for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "student_attendance_teacher_insert" on public.student_attendance for insert to authenticated
with check(public.current_role()='teacher' and exists(
  select 1 from public.students s join public.classes c on c.id=s.class_id
  join public.teachers t on (t.profile_id=auth.uid())
  where s.id=student_attendance.student_id and (c.class_teacher_id=t.id or exists(select 1 from public.class_timetable ct where ct.class_id=c.id and ct.teacher_id=t.id))
));

drop policy if exists "role_write" on public.teacher_attendance;
drop policy if exists "teacher_attendance_admin_all" on public.teacher_attendance;
drop policy if exists "teacher_attendance_teacher_insert" on public.teacher_attendance;
create policy "teacher_attendance_admin_all" on public.teacher_attendance for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "teacher_attendance_teacher_insert" on public.teacher_attendance for insert to authenticated with check(public.current_role()='teacher' and exists(select 1 from public.teachers t where t.id=teacher_attendance.teacher_id and t.profile_id=auth.uid()));

-- Timetable admin-only writes and date-sheet admin-only writes are already protected; refresh the timetable policy after weekly change.
drop policy if exists "timetable_write" on public.class_timetable;
create policy "timetable_write" on public.class_timetable for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');

-- Helpful validation: no attendance status other than P/A/L may be written by the application.
create or replace function public.reject_late_attendance() returns trigger language plpgsql as $$
begin
 if new.status::text='late' then raise exception 'Late attendance is not allowed. Use Present, Absent or Leave.'; end if;
 return new;
end; $$;
drop trigger if exists reject_late_student_attendance on public.student_attendance;
create trigger reject_late_student_attendance before insert or update on public.student_attendance for each row execute function public.reject_late_attendance();
drop trigger if exists reject_late_teacher_attendance on public.teacher_attendance;
create trigger reject_late_teacher_attendance before insert or update on public.teacher_attendance for each row execute function public.reject_late_attendance();
-- Final role policies are intentionally dropped before recreation so this setup can be safely run again.
drop policy if exists "teacher_insert_student_attendance" on public.student_attendance;
drop policy if exists "teacher_insert_teacher_attendance" on public.teacher_attendance;
drop policy if exists "admin_all_students" on public.students;
drop policy if exists "admin_all_teachers" on public.teachers;
drop policy if exists "admin_all_classes" on public.classes;
drop policy if exists "teacher_insert_student_attendance" on public.student_attendance;
drop policy if exists "teacher_insert_teacher_attendance" on public.teacher_attendance;
drop policy if exists "teacher_insert_assignments" on public.assignments;
drop policy if exists "teacher_insert_submissions" on public.assignment_submissions;
drop policy if exists "teacher_insert_exams" on public.exams;
drop policy if exists "teacher_insert_results" on public.results;
drop policy if exists "teacher_insert_notices" on public.notices;
drop policy if exists "admin_all_student_attendance" on public.student_attendance;
drop policy if exists "admin_all_teacher_attendance" on public.teacher_attendance;
drop policy if exists "admin_all_fees" on public.fees;
drop policy if exists "accountant_fees" on public.fees;
drop policy if exists "admin_all_fee_payments" on public.fee_payments;
drop policy if exists "accountant_fee_payments" on public.fee_payments;
drop policy if exists "admin_all_assignments" on public.assignments;
drop policy if exists "admin_all_submissions" on public.assignment_submissions;
drop policy if exists "admin_all_exams" on public.exams;
drop policy if exists "admin_all_results" on public.results;
drop policy if exists "admin_all_notices" on public.notices;
drop policy if exists "teacher_insert_fees" on public.fees;
drop policy if exists "teacher_insert_fee_payments" on public.fee_payments;

-- Run after schema.sql. Admin = full control. Teacher = insert-only teaching records.
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['students','teachers','classes','student_attendance','teacher_attendance','fees','fee_payments','assignments','assignment_submissions','exams','results','notices']) LOOP EXECUTE 'drop policy if exists "role_write" on public.'||t; EXECUTE 'drop policy if exists "teacher_insert" on public.'||t; END LOOP; END $$;
create policy "admin_all_students" on public.students for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_teachers" on public.teachers for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
create policy "admin_all_classes" on public.classes for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
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
-- Keeps fee status synchronized whenever paid/amount/discount/fine changes.
create or replace function public.sync_fee_status() returns trigger
language plpgsql as $$
begin
  if NEW.paid <= 0 then NEW.status := 'unpaid';
  elsif NEW.paid >= greatest(0, NEW.amount - NEW.discount + NEW.fine) then NEW.status := 'paid';
  else NEW.status := 'partial';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_fee_status on public.fees;
create trigger trg_sync_fee_status
before insert or update of paid, amount, discount, fine on public.fees
for each row execute function public.sync_fee_status();

-- Repair existing fee rows once.
update public.fees
set status = case
  when paid <= 0 then 'unpaid'
  when paid >= greatest(0, amount - discount + fine) then 'paid'
  else 'partial'
end;

-- Keep fee totals/status synchronized from immutable payment entries.
create or replace function public.sync_fee_from_payment() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  update public.fees f
  set paid = coalesce((select sum(fp.amount) from public.fee_payments fp where fp.fee_id=f.id),0),
      status = case
        when coalesce((select sum(fp.amount) from public.fee_payments fp where fp.fee_id=f.id),0) <= 0 then 'unpaid'
        when coalesce((select sum(fp.amount) from public.fee_payments fp where fp.fee_id=f.id),0) >= greatest(0,f.amount-f.discount+f.fine) then 'paid'
        else 'partial'
      end
  where f.id = coalesce(NEW.fee_id,OLD.fee_id);
  return coalesce(NEW,OLD);
end;
$$;
drop trigger if exists trg_sync_fee_from_payment on public.fee_payments;
create trigger trg_sync_fee_from_payment
after insert or update or delete on public.fee_payments
for each row execute function public.sync_fee_from_payment();
