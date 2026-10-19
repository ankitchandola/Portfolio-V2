import React,{useState} from 'react';
import {Routes,Route} from 'react-router';
import {ArrowUpRight,ArrowRight,ArrowLeft,FileText,Github,Linkedin,Accessibility} from 'lucide-react';
import {profile} from './content/profile';
import projects from './content/projects.json';
function Link({to,children,...props}){return <a href={to} {...props}>{children}</a>}
function Header(){return <header className="header shell"><Link className="wordmark" to="/" aria-label="Ankit Chandola homepage"><span className="monogram">a<span>c.</span></span><span>Ankit<br/>Chandola</span></Link><nav aria-label="Main navigation"><a href="/#about">About me</a><a href="/#work">The work</a><a href="/#experience">Experience</a><a className="header-contact" href={'mailto:'+profile.email}>Get in touch<ArrowUpRight size={25}/></a><button className="theme-toggle" type="button" aria-label="Toggle light and dark theme" title="Toggle light and dark theme"><span className="theme-moon">{/* Lucide ISC */}
<svg aria-hidden="true" focusable="false"
  className="lucide lucide-moon"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
</svg>
</span><span className="theme-sun">{/* Lucide ISC */}
<svg aria-hidden="true" focusable="false"
  className="lucide lucide-sun"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v2" />
  <path d="M12 20v2" />
  <path d="m4.93 4.93 1.41 1.41" />
  <path d="m17.66 17.66 1.41 1.41" />
  <path d="M2 12h2" />
  <path d="M20 12h2" />
  <path d="m6.34 17.66-1.41 1.41" />
  <path d="m19.07 4.93-1.41 1.41" />
</svg>
</span></button></nav></header>}
function Footer(){return <><section className="contact shell" id="contact"><div className="contact-label"><span className="kicker">NEXT CONVERSATION</span><span>Delhi, India · Full-stack development</span></div><div className="contact-title"><h2>Let’s make<br/><span>something work.</span></h2><a className="contact-arrow" href={'mailto:'+profile.email} aria-label="Email Ankit"><ArrowUpRight size={70} strokeWidth={1.3}/></a></div><a className="contact-email" href={'mailto:'+profile.email}>{profile.email}<ArrowUpRight size={28}/></a></section><footer className="footer shell"><span>© 2026 Ankit Chandola</span><div><a href={profile.github} target="_blank" rel="noopener noreferrer"><Github size={24}/>GitHub</a><a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={24}/>LinkedIn</a><a href="/assets/docs/ankit-chandola-resume.pdf" target="_blank" rel="noopener"><FileText size={24}/>Résumé</a></div><Link to="/lite"><Accessibility size={21}/>Lite version</Link></footer></>}
function Experience(){return <section className="experience shell" id="experience"><div className="section-label"><span className="section-number">03</span><span>Today, and what came before.</span></div><div className="experience-intro"><h2>The perspective<br/><span>came from building.</span></h2><p>Different teams, different constraints.<br/>The same habit of following a feature all the way through.</p></div><div className="history-list"><article><span className="history-date">2025 — PRESENT</span><div><h3>Green Fortune Technologies</h3><p className="history-role">Full-stack developer</p><p>Owned most frontend development for an internal operations platform and implemented its offline functionality across frontend and backend. Owned most company-specific Vue and Python development for an existing Frappe CRM, including browser calling and quotation workflows. Created a shared React visualization package used by operations and customer applications. Implemented the public brand website and Strapi CMS, including their shared AWS staging environment.</p><div className="tags"><span>React / TypeScript</span><span>Fastify</span><span>PostgreSQL</span><span>Strapi / AWS</span></div></div><span className="history-number">01</span></article><article><span className="history-date">2024 — 2025</span><div><h3>Hippo Homes <span>by Dalmia</span></h3><p className="history-role">Full-stack developer</p><p>Built across POS, kiosk, manual-order and e-commerce applications. Worked on negotiation workflows, customer creation, APIs and backend performance with Redis and database optimisation.</p><div className="tags"><span>Next.js</span><span>Node.js</span><span>PostgreSQL</span><span>Redis</span></div></div><span className="history-number">02</span></article><article><span className="history-date">2021 — 2024</span><div><h3>Nethues Technologies</h3><p className="history-role">Web application development</p><p>Migrated a legacy PHP application to Next.js. Built data-driven interfaces and an events and ticketing platform with Stripe, shared UI and push notifications.</p><p className="outcome-line"><ArrowUpRight size={20}/><b>~40% performance improvement</b><span>reported in my résumé for the migration.</span></p><div className="tags"><span>Next.js</span><span>React Query</span><span>Stripe</span><span>TurboRepo</span></div></div><span className="history-number">03</span></article></div></section>}

