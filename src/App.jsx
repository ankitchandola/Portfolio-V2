import React, { useState } from 'react';
import { Routes, Route } from 'react-router';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  FileText,
  Github,
  Linkedin,
  Accessibility,
} from 'lucide-react';
import { profile, scope, year } from './content/profile';
import { experience } from './content/experience';
import HeaderNavigation from './components/HeaderNavigation';
import projects from './content/projects.json';
import Ricochet from './play/Ricochet';
function Header() {
  return (
    <header className="header shell">
      <a className="wordmark" href="/" aria-label="Ankit Chandola homepage">
        <span className="monogram">
          a<span>c</span>
        </span>
        <span>
          Ankit Chandola<span className="brand-sub">FULL-STACK DEVELOPER</span>
        </span>
      </a>
      <HeaderNavigation />
    </header>
  );
}
function Footer() {
  return (
    <>
      <section className="contact shell" id="contact">
        <div className="contact-label">
          <span>Delhi, India · Full-stack development</span>
        </div>
        <div className="contact-title">
          <h2>
            Let’s make
            <br />
            <span>something work.</span>
          </h2>
          <a
            className="contact-arrow"
            href={'mailto:' + profile.email}
            aria-label="Email Ankit"
          >
            <ArrowUpRight size={70} strokeWidth={1.3} />
          </a>
        </div>
        <a className="contact-email" href={'mailto:' + profile.email}>
          {profile.email}
          <ArrowUpRight size={28} />
        </a>
      </section>
      <footer className="footer shell">
        <span>
          © {year} {profile.name}
        </span>
        <div>
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            <Github size={24} />
            GitHub
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin size={24} />
            LinkedIn
          </a>
          <a href={profile.resume} target="_blank" rel="noopener">
            <FileText size={24} />
            Résumé
          </a>
        </div>
        <a href="/lite">
          <Accessibility size={21} />
          Lite version
        </a>
      </footer>
    </>
  );
}
function Experience() {
  return (
    <section className="experience shell" id="experience">
      <div className="section-label">
        <span className="section-number">03</span>
        <span>Today, and what came before.</span>
      </div>
      <div className="experience-intro">
        <h2>
          The perspective
          <br />
          <span>came from building.</span>
        </h2>
        <p>
          Different teams, different constraints.
          <br /> The same habit of following a feature all the way through.
        </p>
      </div>
      <div className="history-list">
        {experience.map(
          ({ dates, company, companyNote, liteCompany, role, lite: r }, i) => (
            <article key={dates}>
              <span className="history-date">{dates}</span>
              <div>
                <h3>
                  {liteCompany ?? company}
                  {companyNote && (
                    <>
                      {' '}
                      <span>{companyNote}</span>
                    </>
                  )}
                </h3>
                <p className="history-role">{role}</p>
                <p>{r.summary}</p>
                {r.outcome && (
                  <p className="outcome-line">
                    <ArrowUpRight size={20} />
                    <b>{r.outcome[0]}</b>
                    <span>{r.outcome[1]}</span>
                  </p>
                )}
                <div className="tags">
                  {r.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <span className="history-number">
                {String(i + 1).padStart(2, '0')}
              </span>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

function Today() {
  return (
    <section className="today" id="today">
      <div className="section-label">
        <span className="section-number">01</span>
        <span>Today</span>
      </div>
      <div className="today-grid">
        <div>
          <span className="kicker">
            GREEN FORTUNE TECHNOLOGIES · 2025 — PRESENT
          </span>
          <h2>
            Interfaces, workflows
            <br />
            and the systems behind them.
          </h2>
          <p>
            My current work spans a sales CRM, an operations platform, a shared
            React visualization package, and a public website with its CMS and
            staging environment.
          </p>
        </div>
        <div className="scope-stats" aria-label="Current project scope">
          {scope.map(([n, label, detail]) => (
            <div key={n}>
              <strong>{n}</strong>
              <span>
                <span className="scope-name">{label}</span>
                <br />
                <span className="scope-detail">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function Gallery({ project }) {
  const [active, setActive] = useState(0);
  if (!project.images.length) return null;
  return (
    <div className="evidence-gallery">
      <p className="gallery-invite">
        Explore the screens — choose a view below.
      </p>
      <div className="gallery-options">
        {project.images.map(([file, label], i) => (
          <button
            key={file}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
          >
            {label}
          </button>
        ))}
      </div>
      {project.images.map(([file, label, caption], i) => (
        <figure key={file} hidden={active !== i}>
          <a
            href={'/assets/projects/' + file + '.png'}
            target="_blank"
            rel="noopener"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              loading="lazy"
              src={'/assets/projects/' + file + '.png'}
              alt={caption}
            />
          </a>
          <figcaption>
            {caption}{' '}
            <span>
              <a
                href={'/assets/projects/' + file + '.png'}
                target="_blank"
                rel="noopener"
                aria-label={'Open full screenshot: ' + label}
              >
                Open full screenshot <ArrowUpRight size={14} />
              </a>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
function Diagram({ diagram: d }) {
  return (
    <figure className="case-diagram">
      <figcaption>{d.title}</figcaption>
      {d.lanes ? (
        d.lanes.map((lane, i) => (
          <div className="diagram-lane" key={i}>
            {lane.title && <h3>{lane.title}</h3>}
            <ol>
              {lane.steps.map(([label, note, state]) => (
                <li key={label}>
                  <b>{label}</b>
                  {note && <span>{note}</span>}
                  {state && <em>{state}</em>}
                </li>
              ))}
            </ol>
          </div>
        ))
      ) : (
        <div className="diagram-columns">
          {d.columns.map(([heading, items]) => (
            <div key={heading}>
              <h3>{heading}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
function ProjectNav({ index }) {
  const prev = projects[(index + projects.length - 1) % projects.length],
    next = projects[(index + 1) % projects.length];
  return (
    <nav className="project-nav" aria-label="More projects">
      <a href={'/work/' + prev.slug}>
        <span>
          <ArrowLeft size={18} />
          Previous
        </span>
        <b>{prev.name}</b>
      </a>
      <a href={'/work/' + next.slug}>
        <span>
          Next
          <ArrowRight size={18} />
        </span>
        <b>{next.name}</b>
      </a>
    </nav>
  );
}
function Project({ slug }) {
  const index = projects.findIndex((p) => p.slug === slug),
    p = projects[index];
  return (
    <section className="case-page shell">
      <a className="back-link" href="/#work">
        <ArrowLeft size={22} />
        Back to selected work
      </a>
      <div className="case-page-heading">
        <span className="kicker">{p.kind} / PROJECT DETAILS</span>
        <h1>{p.name}</h1>
        <p>{p.summary}</p>
        {p.context && <p className="case-context">{p.context.join(' · ')}</p>}
        <div className="tags">
          {p.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      <Gallery project={p} />
      {p.problem && (
        <div className="verified-notes">
          <h2>The problem</h2>
          <p className="problem-note">{p.problem}</p>
          {p.diagram && <Diagram diagram={p.diagram} />}
        </div>
      )}
      <div className="verified-notes">
        <h2>My contribution</h2>
        <p className="ownership-note">{p.ownership}</p>
        {p.sections.map(([title, body]) => (
          <section key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </section>
        ))}
      </div>
      {p.challenges && (
        <div className="verified-notes">
          <h2>Engineering challenges</h2>
          {p.challenges.map(([title, problem, decision, tradeoff], i) => (
            <section className="challenge" key={title}>
              <h3>
                <span className="challenge-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {title}
              </h3>
              <dl>
                <dt>Problem</dt>
                <dd>{problem}</dd>
                <dt>Decision</dt>
                <dd>{decision}</dd>
                <dt>Trade-off</dt>
                <dd>{tradeoff}</dd>
              </dl>
            </section>
          ))}
        </div>
      )}
      {(p.result || p.facts) && (
        <div className="verified-notes">
          <h2>Result</h2>
          {p.result && <p>{p.result}</p>}
          {p.facts && (
            <ul className="fact-list">
              {p.facts.map(([value, label, caveat]) => (
                <li key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{caveat}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {p.limits && (
        <div className="verified-notes">
          <h2>Scope limits</h2>
          <p>{p.limits}</p>
          {p.url && (
            <a
              className="solid-button"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Recon Desk
              <ArrowUpRight size={24} />
            </a>
          )}
        </div>
      )}
      <ProjectNav index={index} />
    </section>
  );
}
function Lite() {
  return (
    <section className="lite-page shell">
      <span className="kicker">A DIRECT ROUTE THROUGH THE WORK</span>
      <h1>
        Ankit Chandola.
        <br />
        <span>Full-stack developer.</span>
      </h1>
      <p className="lite-intro">
        Interfaces, APIs and operational software. Based in Delhi, India. A
        reading version without demonstrations or ambient animation.
      </p>
      <Today />
      <div className="lite-projects" id="work">
        <div className="section-label">
          <span className="section-number">02</span>
          <span>Selected work</span>
        </div>
        <h2>Selected work</h2>
        {projects.map((p) => (
          <a key={p.slug} href={'/work/' + p.slug}>
            <div>
              <h3>{p.name}</h3>
              <div className="lite-description">
                <p>{p.summary}</p>
              </div>
            </div>
            <ArrowUpRight size={30} />
          </a>
        ))}
      </div>
      <Experience />
      <a className="solid-button" href="/">
        Explore the interactive edition
        <ArrowRight size={23} />
      </a>
    </section>
  );
}
function Missing() {
  return (
    <section className="shell not-found">
      <h1>A small detour.</h1>
      <a href="/">Return to the work</a>
    </section>
  );
}
export default function App() {
  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          {projects.map((p) => (
            <Route
              key={p.slug}
              path={'/work/' + p.slug}
              element={<Project slug={p.slug} />}
            />
          ))}
          <Route path="/play" element={<Ricochet />} />
          <Route path="/lite" element={<Lite />} />
          <Route path="*" element={<Missing />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
