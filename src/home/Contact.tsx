import { profile } from '../content/profile';
import { Icon } from './icons';
export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="wrap">
        <p className="eyebrow">05 / START WITH A HELLO</p>
        <div className="contact-main">
          <h2>
            Something in mind?
            <br />
            <span>Let’s build it well.</span>
          </h2>
          <a
            aria-label="Email Ankit"
            className="contact-orb"
            href={'mailto:' + profile.email}
          >
            <Icon name="arrow-up-right" />
          </a>
        </div>
        <div className="contact-bottom">
          <a className="email" href={'mailto:' + profile.email}>
            {profile.email} <Icon name="arrow-up-right" />
          </a>
          <div>
            <a href={profile.github} rel="noopener noreferrer" target="_blank">
              <Icon name="github" />
              GitHub{' '}
            </a>
            <a
              href={profile.linkedin}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="linkedin" />
              LinkedIn{' '}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
