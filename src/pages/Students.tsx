import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import type {ReactNode} from 'react';
import {Plus,Trash2,RefreshCw,X,UserRound,GraduationCap,UsersRound,Phone,CalendarDays,Search,ChevronRight} from 'lucide-react';
import {createStudent,deleteStudent,getStudents,rows} from '../lib/api';
import {supabase} from '../lib/supabase';
import type {Student} from '../lib/types';

function normalizeClassName(value:string){
  const cleaned=value.trim().replace(/\s+/g,' ');
  const match=cleaned.match(/^grade\s*(\d+)$/i) || cleaned.match(/^(\d+)$/);
  return match ? `Grade ${match[1]}` : cleaned;
}
const blank={full_name:'',student_code:'',gender:'',date_of_birth:'',phone:'',email:'',address:'',parent_name:'',parent_phone:'',emergency_contact:'',class_name:'',roll_no:'',admission_date:new Date().toISOString().slice(0,10),status:'active'};

function ModalLayer({children,onBackdrop}:{children:ReactNode;onBackdrop:()=>void}){
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';return ()=>{document.body.style.overflow=previous}},[]);
  return createPortal(<div className="student-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onBackdrop()}}>{children}</div>,document.body);
}

export default function Students({readOnly=false}:{readOnly?:boolean}){
 const [students,setStudents]=useState<Student[]>([]),[classes,setClasses]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[showAdd,setShowAdd]=useState(false),[form,setForm]=useState(blank),[saving,setSaving]=useState(false),[search,setSearch]=useState(''),[profile,setProfile]=useState<any|null>(null);
 const load=async()=>{setLoading(true);setError('');try{const [s,c]=await Promise.all([getStudents(),rows('classes','*','name',true)]);setStudents(s);setClasses(c.map((x:any)=>({...x,name:normalizeClassName(String(x.name||''))})))}catch(e:any){const raw=[e?.message,e?.details,e?.hint].filter(Boolean).join(' | ');setError(/class_id.*schema cache|column.*class_id.*students/i.test(raw)?'Your existing Supabase database is using the older student schema. Students can still be viewed, but run supabase/FIX_STUDENTS_CLASS_ID.sql to enable the class relationship.':raw||'Could not load students.')}finally{setLoading(false)}};useEffect(()=>{(async()=>{await cleanupEmptyClasses();await load()})()},[]);
 const set=(key:keyof typeof blank,value:string)=>setForm(f=>({...f,[key]:value}));
 const close=()=>{if(!saving){setShowAdd(false);setForm({...blank,admission_date:new Date().toISOString().slice(0,10)})}};
 const cleanupEmptyClasses=async()=>{
   try{
     const [{data:studentRows,error:studentError},{data:classRows,error:classError}]=await Promise.all([
       supabase.from('students').select('class_id,class_name,section'),
       supabase.from('classes').select('id,name,section')
     ]);
     if(studentError||classError) return;
     const usedIds=new Set((studentRows||[]).map((s:any)=>s.class_id).filter(Boolean));
     const usedNames=new Set((studentRows||[]).map((s:any)=>{
       const n=normalizeClassName(String(s.class_name||''));
       return n ? `${n.toLowerCase()}\u0000${String(s.section||'').trim().toLowerCase()}` : '';
     }).filter(Boolean));
     const orphanIds=(classRows||[]).filter((c:any)=>{
       if(usedIds.has(c.id)) return false;
       const n=normalizeClassName(String(c.name||''));
       return !usedNames.has(`${n.toLowerCase()}\u0000${String(c.section||'').trim().toLowerCase()}`);
     }).map((c:any)=>c.id);
     for(const id of orphanIds) await supabase.from('classes').delete().eq('id',id);
   }catch{}
 };

 const getOrCreateClass=async(name:string)=>{
   const normalized=normalizeClassName(name),academicYear=String(new Date().getFullYear());
   if(!normalized)throw new Error('Enter a class name, for example Grade 9.');
   const {data:existing,error:findError}=await supabase.from('classes').select('*').ilike('name',normalized).eq('academic_year',academicYear).order('section',{ascending:true}).limit(1).maybeSingle();
   if(findError)throw findError;if(existing)return existing;
   const {data:created,error:createError}=await supabase.from('classes').insert({name:normalized,section:'',academic_year:academicYear}).select('*').single();
   if(!createError&&created)return created;
   if(createError?.code==='23505'){const {data:retry,error:retryError}=await supabase.from('classes').select('*').ilike('name',normalized).eq('academic_year',academicYear).order('section',{ascending:true}).limit(1).maybeSingle();if(retryError)throw retryError;if(retry)return retry;}
   throw createError||new Error('Could not create the class.');
 };
 const add=async()=>{
   if(!form.full_name.trim()||!form.student_code.trim()||!form.class_name.trim()){setError('Student name, Student ID and Class are required.');return}
   setSaving(true);setError('');
   try{const c=await getOrCreateClass(form.class_name);const payload={full_name:form.full_name.trim(),student_code:form.student_code.trim(),gender:form.gender||null,date_of_birth:form.date_of_birth||null,phone:form.phone||null,email:form.email||null,address:form.address||null,parent_name:form.parent_name||null,parent_phone:form.parent_phone||null,emergency_contact:form.emergency_contact||null,class_id:c.id,class_name:c.name,section:'',roll_no:form.roll_no||null,admission_date:form.admission_date||null,status:form.status};try{await createStudent(payload)}catch(primary:any){const rawPrimary=[primary?.message,primary?.details,primary?.hint].filter(Boolean).join(' | ');if(primary?.code==='PGRST204'||/class_id.*schema cache|column.*class_id.*students/i.test(rawPrimary)){const {class_id,...legacyPayload}=payload;await createStudent(legacyPayload);setError('Student saved. Supabase still needs the class_id migration; run supabase/FIX_STUDENTS_CLASS_ID.sql to enable full class linking.')}else throw primary}setClasses(prev=>prev.some(x=>x.id===c.id)?prev:prev.concat({...c,name:normalizeClassName(String(c.name||''))}));close();await load()}catch(e:any){const raw=[e?.message,e?.details,e?.hint].filter(Boolean).join(' | ');const schemaMissing=e?.code==='PGRST204'||/class_id.*schema cache|column.*class_id.*students/i.test(raw);setError(schemaMissing?'Supabase is missing students.class_id. Run supabase/FIX_STUDENTS_CLASS_ID.sql in the Supabase SQL Editor, then refresh this page.':raw||'Could not save the student.')}finally{setSaving(false)}};
 const filtered=students.filter(s=>`${s.full_name} ${s.student_code} ${s.class_name||''} ${s.section||''} ${s.roll_no||''}`.toLowerCase().includes(search.toLowerCase()));
 const openProfile=async(s:any)=>{try{const {data:att}=await supabase.from('student_attendance').select('attendance_date,status').eq('student_id',s.id).order('attendance_date',{ascending:false});const {data:res}=await supabase.from('results').select('*').eq('student_id',s.id).order('id',{ascending:false}).limit(20);const {data:fees}=await supabase.from('fees').select('*').eq('student_id',s.id).order('month',{ascending:false}).limit(12);setProfile({...s,attendance:att||[],results:res||[],fees:fees||[]})}catch{setProfile(s)}};
 return <div className="page">
   <div className="page-head"><div><span className="eyebrow dark-eyebrow">STUDENT RECORDS</span><h2>Students</h2><p>Manage student records and academic information.</p></div>{!readOnly&&<button className="primary" onClick={()=>{setError('');setForm({...blank,admission_date:new Date().toISOString().slice(0,10)});setShowAdd(true)}}><Plus size={17}/> Add student</button>}</div>
   {error&&<div className="notice error">{error}</div>}
   <div className="panel"><div className="panel-title"><div><b>All Students</b><span className="muted">{filtered.length} records</span></div><div className="student-search"><Search size={16}/><input placeholder="Search name, ID, class or roll no…" value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
   {loading?<div className="empty">Loading students…</div>:filtered.length===0?<div className="empty">No students found.</div>:<div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Roll No.</th><th>Status</th><th/></tr></thead><tbody>{filtered.map(s=><tr key={s.id} className="clickable-row" onClick={()=>openProfile(s)}><td><b>{s.student_code}</b></td><td>{s.full_name}</td><td>{s.class_name?normalizeClassName(s.class_name):'—'}</td><td>{s.roll_no||'—'}</td><td><span className="status">{s.status}</span></td><td><ChevronRight size={16}/>{!readOnly&&<button className="danger-icon" aria-label={`Delete ${s.full_name}`} onClick={async e=>{e.stopPropagation();if(confirm('Delete this student?')){await deleteStudent(s.id);await cleanupEmptyClasses();await load()}}}><Trash2 size={16}/></button>}</td></tr>)}</tbody></table></div>}</div>
   {showAdd&&!readOnly&&<ModalLayer onBackdrop={close}><div className="student-modal" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
     <div className="student-modal-head"><div><span className="eyebrow dark-eyebrow">STUDENT RECORD</span><h2 id="add-student-title">Add New Student</h2><p>Add the student's personal, class and contact information.</p></div><button className="icon-button" aria-label="Close" onClick={close}><X size={19}/></button></div>
     <div className="student-form-grid">
       <section className="student-form-section"><div className="student-section-title"><UserRound size={17}/><div><b>Basic information</b><small>Student identity and details</small></div></div><div className="student-fields two"><label>Full name *<input autoFocus value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="e.g. Ali Khan"/></label><label>Student ID / Admission No. *<input value={form.student_code} onChange={e=>set('student_code',e.target.value)} placeholder="e.g. ES-1006"/></label><label>Gender<select value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Date of birth<input type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)}/></label></div></section>
       <section className="student-form-section"><div className="student-section-title"><GraduationCap size={17}/><div><b>Class placement</b><small>Select or enter a class</small></div></div><div className="student-fields class-placement-fields"><label>Class *<input list="edusphere-class-options" value={form.class_name} onChange={e=>set('class_name',e.target.value)} onBlur={()=>set('class_name',normalizeClassName(form.class_name))} placeholder="e.g. Grade 9" autoComplete="off"/><datalist id="edusphere-class-options">{classes.map(c=><option key={c.id} value={c.name}/>)}</datalist></label><label>Roll number<input value={form.roll_no} onChange={e=>set('roll_no',e.target.value)} placeholder="e.g. 12"/></label><label>Admission date<input type="date" value={form.admission_date} onChange={e=>set('admission_date',e.target.value)}/></label><label>Status<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div></section>
       <section className="student-form-section"><div className="student-section-title"><UsersRound size={17}/><div><b>Parent / guardian</b><small>Primary family contact</small></div></div><div className="student-fields two"><label>Father / Guardian name<input value={form.parent_name} onChange={e=>set('parent_name',e.target.value)}/></label><label>Parent phone<input value={form.parent_phone} onChange={e=>set('parent_phone',e.target.value)}/></label></div></section>
       <section className="student-form-section"><div className="student-section-title"><Phone size={17}/><div><b>Contact</b><small>Contact information</small></div></div><div className="student-fields two"><label>Student phone<input value={form.phone} onChange={e=>set('phone',e.target.value)}/></label><label>Student email<input type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></label><label>Emergency contact<input value={form.emergency_contact} onChange={e=>set('emergency_contact',e.target.value)}/></label><label>Address<textarea value={form.address} onChange={e=>set('address',e.target.value)} rows={2}/></label></div></section>
     </div><div className="student-modal-foot"><span><CalendarDays size={15}/> Required fields are marked *</span><div><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={add} disabled={saving}>{saving?'Saving…':'Save student'}</button></div></div>
   </div></ModalLayer>}
   {profile&&<StudentProfile student={profile} onClose={()=>setProfile(null)}/>}
 </div>
}

