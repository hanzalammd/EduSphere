import React,{useEffect,useMemo,useState} from 'react';
import {rows} from '../lib/api';
import {Users,GraduationCap,School,WalletCards,CalendarCheck,ClipboardList,FileText,ArrowUpRight,RefreshCw,ReceiptText,BookOpenCheck,ClipboardCheck,UserPlus,BarChart3, Megaphone} from 'lucide-react';

export default function Dashboard({role='admin',onNavigate}:{role?:string;onNavigate?:(page:string)=>void}){
 const [s,setS]=useState({students:0,teachers:0,classes:0,fees:0,attendance:0,assignments:0,results:0,notices:0,teacherAttendance:0,payments:0});
 const [loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);try{
   const [students,teachers,classes,fees,attendance,assignments,results,notices,teacherAttendance,payments]=await Promise.all([
     rows('students'),rows('teachers'),rows('classes'),rows('fees'),rows('student_attendance'),rows('assignments'),rows('results'),rows('notices'),rows('teacher_attendance'),rows('fee_payments')
   ]);
   const outstanding=fees.reduce((x:any,r:any)=>x+Math.max(0,Number(r.amount||0)-Number(r.discount||0)+Number(r.fine||0)-Number(r.paid||0)),0);
   const today=new Date().toISOString().slice(0,10);
   const todayRows=attendance.filter((r:any)=>String(r.attendance_date||'').slice(0,10)===today);
   const present=todayRows.filter((r:any)=>r.status==='present').length;
   const teacherToday=teacherAttendance.filter((r:any)=>String(r.attendance_date||'').slice(0,10)===today).length;
   setS({students:students.length,teachers:teachers.length,classes:classes.length,fees:outstanding,attendance:todayRows.length?Math.round((present/todayRows.length)*100):0,assignments:assignments.length,results:results.length,notices:notices.length,teacherAttendance:teacherToday,payments:payments.length});
 }catch{}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const actions=useMemo(()=>{
   const base=[
    {label:'Student Attendance',desc:'Mark today’s attendance',icon:CalendarCheck,roles:['admin','teacher']},
    {label:'Teacher Attendance',desc:'Record staff attendance',icon:GraduationCap,roles:['admin','teacher']},
    {label:'Fees',desc:'Manage fees and balances',icon:WalletCards,roles:['admin','teacher','accountant','parent']},
    {label:'Fee Payments',desc:'Record and review payments',icon:ReceiptText,roles:['admin','teacher','accountant']},
    {label:'Assignments',desc:'Create and track assignments',icon:ClipboardList,roles:['admin','teacher','student']},
    {label:'Assignment Submissions',desc:'Review submitted work',icon:BookOpenCheck,roles:['admin','teacher','student']},
    {label:'Exams',desc:'Manage examination setup',icon:ClipboardCheck,roles:['admin','teacher']},
    {label:'Results',desc:'Enter and review results',icon:BarChart3,roles:['admin','teacher','student','parent']},
    {label:'Notices',desc:'Publish school notices',icon:Megaphone,roles:['admin','teacher','student','parent']},
    {label:'Students',desc:'Open student records',icon:UserPlus,roles:['admin','teacher']},
   ];
   return base.filter(a=>a.roles.includes(role));
 },[role]);
 const greeting=role==='admin'?'Here’s your complete school overview.':role==='teacher'?'Here’s what needs your attention today.':role==='accountant'?'Here’s your financial workspace at a glance.':role==='parent'?'Here’s a quick view of your school information.':'Here’s your academic workspace at a glance.';
 const stats=[
  {label:'Students',value:s.students,icon:Users,meta:'Active records'},
  {label:'Teachers',value:s.teachers,icon:GraduationCap,meta:'Teaching staff'},
  {label:'Classes',value:s.classes,icon:School,meta:'Classes'},
  {label:'Outstanding fees',value:'Rs '+s.fees.toLocaleString(),icon:WalletCards,meta:'Current balance'},
 ];
 return <section className="page dashboard-page">
  <div className="dashboard-welcome">
   <div className="welcome-copy"><span className="eyebrow dark-eyebrow">SCHOOL DASHBOARD</span><h1>Good to have you back.</h1><p>{greeting}</p></div>
   <button className="refresh-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/>{loading?'Refreshing':'Refresh data'}</button>
  </div>
  <div className="stats dashboard-stats">{stats.map(({label,value,icon:Icon,meta},i)=><div className="stat-card premium-stat dashboard-stat" key={label}><div className={`stat-icon stat-tone-${i}`}><Icon size={20}/></div><div><small>{label}</small><strong>{value}</strong><span>{meta}</span></div><ArrowUpRight className="stat-arrow" size={16}/></div>)}</div>

  <div className="dashboard-main-grid">
   <div className="card today-card">
    <div className="section-heading"><div><span className="eyebrow dark-eyebrow">TODAY</span><h3>School activity</h3><p>Live numbers from your connected workspace.</p></div><span className="live-chip"><i/>Live</span></div>
    <div className="today-grid">
      <div className="attendance-widget"><div className="progress-ring" style={{'--progress':`${s.attendance}%`} as React.CSSProperties}><div><b>{s.attendance||'—'}</b><span>{s.attendance?'%':''}</span></div></div><div><b>Student attendance</b><small>{s.attendance?`${s.attendance}% marked present today`:'No attendance marked today'}</small></div></div>
      <div className="mini-stat"><span><ClipboardList size={17}/></span><b>{s.assignments}</b><small>Assignments</small></div>
      <div className="mini-stat"><span><FileText size={17}/></span><b>{s.results}</b><small>Results</small></div>
      <div className="mini-stat"><span><Megaphone size={17}/></span><b>{s.notices}</b><small>Notices</small></div>
      <div className="mini-stat"><span><GraduationCap size={17}/></span><b>{s.teacherAttendance}</b><small>Teacher attendance today</small></div>
      <div className="mini-stat"><span><ReceiptText size={17}/></span><b>{s.payments}</b><small>Fee payments</small></div>
    </div>
   </div>

   <div className="card quick-access-card">
    <div className="section-heading"><div><span className="eyebrow dark-eyebrow">QUICK ACCESS</span><h3>Get things done</h3><p>Jump straight into a task.</p></div></div>
    <div className="quick-actions-grid">{actions.map(({label,desc,icon:Icon})=><button className="quick-action" key={label} onClick={()=>onNavigate?.(label)}><span className="quick-action-icon"><Icon size={18}/></span><span><b>{label}</b><small>{desc}</small></span><ArrowUpRight size={15}/></button>)}</div>
   </div>
  </div>

  <div className="dashboard-bottom-grid">
   <div className="card workflow-card"><div className="section-heading"><div><span className="eyebrow dark-eyebrow">WORKSPACE</span><h3>School workflow</h3></div></div><div className="workflow-row"><button onClick={()=>onNavigate?.('Students')}><Users size={18}/><span><b>Students</b><small>{s.students} records</small></span><ArrowUpRight size={15}/></button><button onClick={()=>onNavigate?.('Assignments')}><ClipboardList size={18}/><span><b>Assignments</b><small>{s.assignments} records</small></span><ArrowUpRight size={15}/></button><button onClick={()=>onNavigate?.('Results')}><BarChart3 size={18}/><span><b>Results</b><small>{s.results} saved entries</small></span><ArrowUpRight size={15}/></button></div></div>
   <div className="card secure-dashboard-card"><div className="security-icon"><span>✓</span></div><div><span className="eyebrow dark-eyebrow">CONNECTED WORKSPACE</span><h3>Role-based access is active</h3><p>Your account only sees the modules and actions allowed for your role.</p></div><span className="secure-badge">● Cloud connected</span></div>
  </div>
 </section>
}
