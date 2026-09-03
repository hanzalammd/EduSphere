import {useState} from 'react';

const modules = [
  ['⌂','Dashboard','School overview and quick insights'],
  ['♙','Students','Student profiles and records'],
  ['♟','Teachers','Teacher profiles and staff information'],
  ['▦','Classes','Classes, sections and academic setup'],
  ['✓','Student Attendance','Daily student attendance'],
  ['✓','Teacher Attendance','Staff attendance tracking'],
  ['◈','Fees','Fee records, balances and payments'],
  ['✎','Assignments','Create and manage assignments'],
  ['↥','Assignment Submissions','Track student submissions'],
  ['▤','Exams','Exam schedules and information'],
  ['▥','Results','Marks, grades and performance'],
  ['◈','Fee Payments','Payment and receipt records'],
  ['◉','Notices','School announcements and notices'],
  ['▥','Reports','School reports and summaries'],
  ['⚙','Settings','School configuration and preferences'],
  ['ⓘ','About','About EduSphere and the developer'],
  ['◷','Activity Log','System activity and audit history'],
];

export default function Landing({onLogin}:{onLogin:()=>void}){
  const [showFeatures,setShowFeatures]=useState(false);
  const [loginOpen,setLoginOpen]=useState(true);
  const [notice,setNotice]=useState('');

  const preview = (name:string) => {
    if(name==='About') return;
    setNotice(`${name} is available in EduSphere. Sign in to view school records.`);
    window.setTimeout(()=>setNotice(''),2600);
  };

  return <div className="landing">
    <header className="landing-nav">
      <div className="brand"><div className="brand-mark">E</div><div><b>EduSphere</b><small>Smart School OS</small></div></div>
      <button className="secondary" onClick={onLogin}>Sign in</button>
    </header>

    {loginOpen && <div className="public-login-popover">
      <button className="public-login-close" aria-label="Close" onClick={()=>setLoginOpen(false)}>×</button>
      <span className="public-login-kicker">EDUSPHERE ACCESS</span>
      <h3>Ready to explore the real workspace?</h3>
      <p>All modules are visible here. School records stay private and are shown only after secure login.</p>
      <button className="primary full" onClick={onLogin}>Login to EduSphere</button>
    </div>}

    {notice && <div className="public-notice">🔐 {notice}</div>}

    <section className="landing-hero">
      <div className="landing-copy">
        <span className="pill">SMART SCHOOL OPERATING SYSTEM</span>
        <h1>Run your school <span>smarter.</span></h1>
        <p>One modern workspace for students, teachers, attendance, fees, assignments, exams, results, notices and reports.</p>
        <div className="welcome-message">
          <b>Welcome to Hanzala's new project — EduSphere.</b>
          <span>We're still building, improving and polishing the experience. Thanks for visiting while the project grows.</span>
        </div>
        <div className="landing-actions">
          <button className="primary" onClick={onLogin}>Open EduSphere</button>
          <button className="secondary" onClick={()=>setShowFeatures(!showFeatures)}>Explore features</button>
        </div>
        {showFeatures&&<div className="landing-features">✓ Role-based access &nbsp; ✓ Cloud-ready data &nbsp; ✓ Mobile, tablet & PC &nbsp; ✓ Admin-controlled settings</div>}
      </div>
      <div className="landing-orb"><div className="orb-card"><span>EDUSPHERE</span><strong>School<br/>at a glance</strong><small>Students · Attendance · Fees · Results</small></div></div>
    </section>

    <section className="public-modules">
      <div className="section-heading"><span className="eyebrow">EXPLORE EDUSPHERE</span><h2>Everything in one school workspace</h2><p>You can explore the available modules below without logging in. <b>Private school records are never shown to public visitors.</b></p></div>
      <div className="public-module-grid">{modules.map(([icon,name,desc])=><button className="public-module" key={name} onClick={()=>preview(name)}><span className="public-module-icon">{icon}</span><span><b>{name}</b><small>{desc}</small></span><em>Login →</em></button>)}</div>
    </section>

    <section className="landing-grid">
      <div><b>👑 Admin control</b><p>Full management, settings, reports and activity visibility.</p></div>
      <div><b>👨‍🏫 Teacher workflow</b><p>Teachers add teaching data without changing protected records.</p></div>
      <div><b>📊 Clear reporting</b><p>Quick summaries for attendance, fees, students and results.</p></div>
      <div><b>🔐 Private records</b><p>Public visitors can explore the system, but real school data stays behind login.</p></div>
    </section>

    <footer className="landing-footer"><span>EduSphere · Smart School Management. Simple. Connected. Powerful.</span><span>Developed by Hanzala Khan · <a href="mailto:hanzala3311211@gmail.com">Email</a> · <a href="https://wa.me/923467032832" target="_blank" rel="noreferrer">WhatsApp</a></span></footer>
  </div>
}
