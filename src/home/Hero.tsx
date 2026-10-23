import { LucideSvg } from '../components/ThemeToggle';
import { profile } from '../content/profile';
import { Icon } from './icons';
function Sheet({
  side,
  file,
  note,
  number,
  changed,
}: {
  side: 'back' | 'front';
  file: string;
  note: string;
  number: string;
  changed?: boolean;
}) {
  return (
    <div className={'sheet sheet-' + side}>
      <div className="sheet-header">
        <span className="file-symbol">
          <Icon name="sheet" />
        </span>
        <span>
          {file}
          <small>{note}</small>
        </span>
        <span>{number}</span>
      </div>
      <div className="sheet-table">
        <div>
          <b>SKU</b>
          <b>AMOUNT</b>
        </div>
        <div>
          <span>001</span>
          <span>₹1,250</span>
        </div>
        {changed ? (
          <div className="changed-cell">
            <span>002</span>
            <span>
              ₹920{' '}
              <b>
                <Icon name="arrow-up-right" />
              </b>
            </span>
          </div>
        ) : (
          <div>
            <span>002</span>
            <span>₹850</span>
          </div>
        )}
        <div>
          <span>003</span>
          <span>₹640</span>
        </div>
      </div>
    </div>
  );
}
export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="hero wrap">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="live-dot"></span> HELLO, GOOD TO HAVE YOU HERE
        </p>
        <h1 id="hero-heading">
          <span className="sr-only">Ankit Chandola. Full-stack developer.</span>
          <span aria-hidden="true" className="code-name">
            <span id="morph">{'<ankit chandola>'}</span>
            <span className="caret">_</span>
          </span>
        </h1>
        <p className="hero-title">
          Beyond the
          <br />
          <span>happy path.</span>
        </p>
        <p className="hero-description">
          A duplicated row. A survey saved without a connection. A file full of
          ambiguous matches. I build web apps and tools that handle them, from
          the first click to the systems behind it.
        </p>
        <div className="hero-actions">
          <a className="button dark" href="#playground">
            Come try my work{' '}
            <span aria-hidden="true">
              <Icon name="arrow-down-right" />
            </span>
          </a>
          <a
            className="text-link"
            href={profile.resume}
            rel="noopener"
            target="_blank"
          >
            View résumé <Icon name="arrow-up-right" />
          </a>
        </div>
        <div className="hero-foot">
          <span className="location">
            <LucideSvg name="map-pin">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </LucideSvg>{' '}
            BASED IN DELHI, INDIA
          </span>
          <a className="hero-lite-link" href="/lite">
            Lite version <Icon name="arrow-up-right" />
          </a>
        </div>
      </div>
      <a className="hero-art" href="#playground">
        <div className="orbit orbit-one"></div>
        <div className="orbit orbit-two"></div>
        <span className="art-tag">A LITTLE PREVIEW OF WHAT I BUILD</span>
        <div aria-hidden="true" className="scene">
          <Sheet
            side="back"
            file="yesterday.csv"
            note="THE ORIGINAL"
            number="01"
          />
          <Sheet
            side="front"
            file="today.xlsx"
            note="THE LATEST"
            number="02"
            changed
          />
          <div className="match-token">
            <Icon name="check" />
          </div>
          <div className="floating-result">
            <span className="result-icon">
              <Icon name="arrow-up-right" />
            </span>
            <div>
              <b>One change. Found.</b>
              <span>Even when the rows move.</span>
            </div>
          </div>
        </div>
        <div className="art-invitation">
          <div>
            <b>This one is yours to play with.</b>
            <span>Try the live demo below</span>
          </div>
          <span className="curved-arrow">
            <Icon name="arrow-down" />
          </span>
        </div>
      </a>
    </section>
  );
}
