import type {
  DiagramStep,
  ProjectChallenge,
  ProjectDiagram,
  ProjectImage,
  Scope,
} from '../src/content/types.ts';

export function checkContentContracts(
  acceptImage: (image: ProjectImage) => void,
  acceptChallenge: (challenge: ProjectChallenge) => void,
  acceptDiagram: (diagram: ProjectDiagram) => void,
  acceptStep: (step: DiagramStep) => void,
  acceptScope: (scope: Scope) => void,
) {
  acceptImage(['screen', 'View', 'Caption']);
  // @ts-expect-error A screenshot needs its accessible caption.
  acceptImage(['screen', 'View']);
  acceptChallenge(['Title', 'Problem', 'Decision', 'Trade-off']);
  // @ts-expect-error A challenge must include its trade-off.
  acceptChallenge(['Title', 'Problem', 'Decision']);
  acceptDiagram({ title: 'Flow', lanes: [{ steps: [['Step', 'Note']] }] });
  acceptDiagram({ title: 'Owners', columns: [['Owner', ['Responsibility']]] });
  // @ts-expect-error A diagram cannot mix flow lanes and ownership columns.
  acceptDiagram({ title: 'Mixed', lanes: [], columns: [] });
  // @ts-expect-error A diagram must select a supported variant.
  acceptDiagram({ title: 'Missing variant' });
  acceptStep(['Step', 'Note', 'Saved']);
  // @ts-expect-error A state badge is text, not an arbitrary object.
  acceptStep(['Step', 'Note', { state: 'Saved' }]);
  acceptScope(['01', 'Scope', 'Detail']);
  // @ts-expect-error Scope numbers do not replace their explanatory detail.
  acceptScope(['01', 'Scope']);
}
