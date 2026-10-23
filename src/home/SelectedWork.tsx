import projects from '../content/projects';
import type { Project, ProjectHome } from '../content/types.ts';
import EvidenceGallery from './EvidenceGallery';
import ReconDemo from './ReconDemo';
import { Icon, LinkArrow } from './icons';
function Flagship({
  project: p,
  home,
}: {
  project: Project;
  home: ProjectHome;
}) {
  const fact = p.facts?.[0];
  return (
    <article className="flagship" id={home.anchor}>
      <div className="feature-heading">
        <div>
          <h3>{p.name}</h3>
          <div className="tags project-kind">
            {home.label.split(' · ').map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <p>{home.tagline}</p>
          {fact && (
            <p className="feature-fact">
              <strong>{fact[0]}</strong> {fact[1]}
            </p>
          )}
        </div>
        <a
          className="button outline"
          href={p.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open the full tool <Icon name="arrow-up-right" />
        </a>
      </div>
      <ReconDemo />
      <div className="feature-bottom">
        {home.highlights.map(([title, body, icon]) => (
          <div key={title}>
            <span className="benefit-icon" aria-hidden="true">
              <Icon name={icon} />
            </span>
            <b>{title}</b>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <EvidenceGallery images={p.images} label={p.galleryLabel} />
      <details className="case-notes">
        <summary>
          Behind the build{' '}
          <span>
            Decisions, boundaries &amp; quality <b>+</b>
          </span>
        </summary>
        <div className="notes-grid">
          {home.notes.map(([title, body]) => (
            <div key={title}>
              <h4>{title}</h4>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}
function IntegratedProject({
  project: p,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <article
      className={'integrated-project' + (index % 2 ? '' : ' flip')}
      id={p.slug}
    >
      <div className="integrated-heading">
        <p className="eyebrow">{p.kind.toUpperCase()}</p>
        <h3>{p.name}</h3>
        <p className="project-summary">{p.summary}</p>
        <p className="ownership-note">
          <span>My role</span>
          {p.ownership}
        </p>
        <div className="tags">
          {p.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <a className="text-link" href={'/work/' + p.slug}>
          Project details <LinkArrow />
        </a>
      </div>
      <EvidenceGallery
        images={p.images}
        label={p.galleryLabel ?? p.name + ' screenshot views'}
      />
    </article>
  );
}
export default function SelectedWork() {
  return (
    <section className="work-section wrap" id="work">
      <div className="section-intro">
        <p className="eyebrow">01 / SELECTED WORK</p>
        <h2>
          Less “take my word for it.”
          <br />
          <span>More “give it a try.”</span>
        </h2>
        <p className="section-description">
          Try a useful tool, explore the systems I’ve worked on, and take a
          closer look at the decisions behind them.
        </p>
      </div>
      {projects.map((p, i) =>
        p.home ? (
          <Flagship key={p.slug} project={p} home={p.home} />
        ) : (
          <IntegratedProject key={p.slug} project={p} index={i} />
        ),
      )}
    </section>
  );
}
