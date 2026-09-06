import {useEffect,useMemo,useState} from 'react';
import {CalendarClock,CalendarDays,Plus,RefreshCw,Save,School,Users,X,Trash2} from 'lucide-react';
import {insertRow,rows,upsertRow,deleteRow} from '../lib/api';
import {supabase} from '../lib/supabase';
import Modal from '../components/Modal';

const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const normalizeClassName=(value:string)=>{
  const cleaned=value.trim().replace(/\s+/g,' ');
  const numeric=cleaned.match(/^grade\s*(\d+)$/i) || cleaned.match(/^(\d+)$/);
  if(numeric) return `Grade ${numeric[1]}`;
  return cleaned;
};
const TIMES=['08:00','08:40','09:20','10:00','10:40','11:20','12:00','12:40'];
const plus40=(t:string)=>{const [h,m]=t.split(':').map(Number);const d=new Date(2000,0,1,h,m+40);return d.toTimeString().slice(0,5)};
type C={id:string;name:string;section:string;academic_year:string;class_teacher_id?:string|null};

type Slot={id?:string;class_id:string;day_of_week:string;period_no:number;start_time:string;end_time:string;subject:string;teacher_id?:string|null};

async function updateStudentClass(studentId:string,classId:string){const {error}=await supabase.from('students').update({class_id:classId,section:''}).eq('id',studentId);if(error)throw error}

