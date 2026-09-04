import {useEffect, useState} from 'react';

const scenes = [
  {eyebrow:'01 · COMMAND CENTER', title:'Dashboard', text:'See the school at a glance and get to today’s work quickly.', kind:'dashboard'},
  {eyebrow:'02 · PEOPLE & CLASSES', title:'Students · Teachers · Classes', text:'Keep student, teacher and class information together.', kind:'people'},
  {eyebrow:'03 · ATTENDANCE', title:'Student & Teacher Attendance', text:'Mark attendance, check history and keep staff records in order.', kind:'attendance'},
  {eyebrow:'04 · FINANCE', title:'Fees & Payments', text:'Manage fees, payments, balances and receipts in one place.', kind:'fees'},
  {eyebrow:'05 · ACADEMIC WORK', title:'Assignments & Submissions', text:'Create work, set deadlines and follow submissions.', kind:'assignments'},
  {eyebrow:'06 · EXAMS', title:'Exams & Results', text:'Enter marks and keep grades and results organised.', kind:'results'},
  {eyebrow:'07 · COMMUNICATION', title:'Notices & Reports', text:'Keep notices and school reports easy to find.', kind:'reports'},
  {eyebrow:'08 · CONTROL', title:'Security & Access', text:'Each role sees the work it is meant to see.', kind:'security'},
];

const modules=['Dashboard','Students','Teachers','Classes','Student Attendance','Teacher Attendance','Fees','Assignments','Assignment Submissions','Exams','Results','Fee Payments','Notices','Reports','Settings','About','Activity Log','Users & Access'];

function DemoUI({kind,onAction}:{kind:string;onAction:()=>void}){
  const action=<button className="demo-action" onClick={onAction}>+ Add / Record</button>;
  if(kind==='dashboard') return <div className="demo-screen"><div className="demo-top"><b>Dashboard</b><span>Today · School overview</span></div><div className="demo-stats"><i><b>Students</b><strong>—</strong></i><i><b>Teachers</b><strong>—</strong></i><i><b>Attendance</b><strong>—</strong></i><i><b>Fees</b><strong>—</strong></i></div><div className="demo-panels"><div><b>Attendance overview</b><div className="fake-chart"><span/><span/><span/><span/><span/></div></div><div><b>Quick actions</b>{action}<button onClick={onAction}>Mark attendance</button></div></div></div>;
  if(kind==='people') return <div className="demo-screen"><div className="demo-top"><b>Students</b><span>Search · Filter · Class</span></div><div className="demo-toolbar"><div>Search students…</div><button onClick={onAction}>Filter</button>{action}</div><div className="demo-table"><div className="th"><span>Name</span><span>Student ID</span><span>Class</span><span>Status</span></div><div className="empty-row">Public preview · school records hidden</div></div><div className="mini-tabs"><span>Students</span><span>Teachers</span><span>Classes</span></div></div>;
  if(kind==='attendance') return <div className="demo-screen"><div className="demo-top"><b>Attendance</b><span>Date · Class</span></div><div className="status-row"><b>Present</b><b>Absent</b><b>Leave</b></div><div className="attendance-board"><div className="ring">—<small>Attendance</small></div><div><div className="demo-toolbar"><div>Select class…</div><button onClick={onAction}>Mark all present</button></div><div className="empty-row">Student attendance rows appear after secure sign in</div></div></div></div>;
  if(kind==='fees') return <div className="demo-screen"><div className="demo-top"><b>Fee Management</b><span>Month · Search · Method</span></div><div className="fee-cards"><i><b>Paid</b><strong>—</strong></i><i><b>Partial</b><strong>—</strong></i><i><b>Unpaid</b><strong>—</strong></i><i><b>Overdue</b><strong>—</strong></i></div><div className="demo-toolbar"><div>Search student…</div><button onClick={onAction}>Record Payment</button>{action}</div><div className="empty-row">No private fee records are displayed in public preview</div></div>;
  if(kind==='assignments') return <div className="demo-screen"><div className="demo-top"><b>Assignments</b><span>Subject · Class · Due date</span></div><div className="assignment-card"><div><small>SUBJECT</small><b>Assignment title</b><span>Class · Due date</span></div><button onClick={onAction}>Open</button></div><div className="assignment-card muted-card"><div><small>SUBMISSIONS</small><b>Submission tracking</b><span>Pending · Submitted · Reviewed</span></div><button onClick={onAction}>View</button></div><div className="empty-row">Preview only · real assignments remain private</div></div>;
  if(kind==='results') return <div className="demo-screen"><div className="demo-top"><b>Exams & Results</b><span>Exam · Student · Subject</span></div><div className="result-grid"><div><small>EXAM</small><b>Select exam…</b></div><div><small>STUDENT</small><b>Select student…</b></div><div><small>MARKS</small><b>— / —</b></div><div><small>GRADE</small><b>—</b></div></div><div className="result-line"><span>Percentage</span><strong>—%</strong><button onClick={onAction}>Enter Results</button></div></div>;
  if(kind==='reports') return <div className="demo-screen"><div className="demo-top"><b>Reports</b><span>Attendance · Fees · Results</span></div><div className="report-chart"><span/><span/><span/><span/><span/><span/></div><div className="report-actions"><button onClick={onAction}>Attendance report</button><button onClick={onAction}>Fee report</button><button onClick={onAction}>Results report</button></div><div className="empty-row">Reports use private school data after sign in</div></div>;
  if(kind==='security') return <div className="demo-screen"><div className="demo-top"><b>Security & Access</b><span>Role permissions</span></div><div className="access-preview"><div><b>ADMIN</b><span>Full school management</span></div><div><b>TEACHER</b><span>Teaching & academic entries</span></div><div><b>ACCOUNTANT</b><span>Fees & payments</span></div><div><b>STUDENT</b><span>Personal academic view</span></div><div><b>PARENT</b><span>Child progress view</span></div></div><div className="public-lock-note"><span>🔒</span><div><b>No public accounts or records</b><small>Visitors can explore the interface. Sign in is required for private data.</small></div></div><button className="demo-action wide" onClick={onAction}>Open protected controls</button></div>;
}

