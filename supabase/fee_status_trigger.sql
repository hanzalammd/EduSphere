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
