import { supabase } from './supabase';

export async function rows(table: string, select='*', order='created_at', ascending=false) {
  let q:any = supabase.from(table).select(select);
  if(order) q=q.order(order,{ascending});
  let {data,error}=await q;
  // Some existing tables (notably Classes) may not have created_at.
  // Retry the same query without sorting so the module still works.
  if(error && order && (error.code==='42703' || /does not exist/i.test(error.message||''))){
    const retry=await supabase.from(table).select(select);
    data=retry.data; error=retry.error;
  }
  if(error) throw error; return data??[];
}
export async function upsertRow(table:string, payload:any, onConflict?:string){const {data,error}=await supabase.from(table).upsert(payload,{onConflict}).select().single();if(error)throw error;return data;}
export async function insertRow(table:string, payload:any){const {data,error}=await supabase.from(table).insert(payload).select().single();if(error)throw error;return data;}
export async function updateRow(table:string,id:string,payload:any){const {data,error}=await supabase.from(table).update(payload).eq('id',id).select().single();if(error)throw error;return data;}
export async function deleteRow(table:string,id:string){const {error}=await supabase.from(table).delete().eq('id',id);if(error)throw error;}
export async function getProfile(){const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).single();if(error)throw error;return data;}
export async function saveAttendance(table:string, items:any[], date:string, markedBy?:string){
 for(const item of items){const payload={...item,attendance_date:date,marked_by:markedBy}; const {error}=await supabase.from(table).upsert(payload,{onConflict: table==='student_attendance'?'student_id,attendance_date':'teacher_id,attendance_date'});if(error)throw error;}
}

// Student-specific helpers used by the Students page.
export async function getStudents(){
  // Keep the Students page readable on older Supabase databases that do not yet have class_id.
  // New databases still return class_id because the wildcard fallback is attempted second.
  const columns='id,student_code,full_name,gender,date_of_birth,phone,email,address,parent_name,parent_phone,emergency_contact,class_name,section,roll_no,admission_date,status,created_at,updated_at';
  const legacy=await rows('students',columns,'created_at',false);
  try{
    const {data,error}=await supabase.from('students').select('id,class_id');
    if(!error && data) { const ids=new Map(data.map((row:any)=>[row.id,row.class_id])); return legacy.map((s:any)=>({...s,class_id:ids.get(s.id)??null})); }
  }catch{}
  return legacy;
}
export async function createStudent(payload:any){
  return insertRow('students',payload);
}
export async function deleteStudent(id:string){
  return deleteRow('students',id);
}