export default function Landing({onLogin}:{onLogin:()=>void}){
  const [loginOpen,setLoginOpen]=useState(false);
  const [notice,setNotice]=useState('');
  const [activeScene,setActiveScene]=useState('welcome');
  const protectedAction=()=>{setNotice('Login required — this feature is available after sign in.'); window.setTimeout(()=>setNotice(''),2800)};
  useEffect(()=>{
    const ids=['welcome','product','dashboard','people','attendance','fees','assignments','results','reports','security','about','modules','final'];
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible) setActiveScene(visible.target.id);
    },{rootMargin:'-25% 0px -55% 0px',threshold:[0,.15,.35,.6]});
    ids.forEach(id=>{const el=document.getElementById(id);if(el) observer.observe(el)});
    return()=>observer.disconnect();
  },[]);
  const visitorNav=[['welcome','Overview'],['product','Features'],['modules','Modules'],['about','About']];
  const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  return <div className="cinematic-landing">
    <header className="cinematic-nav">
      <button className="mobile-brand nav-brand" onClick={()=>jump('welcome')} aria-label="EduSphere home">
        <img className="landing-brand-logo" src="/edusphere-logo.svg" alt="EduSphere"/>
        <span><b>EduSphere</b><small>Smart School OS</small></span>
      </button>
      <nav className="top-nav-links" aria-label="Visitor navigation">
        {visitorNav.map(([id,label])=><button key={id} className={activeScene===id?'active':''} onClick={()=>jump(id)}>
          <span>{label}</span>
        </button>)}
      </nav>
      <button className="nav-signin" onClick={()=>setLoginOpen(true)}>Sign in <span>→</span></button>
    </header>
    {notice&&<div className="public-notice">🔐 {notice}</div>}
    {loginOpen&&<div className="login-overlay" onClick={()=>setLoginOpen(false)}><div className="login-card" onClick={e=>e.stopPropagation()}><button className="login-x" onClick={()=>setLoginOpen(false)}>×</button><span className="eyebrow">EDUSPHERE ACCESS</span><h3>Welcome back</h3><p>Sign in to access private school records and the complete workspace.</p><button className="primary full" onClick={onLogin}>Continue to Sign In</button></div></div>}

    <section id="welcome" className="cinematic-hero scene-dark"><div className="scene-content"><span className="eyebrow">WELCOME TO EDUSPHERE</span><h1>School management,<br/><em>reimagined.</em></h1><p>A modern digital workspace for students, teachers, attendance, fees, assignments, exams, results and reports.</p><div className="scroll-cue">SCROLL TO EXPLORE <span>↓</span></div></div><div className="hero-device"><div className="device-glow"/><div className="device-panel"><span>EDUSPHERE</span><b>One workspace.<br/>Every school workflow.</b><div className="device-lines"><i/><i/><i/></div></div></div></section>



    <section id="product" className="product-intro scene-light"><span className="eyebrow">EDUSPHERE</span><h2>See how it works.</h2><p>Explore the main parts of the workspace. School records stay private.</p></section>

    {scenes.map((s,i)=><section id={s.kind} className={`product-scene scene-${i%3}`} key={s.kind}><div className="scene-content product-copy"><span className="eyebrow">{s.eyebrow}</span><h2>{s.title}</h2><p>{s.text}</p></div><div className="product-stage"><DemoUI kind={s.kind} onAction={protectedAction}/><div className="stage-depth"/></div></section>)}

    <section id="about" className="about-scene scene-blue"><div className="about-card"><div className="creator-photo"><img src="/hanzala-khan.png" alt="Hanzala Khan"/></div><div><span className="eyebrow">ABOUT THE DEVELOPER</span><h2>Hanzala Khan</h2><h4>Founder & Developer · EduSphere</h4><p>I built EduSphere to make everyday school work easier to manage.</p><div className="creator-links"><a href="mailto:hanzala3311211@gmail.com">hanzala3311211@gmail.com</a><span>WhatsApp · 03467032832</span></div></div></div></section>

    <section id="modules" className="module-overview scene-dark"><div className="scene-content"><span className="eyebrow">EDUSPHERE MODULES</span><h2>Everything in one place.</h2><p>Explore the workspace. Private records stay behind sign in.</p><div className="module-wall">{modules.map((m,i)=><button key={m} onClick={protectedAction}><span>{String(i+1).padStart(2,'0')}</span>{m}<em>↗</em></button>)}</div></div></section>

    <section id="final" className="final-scene scene-blue"><div className="final-card"><span className="eyebrow">EDUSPHERE</span><h2>Ready when you are.</h2><p>Sign in to open your school workspace.</p><button className="primary" onClick={()=>setLoginOpen(true)}>Sign in to EduSphere</button><small>Private school data is available only to authorized users.</small></div></section>
    <footer className="cinematic-footer"><span>EduSphere · Smart School Management</span><span>Developed by Hanzala Khan</span></footer>
  </div>
}
