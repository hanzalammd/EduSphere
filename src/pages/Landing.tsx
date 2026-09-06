import {useEffect, useRef, useState, type CSSProperties} from 'react';

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

function HeroCampus(){
  const ref=useRef<HTMLDivElement>(null);
  const [tilt,setTilt]=useState({x:0,y:0});
  useEffect(()=>{
    const move=(e:PointerEvent)=>{
      if(!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r=ref.current;
      const x=((e.clientX-r.left)/r.width-.5)*10;
      const y=((e.clientY-r.top)/r.height-.5)*-7;
      setTilt({x,y});
    };
    const leave=()=>setTilt({x:0,y:0});
    const el=ref.current;
    el?.addEventListener('pointermove',move); el?.addEventListener('pointerleave',leave);
    return()=>{el?.removeEventListener('pointermove',move);el?.removeEventListener('pointerleave',leave)};
  },[]);
  return <div ref={ref} className="hero-3d-world" style={{'--rx':`${tilt.y}deg`,'--ry':`${tilt.x}deg`} as CSSProperties}>
    <div className="world-backdrop"/><div className="world-grid"/><div className="world-light light-one"/><div className="world-light light-two"/>
    <div className="world-floor"><span/><span/><span/></div>
    <div className="world-orbit orbit-one"/><div className="world-orbit orbit-two"/>
    <div className="floating-chip chip-top"><small>EDUSPHERE OS</small><b>CONNECTED SCHOOL</b><span>● CLOUD SYNC</span></div>
    <div className="floating-chip chip-left"><small>ATTENDANCE</small><b>96.4%</b><span><i/> Today</span></div>
    <div className="floating-chip chip-right"><small>FINANCE</small><b>Rs 18,489</b><span>Outstanding fees</span></div>
    <div className="floating-screen screen-back screen-students"><div className="mini-window-bar"><i/><i/><i/><b>Students</b></div><div className="mini-sidebar"/><div className="mini-lines"><span/><span/><span/><span/><span/></div></div>
    <div className="floating-screen screen-back screen-attendance"><div className="mini-window-bar"><i/><i/><i/><b>Attendance</b></div><div className="mini-ring"><span>96%</span></div><div className="mini-bars"><i/><i/><i/><i/><i/></div></div>
    <div className="monitor-shadow"/>
    <div className="monitor" style={{transform:`rotateX(calc(5deg + var(--rx))) rotateY(calc(-8deg + var(--ry))) translateZ(28px)`}}>
      <div className="monitor-bezel"><div className="monitor-camera"/><div className="dashboard-ui">
        <aside className="dash-side"><div className="dash-brand"><span>≡</span><b>EduSphere</b><small>SMART SCHOOL OS</small></div><div className="dash-nav active"><i>⌂</i>Dashboard</div><div className="dash-nav"><i>♙</i>Students</div><div className="dash-nav"><i>◉</i>Teachers</div><div className="dash-nav"><i>▦</i>Classes</div><div className="dash-nav"><i>✓</i>Attendance</div><div className="dash-nav"><i>₹</i>Fees</div><div className="dash-nav"><i>▤</i>Assignments</div><div className="dash-nav"><i>▥</i>Results</div></aside>
        <main className="dash-main"><header><div><small>EDUSPHERE / OVERVIEW</small><h3>Dashboard</h3><span>Good to have you back.</span></div><div className="dash-user"><b>S</b><span>School Admin<small>Administrator</small></span></div></header><div className="dash-stats"><div><small>Students</small><b>4</b><span>enrolled</span></div><div><small>Teachers</small><b>2</b><span>teaching staff</span></div><div><small>Classes</small><b>3</b><span>active classes</span></div><div><small>Outstanding fees</small><b>Rs 18,489</b><span>requires attention</span></div></div><div className="dash-lower"><div className="dash-card"><div><b>School activity</b><small>Last 7 days</small></div><div className="dash-chart"><i/><i/><i/><i/><i/><i/><i/></div></div><div className="dash-card quick"><b>Quick actions</b><button>+ Add student</button><button>Mark attendance</button><button>Record payment</button></div></div></main>
      </div></div><div className="monitor-stand"><i/><b/></div>
    </div>
    <div className="world-caption"><span>01</span><b>LIVE PRODUCT PREVIEW</b><i/> Move your pointer</div>
  </div>
}
function DemoUI({kind,onAction}:{kind:string;onAction:()=>void}){
  const action=<button className="demo-action" onClick={onAction}>+ Add / Record</button>;
  if(kind==='dashboard') return <div className="demo-screen"><div className="demo-top"><b>Dashboard</b><span>Today · School overview</span></div><div className="demo-stats"><i><b>Students</b><strong>—</strong><small>enrolled</small></i><i><b>Teachers</b><strong>—</strong><small>active</small></i><i><b>Attendance</b><strong>—</strong><small>today</small></i><i><b>Fees</b><strong>—</strong><small>collected</small></i></div><div className="demo-panels"><div><b>Attendance overview</b><div className="fake-chart"><span/><span/><span/><span/><span/><span/><span/></div></div><div><b>Quick actions</b>{action}<button onClick={onAction}>Mark attendance</button></div></div></div>;
  if(kind==='people') return <div className="demo-screen"><div className="demo-top"><b>Students</b><span>Search · Filter · Class</span></div><div className="demo-toolbar"><div>Search students…</div><button onClick={onAction}>Filter</button>{action}</div><div className="demo-table"><div className="th"><span>Name</span><span>Student ID</span><span>Class</span><span>Status</span></div><div className="empty-row">Public preview · school records hidden</div></div><div className="mini-tabs"><span>Students</span><span>Teachers</span><span>Classes</span></div></div>;
  if(kind==='attendance') return <div className="demo-screen"><div className="demo-top"><b>Attendance</b><span>Date · Class</span></div><div className="status-row"><b>Present</b><b>Absent</b><b>Leave</b></div><div className="attendance-board"><div className="ring">—<small>Attendance</small></div><div><div className="demo-toolbar"><div>Select class…</div><button onClick={onAction}>Mark all present</button></div><div className="empty-row">Student attendance rows appear after secure sign in</div></div></div></div>;
  if(kind==='fees') return <div className="demo-screen"><div className="demo-top"><b>Fee Management</b><span>Month · Search · Method</span></div><div className="fee-cards"><i><b>Paid</b><strong>—</strong></i><i><b>Partial</b><strong>—</strong></i><i><b>Unpaid</b><strong>—</strong></i><i><b>Overdue</b><strong>—</strong></i></div><div className="demo-toolbar"><div>Search student…</div><button onClick={onAction}>Record Payment</button>{action}</div><div className="empty-row">No private fee records are displayed in public preview</div></div>;
  if(kind==='assignments') return <div className="demo-screen"><div className="demo-top"><b>Assignments</b><span>Subject · Class · Due date</span></div><div className="assignment-card"><div><small>SUBJECT</small><b>Assignment title</b><span>Class · Due date</span></div><button onClick={onAction}>Open</button></div><div className="assignment-card muted-card"><div><small>SUBMISSIONS</small><b>Submission tracking</b><span>Pending · Submitted · Reviewed</span></div><button onClick={onAction}>View</button></div><div className="empty-row">Preview only · real assignments remain private</div></div>;
  if(kind==='results') return <div className="demo-screen"><div className="demo-top"><b>Exams & Results</b><span>Exam · Student · Subject</span></div><div className="result-grid"><div><small>EXAM</small><b>Select exam…</b></div><div><small>STUDENT</small><b>Select student…</b></div><div><small>MARKS</small><b>— / —</b></div><div><small>GRADE</small><b>—</b></div></div><div className="result-line"><span>Percentage</span><strong>—%</strong><button onClick={onAction}>Enter Results</button></div></div>;
  if(kind==='reports') return <div className="demo-screen"><div className="demo-top"><b>Reports</b><span>Attendance · Fees · Results</span></div><div className="report-chart"><span/><span/><span/><span/><span/><span/></div><div className="report-actions"><button onClick={onAction}>Attendance report</button><button onClick={onAction}>Fee report</button><button onClick={onAction}>Results report</button></div><div className="empty-row">Reports use private school data after sign in</div></div>;
  return <div className="demo-screen"><div className="demo-top"><b>Security & Access</b><span>Role permissions</span></div><div className="access-preview"><div><b>ADMIN</b><span>Full school management</span></div><div><b>TEACHER</b><span>Teaching & academic entries</span></div><div><b>ACCOUNTANT</b><span>Fees & payments</span></div><div><b>STUDENT</b><span>Personal academic view</span></div><div><b>PARENT</b><span>Child progress view</span></div></div><div className="public-lock-note"><span>🔒</span><div><b>No public accounts or records</b><small>Visitors can explore the interface. Sign in is required for private data.</small></div></div><button className="demo-action wide" onClick={onAction}>Open protected controls</button></div>;
}

export default function Landing({onLogin}:{onLogin:()=>void}){
  const [loginOpen,setLoginOpen]=useState(false);
  const [notice,setNotice]=useState('');
  const [activeScene,setActiveScene]=useState('welcome');
  const [progress,setProgress]=useState(0);
  const [cursor,setCursor]=useState({x:-100,y:-100});
  const protectedAction=()=>{setNotice('Login required — this feature is available after sign in.'); window.setTimeout(()=>setNotice(''),2800)};

  useEffect(()=>{
    const ids=['welcome','product','dashboard','people','attendance','fees','assignments','results','reports','security','about','modules','final'];
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible) setActiveScene(visible.target.id);
    },{rootMargin:'-28% 0px -55% 0px',threshold:[.05,.2,.4,.6]});
    ids.forEach(id=>{const el=document.getElementById(id);if(el) observer.observe(el)});
    const scroll=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;setProgress(max>0?window.scrollY/max:0)};
    const pointer=(e:PointerEvent)=>setCursor({x:e.clientX,y:e.clientY});
    window.addEventListener('scroll',scroll,{passive:true}); window.addEventListener('pointermove',pointer,{passive:true}); scroll();
    return()=>{observer.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('pointermove',pointer)};
  },[]);
  const visitorNav=[['welcome','Overview'],['product','Features'],['modules','Modules'],['about','About']];
  const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  return <div className="cinematic-landing">
    <div className="scroll-progress" style={{transform:`scaleX(${progress})`}}/>
    <div className="cursor-orb" style={{left:cursor.x,top:cursor.y}}/>
    <div className="film-grain"/>
    <header className="cinematic-nav">
      <button className="mobile-brand nav-brand" onClick={()=>jump('welcome')} aria-label="EduSphere home"><img className="landing-brand-logo" src="/edusphere-logo.svg" alt="EduSphere"/><span><b>EduSphere</b><small>Smart School OS</small></span></button>
      <nav className="top-nav-links" aria-label="Visitor navigation">{visitorNav.map(([id,label])=><button key={id} className={activeScene===id?'active':''} onClick={()=>jump(id)}><span>{label}</span><small>{String(visitorNav.findIndex(x=>x[0]===id)+1).padStart(2,'0')}</small></button>)}</nav>
      <button className="nav-signin" onClick={()=>setLoginOpen(true)}>Sign in <span>→</span></button>
    </header>
    <div className="scene-rail" aria-label="Scene progress">{scenes.map((s,i)=><button key={s.kind} className={activeScene===s.kind?'active':''} onClick={()=>jump(s.kind)} aria-label={`Go to ${s.title}`}><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>
    {notice&&<div className="public-notice">🔐 {notice}</div>}
    {loginOpen&&<div className="login-overlay" onClick={()=>setLoginOpen(false)}><div className="login-card" onClick={e=>e.stopPropagation()}><button className="login-x" onClick={()=>setLoginOpen(false)}>×</button><span className="eyebrow">EDUSPHERE ACCESS</span><h3>Welcome back</h3><p>Sign in to access private school records and the complete workspace.</p><button className="primary full" onClick={onLogin}>Continue to Sign In</button></div></div>}

    <section id="welcome" className="cinematic-hero scene-dark"><div className="hero-vignette"/><div className="scene-content hero-copy"><span className="eyebrow"><i/> WELCOME TO EDUSPHERE</span><h1>School management,<br/><em>reimagined.</em></h1><p>A modern digital workspace for students, teachers, attendance, fees, assignments, exams, results and reports.</p><div className="hero-meta"><span><b>01</b> REAL-WORLD WORKFLOW</span><span><b>02</b> PRIVATE BY DEFAULT</span></div><button className="hero-explore" onClick={()=>jump('product')}>Explore the system <span>↓</span></button></div><HeroCampus/></section>

    <section id="product" className="product-intro scene-light"><div className="intro-orbit orbit-a"/><div className="intro-orbit orbit-b"/><span className="eyebrow">THE WORKSPACE</span><h2>Designed like a product.<br/><em>Built like a system.</em></h2><p>Move through the core workflows. The public experience shows the interface without exposing private school records.</p><div className="intro-specs"><span><b>18</b> core modules</span><span><b>01</b> connected workspace</span><span><b>∞</b> school records</span></div></section>

    {scenes.map((s,i)=><section id={s.kind} className={`product-scene scene-${i%3}`} key={s.kind}><div className="scene-number">{String(i+1).padStart(2,'0')} / 08</div><div className="scene-content product-copy"><span className="eyebrow">{s.eyebrow}</span><h2>{s.title}</h2><p>{s.text}</p><div className="copy-rule"/><small>INTERFACE PREVIEW · PRIVATE DATA HIDDEN</small></div><div className="product-stage"><div className="stage-glow"/><DemoUI kind={s.kind} onAction={protectedAction}/><div className="stage-depth"/><div className="stage-reflection"/></div></section>)}

    <section id="about" className="about-scene scene-blue"><div className="about-grid"/><div className="about-card"><div className="creator-photo"><img src="/hanzala-khan.png" alt="Hanzala Khan"/></div><div><span className="eyebrow">ABOUT THE DEVELOPER</span><h2>Hanzala Khan</h2><h4>Founder & Developer · EduSphere</h4><p>I built EduSphere to make everyday school work easier to manage.</p><div className="creator-links"><a href="mailto:hanzala3311211@gmail.com">hanzala3311211@gmail.com</a><span>WhatsApp · 03467032832</span></div></div></div></section>

    <section id="modules" className="module-overview scene-dark"><div className="module-bg-ring ring-one"/><div className="module-bg-ring ring-two"/><div className="scene-content"><span className="eyebrow">EDUSPHERE MODULES</span><h2>Everything in one place.</h2><p>One workspace for the operational side of a school. Private records stay behind sign in.</p><div className="module-wall">{modules.map((m,i)=><button key={m} onClick={protectedAction}><span>{String(i+1).padStart(2,'0')}</span>{m}<em>↗</em></button>)}</div></div></section>

    <section id="final" className="final-scene scene-blue"><div className="final-grid"/><div className="final-card"><span className="eyebrow">EDUSPHERE · 2026</span><h2>Your school.<br/><em>One connected system.</em></h2><p>Sign in to open the full school workspace and work with authorized records.</p><button className="primary" onClick={()=>setLoginOpen(true)}>Sign in to EduSphere <span>→</span></button><small>Private school data is available only to authorized users.</small></div></section>
    <footer className="cinematic-footer"><span>EduSphere · Smart School Management</span><span>Developed by Hanzala Khan</span></footer>
  </div>
}