function Today(){return <section className="today" id="today"><div className="section-label"><span className="section-number">01</span><span>Today</span></div><div className="today-grid"><div><span className="kicker">GREEN FORTUNE TECHNOLOGIES · 2025 — PRESENT</span><h2>Interfaces, workflows<br/>and the systems behind them.</h2><p>My current work spans a sales CRM, an operations platform, a shared React visualization package, and a public website with its CMS and staging environment.</p></div><div className="scope-stats" aria-label="Current project scope">{[['01','CRM & operations','Frontend + backend'],['02','Shared React package','Two applications'],['03','Website & CMS','Staging infrastructure']].map(([n,label,detail])=><div key={n}><strong>{n}</strong><span>{label}<br/>{detail}</span></div>)}</div></div></section>}
function Gallery({project}){const [active,setActive]=useState(0);if(!project.images.length)return null;return <div className="evidence-gallery"><p className="gallery-invite">Explore the screens — choose a view below.</p><div className="gallery-options">{project.images.map(([file,label],i)=><button key={file} onClick={()=>setActive(i)} aria-pressed={active===i}>{label}</button>)}</div>{project.images.map(([file,label,caption],i)=><figure key={file} hidden={active!==i}><a href={'/assets/projects/'+file+'.png'} target="_blank" rel="noopener" aria-label={'Open '+label+' at full size'}><img loading="lazy" src={'/assets/projects/'+file+'.png'} alt={caption}/></a><figcaption>{caption} <span>Open image to enlarge ↗</span></figcaption></figure>)}</div>}
function Project({slug}){const p=projects.find(p=>p.slug===slug);return <section className="case-page shell"><Link className="back-link" to="/#work"><ArrowLeft size={22}/>Back to selected work</Link><div className="case-page-heading"><span className="kicker">{p.kind} / PROJECT DETAILS</span><h1>{p.name}</h1><p>{p.summary}</p><div className="tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div></div><Gallery project={p}/><div className="verified-notes"><h2>My contribution</h2><p className="ownership-note">{p.ownership}</p>{p.sections.map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}{p.url&&<a className="solid-button" href={p.url} target="_blank" rel="noopener noreferrer">Open Recon Desk<ArrowUpRight size={24}/></a>}</div></section>}
function Lite(){return <section className="lite-page shell"><span className="kicker">A DIRECT ROUTE THROUGH THE WORK</span><h1>Ankit Chandola.<br/><span>Full-stack developer.</span></h1><p className="lite-intro">Interfaces, APIs and operational software. Based in Delhi, India. A reading version without demonstrations or ambient animation.</p><Today/><div className="lite-projects" id="work"><div className="section-label"><span className="section-number">02</span><span>Selected work</span></div><h2>Selected work</h2>{projects.map(p=><Link key={p.slug} to={'/work/'+p.slug}><div><h3>{p.name}</h3><div className="lite-description"><p>{p.summary}</p></div></div><ArrowUpRight size={30}/></Link>)}</div><Experience/><Link className="solid-button" to="/">Explore the interactive edition<ArrowRight size={23}/></Link></section>}
function Missing(){return <section className="shell not-found"><h1>A small detour.</h1><Link to="/">Return to the work</Link></section>}
export default function App(){return <div className="site"><a className="skip" href="#main">Skip to content</a><Header/><main id="main" tabIndex={-1}><Routes>{projects.map(p=><Route key={p.slug} path={'/work/'+p.slug} element={<Project slug={p.slug}/>}/>)}<Route path="/work/b2c" element={<Project slug="operations"/>}/><Route path="/work/opsgate" element={<Project slug="operations"/>}/><Route path="/lite" element={<Lite/>}/><Route path="*" element={<Missing/>}/></Routes></main><Footer/></div>}
