import {useEffect,useMemo,useState} from 'react';
import {CalendarDays,Check,ChevronLeft,ChevronRight,RefreshCw} from 'lucide-react';
import {rows} from '../lib/api';
import {supabase} from '../lib/supabase';

type ClassRow={id:string;name:string;section?:string;academic_year?:string};
const STATUSES=[{key:'present',label:'P',name:'Present'},{key:'absent',label:'A',name:'Absent'},{key:'leave',label:'L',name:'Leave'}];
const monthStart=(d:string)=>`${d.slice(0,7)}-01`;
const daysInMonth=(ym:string)=>new Date(Number(ym.slice(0,4)),Number(ym.slice(5,7)),0).getDate();
const dateKey=(ym:string,day:number)=>`${ym}-${String(day).padStart(2,'0')}`;
const fmtMonth=(ym:string)=>new Date(`${ym}-01T00:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'});

export default function Attendance({teacher=false,admin=false}:{teacher?:boolean;admin?:boolean}){
 const [classes,setClasses]=useState<ClassRow[]>([]),[selectedClass,setSelectedClass]=useState(''),[people,setPeople]=useState<any[]>([]),[records,setRecords]=useState<Record<string,any>>({}),[myTeacher,setMyTeacher]=useState<any|null>(null);
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7)),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[msg,setMsg]=useState(''),[openCell,setOpenCell]=useState<string|null>(null);
 const peopleTable=teacher?'teachers':'students'; const attendanceTable=teacher?'teacher_attendance':'student_attendance'; const idField=teacher?'teacher_id':'student_id';
 const loadClasses=async()=>{if(teacher){setSelectedClass('');return}try{const c=await rows('classes','*','name',true);const raw=(c as ClassRow[]).filter((x:any)=>String(x.name||'').trim());
   // Attendance must use the same clean class list shown in Classes: no section choices and no duplicate names.
   const normalize=(v:any)=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase();
   const year=String(new Date().getFullYear());
   const seen=new Set<string>(); const clean=raw.filter((x:any)=>{const key=normalize(x.name); if(seen.has(key))return false; seen.add(key); return true;});
   // Prefer the current academic-year record when duplicate class records exist.
   clean.sort((a:any,b:any)=>Number(String(b.academic_year||'')===year)-Number(String(a.academic_year||'')===year) || normalize(a.name).localeCompare(normalize(b.name)));
   setClasses(clean);
   if(selectedClass&&!clean.some(x=>x.id===selectedClass))setSelectedClass(clean[0]?.id||'');else if(!selectedClass&&clean[0])setSelectedClass(clean[0].id)
 }catch(e:any){setError(e?.message||String(e))}};
 useEffect(()=>{loadClasses()},[]);
 const load=async()=>{setLoading(true);setError('');try{
   let p:any[]=[];
   let ownTeacherId:string|null=null;
   if(teacher){
     const {data:{user}}=await supabase.auth.getUser();
     if(!user) throw new Error('You are not signed in.');
     const allTeachers=await rows('teachers','*','full_name',true);
     if(admin){
       p=allTeachers;
       setMyTeacher(null);
     }else{
       const own=allTeachers.find((x:any)=>String(x.profile_id||'')===String(user.id));
       if(!own) throw new Error('Your teacher account is not linked to a teacher record. Ask the administrator to link your login account in Teachers.');
       ownTeacherId=String(own.id);
       setMyTeacher(own);
       p=[own];
     }
   }
   else if(selectedClass){
     const selected=classes.find((c:any)=>String(c.id)===String(selectedClass));
     const normalize=(v:any)=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase();
     const className=normalize(selected?.name);
     p=await rows('students','*','full_name',true).then(x=>x.filter((s:any)=>
       String(s.class_id||'')===String(selectedClass) || (className && normalize(s.class_name)===className)
     ));
     // Keep old records visible even when their class_id has not yet been migrated.
     // Admins can persist the repaired relationship; the UI never invents a different class.
     if(admin && selected){
       for(const student of p){
         if(String(student.class_id||'')!==String(selectedClass)){
           try{await supabase.from('students').update({class_id:selectedClass,section:null}).eq('id',student.id)}catch{}
           student.class_id=selectedClass;
         }
       }
     }
   }
   setPeople(p.filter((x:any)=>x.status!=='inactive'));
   if(!p.length){setRecords({});setLoading(false);return}
   const start=monthStart(month), end=`${month}-${String(daysInMonth(month)).padStart(2,'0')}`;
   let attendanceQuery:any=supabase.from(attendanceTable).select('*').gte('attendance_date',start).lte('attendance_date',end);
   if(teacher && !admin && ownTeacherId) attendanceQuery=attendanceQuery.eq('teacher_id',ownTeacherId);
   const {data,error:e}=await attendanceQuery; if(e)throw e;
   const m:any={};(data||[]).forEach((x:any)=>{m[`${x[idField]}|${x.attendance_date}`]=x});setRecords(m);
 }catch(e:any){setError(e?.message||String(e));setPeople([]);setRecords({})}finally{setLoading(false)}};
 useEffect(()=>{load()},[month,selectedClass,teacher]);
 const days=useMemo(()=>Array.from({length:daysInMonth(month)},(_,i)=>i+1),[month]);
 const className=classes.find(c=>c.id===selectedClass); const monthLabel=fmtMonth(month);
 const choose=(personId:string,day:number,status:string)=>{const key=`${personId}|${dateKey(month,day)}`;if(!admin&&records[key])return;setRecords(prev=>({...prev,[key]:{...(prev[key]||{}),[idField]:personId,attendance_date:dateKey(month,day),status}}));setOpenCell(null)};
 const setAll=(status:string)=>{const next:any={...records};for(const p of people)for(const d of days){const k=`${p.id}|${dateKey(month,d)}`;if(admin||!next[k])next[k]={...(next[k]||{}),[idField]:p.id,attendance_date:dateKey(month,d),status};}setRecords(next)};
 const save=async()=>{setSaving(true);setError('');setMsg('');try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('You are not signed in.');
   for(const p of people)for(const d of days){const k=`${p.id}|${dateKey(month,d)}`,r=records[k];if(!r||!r.status)continue;if(!admin&&records[k]?.created_at)continue;
     // Teacher attendance is always written against the teacher record linked to the signed-in account.
     // The teacher cannot choose or alter another teacher's ID in the UI, and Supabase RLS enforces the same rule.
     const attendancePersonId=teacher&&!admin ? myTeacher?.id : p.id;
     if(!attendancePersonId) throw new Error('Your teacher account is not linked to a teacher record.');
     const payload:any={[idField]:attendancePersonId,attendance_date:dateKey(month,d),status:r.status,marked_by:user.id};
     const q=admin?supabase.from(attendanceTable).upsert(payload,{onConflict:`${idField},attendance_date`}):supabase.from(attendanceTable).insert(payload);
     const {error:e}=await q;if(e&&e.code!=='23505')throw e;
   }
   setMsg(`${teacher?'Teacher':'Student'} attendance saved for ${monthLabel}.`);await load();setTimeout(()=>setMsg(''),2500);
 }catch(e:any){setError('Save failed: '+[e?.message,e?.details,e?.hint,e?.code].filter(Boolean).join(' | '))}finally{setSaving(false)}};
 const prevMonth=()=>setMonth(new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-2,1).toISOString().slice(0,7));
 const nextMonth=()=>setMonth(new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),1).toISOString().slice(0,7));
 return <section className="page attendance-page">
  <div className="page-head"><div><span className="eyebrow dark-eyebrow">ATTENDANCE HISTORY</span><h2>{teacher?'Teacher Attendance':'Student Attendance'}</h2><p>{admin?'Admin can record and correct any P/A/L entry.':`Saved ${teacher?'teacher':'student'} attendance is locked after entry.`}</p></div><button className="primary" onClick={save} disabled={saving||loading}>{saving?'Saving…':'Save Attendance'}</button></div>
  {error&&<div className="notice error">{error}</div>}{msg&&<div className="success">{msg}</div>}
  <div className="attendance-toolbar card">
   {!teacher&&<label>Class<select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} disabled={!classes.length}>{classes.length?classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>):<option value="">No classes available</option>}</select></label>}
   <div className="month-picker"><button className="icon-button" onClick={prevMonth}><ChevronLeft size={17}/></button><div><small>Month</small><b>{monthLabel}</b></div><button className="icon-button" onClick={nextMonth}><ChevronRight size={17}/></button><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
   <div className="attendance-actions"><button className="secondary" onClick={()=>setAll('present')}><Check size={15}/> Mark all P</button><button className="secondary" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
  </div>
  <div className="attendance-legend"><span><b className="att-dot p">P</b> Present</span><span><b className="att-dot a">A</b> Absent</span><span><b className="att-dot l">L</b> Leave</span></div>
  <div className="attendance-summary">{!teacher&&className&&<b>{className.name}</b>}{teacher&&!admin&&myTeacher&&<b>My attendance · {myTeacher.full_name}</b>}<span>{people.length} {teacher?'teacher':'students'}</span></div>
  <div className="attendance-table-wrap">{loading?<div className="empty">Loading attendance…</div>:!teacher&&!selectedClass?<div className="empty"><CalendarDays size={32}/><h3>Select a class</h3><p>Choose a class to see every student assigned to it.</p></div>:people.length===0?<div className="empty">No {teacher?'teachers':'students'} found for this selection.</div>:<table className="attendance-grid"><thead><tr><th className="sticky-student">{teacher?'Teacher':'Student'}</th>{days.map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{people.map(p=><tr key={p.id}><th className="sticky-student"><b>{p.full_name}</b><small>{teacher?p.employee_code:p.student_code}</small></th>{days.map(d=>{const k=`${p.id}|${dateKey(month,d)}`,r=records[k],locked=!admin&&!!r?.created_at;return <td key={d} className="att-cell"><button disabled={locked} className={`att-box ${r?.status||'empty'} ${locked?'locked':''}`} onClick={()=>setOpenCell(openCell===k?null:k)}>{r?.status?STATUSES.find(s=>s.key===r.status)?.label:'·'}</button>{openCell===k&&!locked&&<div className="att-menu"><button onClick={()=>choose(p.id,d,'present')}>P <span>Present</span></button><button onClick={()=>choose(p.id,d,'absent')}>A <span>Absent</span></button><button onClick={()=>choose(p.id,d,'leave')}>L <span>Leave</span></button></div>}</td>})}</tr>)}</tbody></table>}</div>
  <div className="attendance-footnote">Previous months remain saved with their exact dates. <b>Teachers can mark only their own attendance.</b> Once saved, teacher attendance cannot be changed by the teacher; only Admin can edit it.</div>
 </section>
}
