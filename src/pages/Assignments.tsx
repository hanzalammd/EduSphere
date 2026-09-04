import {useEffect,useState} from 'react';
import {rows,insertRow,updateRow,deleteRow} from '../lib/api';
import Modal from '../components/Modal';

export default function Assignments({teacher=false,admin=false}:{teacher?:boolean;admin?:boolean}){
 const [items,setItems]=useState<any[]>([]),[teachers,setTeachers]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(false),[editing,setEditing]=useState<any|null>(null),[search,setSearch]=useState('');
 const load=async()=>{setLoading(true);try{const [a,t]=await Promise.all([rows('assignments','*,teacher:teachers(id,full_name,employee_code)','created_at',false),rows('teachers','id,full_name,employee_code','full_name',true)]);setItems(a);setTeachers(t);setError('')}catch(e:any){setError(e.message||String(e))}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const save=async(e:any)=>{e.preventDefault();setError('');const f=new FormData(e.currentTarget);const title=String(f.get('title')||'').trim(),subject=String(f.get('subject')||'').trim();if(!title||!subject){setError('Title and Subject are required.');return}const p={title,subject,class_name:String(f.get('class_name')||'').trim()||null,description:String(f.get('description')||'').trim()||null,due_date:String(f.get('due_date')||'')||null,teacher_id:String(f.get('teacher_id')||'')||null,status:String(f.get('status')||'active')};try{if(editing)await updateRow('assignments',editing.id,p);else await insertRow('assignments',p);setOpen(false);setEditing(null);load()}catch(e:any){setError(e.message||String(e))}};
 const filtered=items.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
 return <section className="page">
  <div className="page-head"><div><h2>Assignments</h2><p>{teacher&&!admin?'Add assignments once; saved records cannot be edited.':'Create and manage class assignments with teacher information.'}</p></div>{(admin||teacher)&&<button className="primary" onClick={()=>{setEditing(null);setOpen(true)}}>＋ Add Assignment</button>}</div>
  <div className="toolbar"><input placeholder="Search assignments..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="secondary" onClick={load}>↻ Refresh</button></div>
  {error&&<div className="alert">{error}</div>}
  <div className="table-wrap">{loading?<div className="empty">Loading…</div>:filtered.length===0?<div className="empty">No assignments found.</div>:
   <table><thead><tr><th>Title</th><th>Subject</th><th>Class</th><th>Due Date</th><th>Teacher</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>{filtered.map(r=><tr key={r.id}><td><b>{r.title}</b><small>{r.description||''}</small></td><td>{r.subject}</td><td>{r.class_name||'—'}</td><td>{r.due_date||'—'}</td><td>{r.teacher?.full_name || teachers.find(t=>String(t.id)===String(r.teacher_id))?.full_name || 'Unassigned'}</td><td>{r.status||'active'}</td><td>{admin?<><button className="link-btn" onClick={()=>{setEditing(r);setOpen(true)}}>Edit</button><button className="danger-link" onClick={async()=>{if(confirm('Delete this assignment?')){try{await deleteRow('assignments',r.id);load()}catch(e:any){setError(e.message)}}}}>Delete</button></>:<span className="status">Locked</span>}</td></tr>)}</tbody></table>}
  </div>
  {open&&<Modal title={editing?'Edit Assignment':'Add Assignment'} onClose={()=>{setOpen(false);setEditing(null)}}><form className="form-grid" onSubmit={save}>
   <label>Title *<input name="title" defaultValue={editing?.title||''} required/></label><label>Subject *<input name="subject" defaultValue={editing?.subject||''} required/></label><label>Class<input name="class_name" defaultValue={editing?.class_name||''}/></label><label>Due Date<input name="due_date" type="date" defaultValue={editing?.due_date||''}/></label><label>Teacher<select name="teacher_id" defaultValue={editing?.teacher_id||''}><option value="">Unassigned</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}{t.employee_code?` (${t.employee_code})`:''}</option>)}</select></label><label>Description<textarea name="description" rows={4} defaultValue={editing?.description||''}/></label><label>Status<select name="status" defaultValue={editing?.status||'active'}><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select></label>
   <div className="form-actions"><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary">Save</button></div>
  </form></Modal>}
 </section>
}
