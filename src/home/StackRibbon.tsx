import React from 'react';
import type { HTMLAttributes } from 'react';
import { Icon } from './icons';
const stack = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'React Router',
  'REST APIs',
  'Fastify',
  'Automated testing',
  'Reusable UI',
  'Accessible interfaces',
];
function Group(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="marquee-group" {...props}>
      {stack.map((item) => (
        <React.Fragment key={item}>
          <span>{item}</span>
          <Icon name="asterisk" />
        </React.Fragment>
      ))}
    </div>
  );
}
export default function StackRibbon() {
  return (
    <div aria-label="Technologies and capabilities" className="stack-ribbon">
      <div className="ribbon-window">
        <div className="marquee-track">
          <Group />
          <Group aria-hidden="true" />
        </div>
      </div>
      <button aria-pressed="false" className="motion" id="motion">
        <Icon name="pause" />
        <Icon name="play" />
        <span id="motion-label">Pause motion</span>
      </button>
    </div>
  );
}