export default function Classes({readOnly=false}:{readOnly?:boolean}){
 const [classes,setClasses]=useState<C[]>([]),[teachers,setTeachers]=useState<any[]>([]),[students,setStudents]=useState<any[]>([]),[slots,setSlots]=useState<Slot[]>([]),[sheets,setSheets]=useState<any[]>([]);
 const [selected,setSelected]=useState<C|null>(null),[day,setDay]=useState('Monday'),[tab,setTab]=useState<'timetable'|'students'|'dates'>('timetable');
 const [showAdd,setShowAdd]=useState(false),[showDate,setShowDate]=useState(false),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const currentAcademicYear=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getFullYear()+1).slice(-2)}`};
 const [newClass,setNewClass]=useState({name:'',academic_year:currentAcademicYear(),class_teacher_id:''});
 const [newDate,setNewDate]=useState({exam_name:'',exam_date:'',subject:'',start_time:'09:00',end_time:'10:00',room:''});

 const load=async()=>{
   setLoading(true);setError('');
   try{
     const [c,t,s]=await Promise.all([rows('classes','*','name',true),rows('teachers','*','full_name',true),rows('students','*','full_name',true)]);
     const rawClasses=c as C[];
     const studentRows=s as any[];
     const year=currentAcademicYear();

     // Classes are derived from student records. An empty/stale class must never
     // appear in the Classes screen, even if an old database row still exists.
     const usedKeys=new Set<string>();
     const usedIds=new Set<string>();
     for(const student of studentRows){
       const n=normalizeClassName(String(student.class_name||''));
       if(n) usedKeys.add(`${n.toLowerCase()}\u0000${String(student.section||'').trim().toLowerCase()}`);
       if(student.class_id) usedIds.add(String(student.class_id));
     }

     // Prefer the class_id relationship, then fall back to the student's class name.
     const activeClasses=rawClasses.filter((c:any)=>{
       if(usedIds.has(String(c.id))) return true;
       const n=normalizeClassName(String(c.name||''));
       return !!n && usedKeys.has(`${n.toLowerCase()}\u0000${String(c.section||'').trim().toLowerCase()}`);
     });

     // If a student has a class name but no class row, create it for admin users.
     // Teachers/read-only users only see the classes that already exist.
     let synced=[...activeClasses];
     const studentNames=[...new Set(studentRows.map(x=>normalizeClassName(String(x.class_name||''))).filter(Boolean))];
     if(!readOnly){
       for(const name of studentNames){
         let clean=synced.find(x=>normalizeClassName(String(x.name||'')).toLowerCase()===name.toLowerCase() && String(x.section||'')==='');
         if(!clean){
           try{
             const created=await insertRow('classes',{name,section:'',academic_year:year,class_teacher_id:null}) as C;
             clean=created;synced.push(created);
           }catch{}
         }
         if(clean){
           for(const student of studentRows.filter(x=>normalizeClassName(String(x.class_name||'')).toLowerCase()===name.toLowerCase())){
             if(String(student.class_id||'')!==String(clean.id)){
               try{await updateStudentClass(student.id,clean.id)}catch{}
             }
           }
         }
       }
     }

     const cleanClasses=synced
       .filter((x:any)=>String(x.name||'').trim())
       .map((x:any)=>({...x,name:normalizeClassName(String(x.name))}))
       .sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name),undefined,{numeric:true,sensitivity:'base'}))
       .filter((x:any,i:number,arr:any[])=>arr.findIndex((y:any)=>String(y.name).trim().toLowerCase()===String(x.name).trim().toLowerCase())===i);

     // Admin cleanup: remove stale class rows from the database too. This makes
     // the database match what the UI shows, while still allowing classes to be
     // recreated automatically when a student is added later.
     if(!readOnly){
       const keepIds=new Set(cleanClasses.map(x=>String(x.id)));
       for(const c of rawClasses){
         if(!keepIds.has(String(c.id))){
           try{await supabase.from('classes').delete().eq('id',c.id)}catch{}
         }
       }
     }

     setClasses(cleanClasses);
     setTeachers(t);
     setStudents(studentRows.map(student=>{
       const name=normalizeClassName(String(student.class_name||''));
       const clean=cleanClasses.find(x=>x.name.trim().toLowerCase()===name.toLowerCase());
       return clean&&String(student.class_id||'')!==String(clean.id)&&!readOnly?{...student,class_id:clean.id}:{...student};
     }));
     const [p,d]=await Promise.all([
       rows('class_timetable','*','period_no',true).catch(()=>[]),
       rows('class_date_sheet','*','exam_date',true).catch(()=>[])
     ]);
     setSlots(p as Slot[]);setSheets(d);
   }catch(e:any){setError(e?.message||'Unable to load classes. Please check the database connection.')}
   finally{setLoading(false)}
 };
 useEffect(()=>{load()},[]);

 const classStudents=useMemo(()=>selected?students.filter(s=>String(s.class_id||'')===String(selected.id)||(normalizeClassName(String(s.class_name||''))===normalizeClassName(String(selected.name||''))&&String(s.section||'')===String(selected.section||''))):[],[students,selected]);
 const daySlots=useMemo(()=>selected?slots.filter(s=>String(s.class_id)===String(selected.id)&&s.day_of_week===day).sort((a,b)=>a.period_no-b.period_no):[],[slots,selected,day]);
 const classSheets=useMemo(()=>selected?sheets.filter(s=>String(s.class_id)===String(selected.id)):[],[sheets,selected]);
 const teacherName=(id?:string|null)=>teachers.find(t=>String(t.id)===String(id))?.full_name||'Not assigned';

 const closeDetails=()=>{setSelected(null);setTab('timetable');setDay('Monday')};
 const openAdd=()=>{setError('');setNewClass({name:'',academic_year:currentAcademicYear(),class_teacher_id:''});setShowAdd(true)};
 const addClass=async(e:any)=>{
   e.preventDefault();if(saving)return;
   const name=normalizeClassName(newClass.name),year=newClass.academic_year.trim();
   if(!name||!year){setError('Class name and academic year are required.');return}
   if(classes.some(c=>c.name.toLowerCase()===name.toLowerCase()&&c.academic_year===year)){setError('This class already exists for the selected academic year.');return}
   setSaving(true);setError('');
   try{const c=await insertRow('classes',{name,section:'',academic_year:year,class_teacher_id:newClass.class_teacher_id||null}) as C;setClasses(x=>[...x,c]);setSelected(c);setShowAdd(false);setNewClass({name:'',academic_year:currentAcademicYear(),class_teacher_id:''})}
   catch(e:any){setError([e?.message,e?.details,e?.hint].filter(Boolean).join(' | ')||'Could not add the class.')}
   finally{setSaving(false)}
 };
 const updateSlot=(period:number,key:'subject'|'teacher_id',value:string)=>{
   if(!selected)return;
   setSlots(prev=>{const existing=prev.find(s=>String(s.class_id)===String(selected.id)&&s.day_of_week===day&&s.period_no===period);if(existing)return prev.map(s=>s===existing?{...s,[key]:value}:s);const i=period-1;return [...prev,{class_id:selected.id,day_of_week:day,period_no:period,start_time:TIMES[i],end_time:plus40(TIMES[i]),subject:'',teacher_id:null,[key]:value}]});
 };
 const saveTimetable=async()=>{
   if(!selected)return;setSaving(true);setError('');
   try{const current=Array.from({length:8},(_,i)=>slots.find(s=>String(s.class_id)===String(selected.id)&&s.day_of_week===day&&s.period_no===i+1));for(let i=0;i<8;i++){const s=current[i];if(!s)continue;await upsertRow('class_timetable',{class_id:selected.id,day_of_week:day,period_no:i+1,start_time:s.start_time||TIMES[i],end_time:s.end_time||plus40(TIMES[i]),subject:String(s.subject||'').trim()||'—',teacher_id:s.teacher_id||null},'class_id,day_of_week,period_no')}await load()}
   catch(e:any){setError([e?.message,e?.details,e?.hint].filter(Boolean).join(' | ')||'Could not save the timetable. Run ONE_CLICK_SETUP.sql in Supabase first.')}
   finally{setSaving(false)}
 };
 const addDate=async(e:any)=>{
   e.preventDefault();if(!selected||saving)return;const n=newDate.exam_name.trim(),subject=newDate.subject.trim();if(!n||!newDate.exam_date||!subject){setError('Exam name, date and subject are required.');return}
   if(classSheets.some(s=>s.exam_name.toLowerCase()===n.toLowerCase()&&s.exam_date===newDate.exam_date&&s.subject.toLowerCase()===subject.toLowerCase())){setError('This exam entry already exists for this class.');return}
   setSaving(true);setError('');try{await insertRow('class_date_sheet',{class_id:selected.id,exam_name:n,exam_date:newDate.exam_date,subject,start_time:newDate.start_time||null,end_time:newDate.end_time||null,room:newDate.room.trim()||null});setShowDate(false);setNewDate({exam_name:'',exam_date:'',subject:'',start_time:'09:00',end_time:'10:00',room:''});await load()}catch(e:any){setError(e?.message||'Could not add the date-sheet entry.')}finally{setSaving(false)}
 };
 const removeDate=async(id:string)=>{if(!confirm('Delete this date-sheet entry?'))return;try{await deleteRow('class_date_sheet',id);await load()}catch(e:any){setError(e?.message||'Could not delete the entry.')}};
 const deleteClass=async(c:C)=>{
   if(readOnly||saving)return;
   const linked=students.filter(s=>String(s.class_id||'')===String(c.id) || (normalizeClassName(String(s.class_name||''))===normalizeClassName(String(c.name||'')) && String(s.section||'')===String(c.section||'')));
   const message=linked.length
     ? `Delete ${c.name}? This will remove the class and unlink ${linked.length} student${linked.length===1?'':'s'} from it. Student records will not be deleted.`
     : `Delete ${c.name}? This class will be removed permanently.`;
   if(!confirm(message))return;
   setSaving(true);setError('');
   try{
     // Unlink students first so the class is not immediately recreated by the sync logic.
     for(const student of linked){
       const {error:e}=await supabase.from('students').update({class_id:null,class_name:'',section:''}).eq('id',student.id);
       if(e)throw e;
     }
     const {error:e}=await supabase.from('classes').delete().eq('id',c.id);
     if(e)throw e;
     if(selected&&String(selected.id)===String(c.id))closeDetails();
     await load();
   }catch(e:any){setError([e?.message,e?.details,e?.hint].filter(Boolean).join(' | ')||'Could not delete the class.');}
   finally{setSaving(false)}
 };

 return <section className="page classes-page">
   {error&&<div className="notice error"><b>Something needs attention</b><span>{error}</span></div>}
   <div className="page-head classes-head"><div><span className="eyebrow dark-eyebrow">ACADEMIC</span><h2>Classes</h2><p>Manage classes, timetables and exam schedules.</p></div></div>
   {!selected ? (
     <div className="classes-overview card">
       <div className="section-heading"><div><h3>All Classes</h3><p>Select a class to open its details.</p></div><button className="secondary small" onClick={load} aria-label="Refresh classes"><RefreshCw size={15}/></button></div>
       {loading ? <div className="empty">Loading classes…</div> : classes.length === 0 ? (
         <div className="empty-state-box"><School size={24}/><b>No classes yet</b><span>Create the first class to get started.</span></div>
       ) : (
         <div className="class-cards clean-class-grid">{classes.map(c => <div key={c.id} className="class-card">
           <button className="class-card-open" onClick={() => {setSelected(c);setTab('timetable');setDay('Monday')}}><span className="class-icon"><School size={19}/></span><span><b>{c.name}</b><small>{teacherName(c.class_teacher_id)}</small></span></button>
           {!readOnly && <button className="class-delete-btn" title={`Delete ${c.name}`} aria-label={`Delete ${c.name}`} onClick={() => deleteClass(c)} disabled={saving}><Trash2 size={16}/></button>}
           <button className="class-arrow-btn" aria-label={`Open ${c.name}`} onClick={() => {setSelected(c);setTab('timetable');setDay('Monday')}}>›</button>
         </div>)}</div>
       )}
     </div>
   ) : <div className="modal-backdrop class-details-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetails()}}><div className="class-detail card class-details-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} class details`}>
      <div className="class-detail-top"><div><span className="eyebrow dark-eyebrow">CLASS</span><h2>{selected.name}</h2><p>Academic year {selected.academic_year} · Class teacher <b>{teacherName(selected.class_teacher_id)}</b></p></div><div className="class-detail-head-actions">{!readOnly&&<button className="danger-link class-delete-detail" onClick={()=>deleteClass(selected)} disabled={saving}><Trash2 size={15}/> Delete class</button>}<button className="close-detail" onClick={closeDetails}><X size={17}/> Close</button></div></div>
      <div className="class-tabs"><button className={tab==='timetable'?'active':''} onClick={()=>setTab('timetable')}><CalendarClock size={15}/> Timetable</button><button className={tab==='students'?'active':''} onClick={()=>setTab('students')}><Users size={15}/> Students <span>{classStudents.length}</span></button><button className={tab==='dates'?'active':''} onClick={()=>setTab('dates')}><CalendarDays size={15}/> Date sheet <span>{classSheets.length}</span></button></div>
      {tab==='timetable'&&<><div className="detail-toolbar"><div className="day-tabs">{DAYS.map(d=><button key={d} className={day===d?'active':''} onClick={()=>setDay(d)}>{d}</button>)}</div>{!readOnly&&<button className="secondary" onClick={()=>setSlots(prev=>{const next=[...prev];for(let i=0;i<8;i++)if(!next.some(s=>String(s.class_id)===String(selected.id)&&s.day_of_week===day&&s.period_no===i+1))next.push({class_id:selected.id,day_of_week:day,period_no:i+1,start_time:TIMES[i],end_time:plus40(TIMES[i]),subject:'',teacher_id:null});return next})}>Build 8 periods</button>}{!readOnly&&<button className="primary" onClick={saveTimetable} disabled={saving}><Save size={16}/> {saving?'Saving…':'Save timetable'}</button>}</div><div className="timetable-grid">{Array.from({length:8},(_,i)=>{const p=daySlots.find(s=>s.period_no===i+1);return <div className="timetable-row" key={i}><b className="period-badge">P{i+1}</b><span className="time-cell">{p?.start_time||TIMES[i]} – {p?.end_time||plus40(TIMES[i])}</span>{readOnly?<><span>{p?.subject||'—'}</span><span>{teacherName(p?.teacher_id)}</span></>:<><input value={p?.subject||''} onChange={e=>updateSlot(i+1,'subject',e.target.value)} placeholder="Subject"/><select value={p?.teacher_id||''} onChange={e=>updateSlot(i+1,'teacher_id',e.target.value)}><option value="">Select teacher</option>{teachers.filter(t=>t.status!=='inactive').map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></>}</div>})}</div></>}
      {tab==='students'&&<div className="detail-table table-wrap"><table><thead><tr><th>Student ID</th><th>Name</th><th>Roll No.</th><th>Status</th></tr></thead><tbody>{classStudents.length?classStudents.map(s=><tr key={s.id}><td>{s.student_code}</td><td><b>{s.full_name}</b></td><td>{s.roll_no||'—'}</td><td>{s.status||'active'}</td></tr>):<tr><td colSpan={4}>No students are assigned to this class yet.</td></tr>}</tbody></table></div>}
      {tab==='dates'&&<><div className="detail-actions">{!readOnly&&<button className="primary" onClick={()=>setShowDate(true)}><Plus size={16}/> Add exam</button>}</div><div className="detail-table table-wrap"><table><thead><tr><th>Exam</th><th>Date</th><th>Subject</th><th>Time</th><th>Room</th>{!readOnly&&<th/>}</tr></thead><tbody>{classSheets.length?classSheets.map(s=><tr key={s.id}><td><b>{s.exam_name}</b></td><td>{new Date(s.exam_date+'T00:00:00').toLocaleDateString()}</td><td>{s.subject}</td><td>{s.start_time&&s.end_time?`${s.start_time} – ${s.end_time}`:'—'}</td><td>{s.room||'—'}</td>{!readOnly&&<td><button className="danger-link" onClick={()=>removeDate(s.id)}><Trash2 size={14}/> Delete</button></td>}</tr>):<tr><td colSpan={readOnly?5:6}>No exam dates have been added.</td></tr>}</tbody></table></div></>}
   </div></div>}
   {showDate&&selected&&!readOnly&&<Modal title={`Add Exam — ${selected.name}`} onClose={()=>setShowDate(false)}><form className="form-grid" onSubmit={addDate}><label>Exam name *<input autoFocus value={newDate.exam_name} onChange={e=>setNewDate(x=>({...x,exam_name:e.target.value}))} placeholder="e.g. Mid Term" required/></label><label>Subject *<input value={newDate.subject} onChange={e=>setNewDate(x=>({...x,subject:e.target.value}))} placeholder="e.g. Mathematics" required/></label><label>Date *<input type="date" value={newDate.exam_date} onChange={e=>setNewDate(x=>({...x,exam_date:e.target.value}))} required/></label><label>Room<input value={newDate.room} onChange={e=>setNewDate(x=>({...x,room:e.target.value}))} placeholder="e.g. Room 4"/></label><label>Start time<input type="time" value={newDate.start_time} onChange={e=>setNewDate(x=>({...x,start_time:e.target.value}))}/></label><label>End time<input type="time" value={newDate.end_time} onChange={e=>setNewDate(x=>({...x,end_time:e.target.value}))}/></label><div className="form-actions"><button type="button" className="secondary" onClick={()=>setShowDate(false)}>Cancel</button><button className="primary" disabled={saving}>{saving?'Saving…':'Save exam'}</button></div></form></Modal>}
 </section>
}
