import {useEffect,useState} from 'react';
import {rows,insertRow,updateRow,deleteRow} from '../lib/api';
import Modal from '../components/Modal';

export default function Teachers({readOnly=false}:{readOnly?:boolean}){
 const [data,setData]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(false),[editing,setEditing]=useState<any|null>(null),[search,setSearch]=useState('');
 const load=async()=>{setLoading(true);try{setData(await rows('teachers','*','created_at',false));setError('')}catch(e:any){setError(e?.message||String(e))}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const save=async(e:any)=>{e.preventDefault();setError('');const fd=new FormData(e.currentTarget);const p={employee_code:String(fd.get('employee_code')||'').trim(),full_name:String(fd.get('full_name')||'').trim(),phone:String(fd.get('phone')||'').trim()||null,email:String(fd.get('email')||'').trim()||null,subject:String(fd.get('subject')||'').trim()||null,status:String(fd.get('status')||'active')||'active'};if(!p.employee_code||!p.full_name){setError('Employee ID and Name are required.');return}try{if(editing)await updateRow('teachers',editing.id,p);else await insertRow('teachers',p);setOpen(false);setEditing(null);await load()}catch(e:any){const msg=[e?.message,e?.details,e?.hint,e?.code].filter(Boolean).join(' | ');setError('Save failed: '+(msg||String(e)))}};
 const filtered=data.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
 return <section className="page">
  <div className="page-head"><div><h2>Teachers</h2><p>Manage teachers from the teachers database only.</p></div>{!readOnly&&<button className="primary" onClick={()=>{setEditing(null);setOpen(true)}}>＋ Add</button>}</div>
  <div className="toolbar"><input placeholder="Search teachers..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="secondary" onClick={load}>↻ Refresh</button></div>
  {error&&<div className="alert"><strong>{error}</strong></div>}
  <div className="table-wrap">{loading?<div className="empty">Loading…</div>:filtered.length===0?<div className="empty">No teachers found.</div>:
   <table><thead><tr><th>Employee ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>{filtered.map(r=><tr key={r.id}><td>{r.employee_code||'—'}</td><td><b>{r.full_name}</b></td><td>{r.phone||'—'}</td><td>{r.email||'—'}</td><td>{r.subject||'—'}</td><td>{r.status||'active'}</td><td>
    {!readOnly&&<><button className="link-btn" onClick={()=>{setEditing(r);setOpen(true)}}>Edit</button><button className="danger-link" onClick={async()=>{if(confirm('Delete this teacher?')){try{await deleteRow('teachers',r.id);load()}catch(e:any){setError(e?.message||String(e))}}}}>Delete</button></>}
   </td></tr>)}</tbody></table>}
  </div>
  {open&&<Modal title={editing?'Edit Teacher':'Add Teacher'} onClose={()=>{setOpen(false);setEditing(null)}}><form className="form-grid" onSubmit={save}>
   <label>Employee ID *<input name="employee_code" defaultValue={editing?.employee_code??''} required/></label><label>Name *<input name="full_name" defaultValue={editing?.full_name??''} required/></label><label>Phone<input name="phone" defaultValue={editing?.phone??''}/></label><label>Email<input name="email" type="email" defaultValue={editing?.email??''}/></label><label>Subject<input name="subject" defaultValue={editing?.subject??''}/></label><label>Status<select name="status" defaultValue={editing?.status??'active'}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
   <div className="form-actions"><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary">Save</button></div>
  </form></Modal>}
 </section>
}
