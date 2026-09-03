import {useEffect,useState} from 'react';
import {rows} from '../lib/api';
import {supabase} from '../lib/supabase';

export default function Attendance({teacher=false,admin=false}:{teacher?:boolean;admin?:boolean}){
  const [people,setPeople]=useState<any[]>([]),[records,setRecords]=useState<Record<string,any>>({}),[statuses,setStatuses]=useState<Record<string,string>>({}),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[msg,setMsg]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const peopleTable=teacher?'teachers':'students';
  const attendanceTable=teacher?'teacher_attendance':'student_attendance';
  const idField=teacher?'teacher_id':'student_id';
  const load=async()=>{setLoading(true);setError('');try{
    const p=await rows(peopleTable,'*','full_name',true);
    setPeople(p.filter((x:any)=>x.status!=='inactive'));
    const {data,error:e}=await supabase.from(attendanceTable).select('*').eq('attendance_date',date);
    if(e)throw e;
    const m:any={},rm:any={};(data||[]).forEach(x=>{m[x[idField]]=x.status;rm[x[idField]]=x});setStatuses(m);setRecords(rm);
  }catch(e:any){setError(e?.message||String(e));setPeople([])}finally{setLoading(false)}};
  useEffect(()=>{load()},[date,teacher]);
  const setAll=(s:string)=>{const m:any={...statuses};people.forEach(p=>{if(admin||!records[p.id])m[p.id]=s});setStatuses(m)};
  const save=async()=>{setSaving(true);setError('');setMsg('');try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('You are not signed in.');
    for(const p of people){
      if(!admin && records[p.id]) continue;
      const payload:any=teacher?{teacher_id:p.id,attendance_date:date,status:statuses[p.id]||'present',marked_by:user.id}:{student_id:p.id,attendance_date:date,status:statuses[p.id]||'present',marked_by:user.id};
      const q=admin
        ? supabase.from(attendanceTable).upsert(payload,{onConflict:teacher?'teacher_id,attendance_date':'student_id,attendance_date'})
        : supabase.from(attendanceTable).insert(payload);
      const {error:e}=await q;if(e)throw e;
    }
    setMsg(`${teacher?'Teacher':'Student'} attendance saved successfully.`);await load();setTimeout(()=>setMsg(''),2500);
  }catch(e:any){const text=[e?.message,e?.details,e?.hint,e?.code].filter(Boolean).join(' | ');setError('Save failed: '+(text||String(e)))}finally{setSaving(false)}};
  return <section className="page"><div className="page-head"><div><h2>{teacher?'Teacher Attendance':'Student Attendance'}</h2><p>{admin?'Admin can add and change attendance.':`You can enter ${teacher?'teacher':'student'} attendance once. Saved records are locked.`}</p></div><button className="primary" onClick={save} disabled={saving||loading}>{saving?'Saving…':admin?'Save Attendance':'Save New Attendance'}</button></div><div className="toolbar"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><button className="secondary" onClick={()=>setAll('present')}>Mark All Present</button><button className="secondary" onClick={()=>setAll('absent')}>Mark All Absent</button><button className="secondary" onClick={load}>↻ Refresh</button></div>{msg&&<div className="success">{msg}</div>}{error&&<div className="alert"><strong>{error}</strong></div>}<div className="table-wrap">{loading?<div className="empty">Loading…</div>:people.length===0?<div className="empty">No {teacher?'teachers':'students'} found.</div>:<table><thead><tr><th>{teacher?'Teacher':'Student'}</th><th>Class</th><th>Status</th><th>Record</th></tr></thead><tbody>{people.map(p=>{const locked=!admin&&!!records[p.id];return <tr key={p.id}><td><b>{p.full_name}</b><small>{teacher?p.employee_code:p.student_code}</small></td><td>{teacher?'—':`${p.class_name||''} ${p.section||''}`}</td><td><select disabled={locked} value={statuses[p.id]||'present'} onChange={e=>setStatuses({...statuses,[p.id]:e.target.value})}><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option><option value="late">Late</option></select></td><td>{locked?<span className="status">Locked</span>:<span className="muted">New</span>}</td></tr>})}</tbody></table>}</div></section>
}