function StudentProfile({student,onClose}:{student:any;onClose:()=>void}){const att=student.attendance||[];const p=att.filter((x:any)=>x.status==='present').length,a=att.filter((x:any)=>x.status==='absent').length,l=att.filter((x:any)=>x.status==='leave').length,total=p+a+l;return <ModalLayer onBackdrop={onClose}><div className="student-profile-modal" role="dialog" aria-modal="true" aria-labelledby="student-profile-title"><div className="student-profile-head"><div className="profile-avatar">{student.full_name?.slice(0,1)||'S'}</div><div><span className="eyebrow dark-eyebrow">STUDENT PROFILE</span><h2 id="student-profile-title">{student.full_name}</h2><p>{student.student_code} · {student.class_name?normalizeClassName(student.class_name):'No class'} {student.roll_no?`· Roll ${student.roll_no}`:''}</p></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19}/></button></div><div className="profile-stats"><div><b>{p}</b><span>Present</span></div><div><b>{a}</b><span>Absent</span></div><div><b>{l}</b><span>Leave</span></div><div><b>{total?Math.round((p/total)*100):0}%</b><span>Attendance</span></div></div><div className="profile-sections"><section><h3>Personal & family</h3><p><b>Gender:</b> {student.gender||'—'} · <b>DOB:</b> {student.date_of_birth||'—'}</p><p><b>Parent:</b> {student.parent_name||'—'} · <b>Phone:</b> {student.parent_phone||'—'}</p><p><b>Student phone:</b> {student.phone||'—'} · <b>Email:</b> {student.email||'—'}</p></section><section><h3>Attendance history</h3><div className="profile-history">{att.slice(0,40).map((x:any)=><span key={`${x.attendance_date}-${x.status}`} className={`history-chip ${x.status}`}>{new Date(x.attendance_date+'T00:00:00').toLocaleDateString(undefined,{day:'2-digit',month:'short'})} · {x.status==='present'?'P':x.status==='absent'?'A':'L'}</span>)}</div></section><section><h3>Results</h3><p>{(student.results||[]).length?`${student.results.length} result records available.`:'No result records yet.'}</p></section><section><h3>Fees</h3><p>{(student.fees||[]).length?`${student.fees.length} fee records available.`:'No fee records yet.'}</p></section></div></div></ModalLayer>}
