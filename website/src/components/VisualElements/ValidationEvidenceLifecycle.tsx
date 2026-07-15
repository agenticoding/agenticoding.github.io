import React, { useId } from 'react';

import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile } from './DiagramTile';
import styles from './ValidationEvidenceLifecycle.module.css';

const DESKTOP_STEPS = [
  { x: 24, y: 32, title: 'Claim', detail: 'what must hold', tone: 'neutral' },
  { x: 288, y: 32, title: 'Operating profile', detail: 'representative use', tone: 'indigo' },
  { x: 552, y: 32, title: 'Evidence', detail: 'correlated checks', tone: 'violet' },
  { x: 552, y: 200, title: 'Analyze + retest', detail: 'reproduce failures', tone: 'warning' },
  { x: 288, y: 200, title: 'Bounded release', detail: 'canary + rollback', tone: 'success' },
  { x: 24, y: 200, title: 'Field signals', detail: 'update the profile', tone: 'cyan' },
] as const;

const MOBILE_STEPS = [
  { y: 24, title: 'Claim', detail: 'what must hold', tone: 'neutral' },
  { y: 128, title: 'Operating profile', detail: 'representative use', tone: 'indigo' },
  { y: 232, title: 'Evidence', detail: 'correlated checks', tone: 'violet' },
  { y: 336, title: 'Analyze + retest', detail: 'reproduce failures', tone: 'warning' },
  { y: 440, title: 'Bounded release', detail: 'canary + rollback', tone: 'success' },
  { y: 544, title: 'Field signals', detail: 'update the profile', tone: 'cyan' },
] as const;

export default function ValidationEvidenceLifecycle() {
  const markerPrefix = `validation-${useId().replace(/:/g, '')}`;
  return (
    <div className={styles.container}>
      <DesktopDiagram markerPrefix={markerPrefix} />
      <MobileDiagram markerPrefix={markerPrefix} />
    </div>
  );
}

function DesktopDiagram({ markerPrefix }: { markerPrefix: string }) {
  return (
    <svg className={styles.validationDesktop} viewBox="0 0 792 352" role="img" aria-label="Validation lifecycle from a product claim through representative operating conditions, correlated evidence, retesting, bounded release, and field signals that update the profile.">
      <DiagramArrowMarkers prefix={markerPrefix} tones={['neutral', 'indigo', 'violet', 'warning', 'success', 'cyan']} />
      <DesktopArrows markerPrefix={markerPrefix} />
      {DESKTOP_STEPS.map((step) => <Tile key={step.title} {...step} />)}
    </svg>
  );
}

function MobileDiagram({ markerPrefix }: { markerPrefix: string }) {
  return (
    <svg className={styles.validationMobile} viewBox="0 0 320 672" role="img" aria-label="Validation lifecycle from a product claim through representative operating conditions, correlated evidence, retesting, bounded release, and field signals that update the profile.">
      <DiagramArrowMarkers prefix={`${markerPrefix}-mobile`} tones={['neutral', 'indigo', 'violet', 'warning', 'success', 'cyan']} />
      <MobileArrows markerPrefix={`${markerPrefix}-mobile`} />
      {MOBILE_STEPS.map((step) => <Tile key={step.title} x={24} {...step} />)}
    </svg>
  );
}

function Tile({ x, y, title, detail, tone }: { x: number; y: number; title: string; detail: string; tone: 'neutral' | 'indigo' | 'violet' | 'warning' | 'success' | 'cyan' }) {
  return <DiagramTile x={x} y={y} width={216} height={80} title={title} detail={detail} tone={tone} variant="centered" />;
}

function DesktopArrows({ markerPrefix }: { markerPrefix: string }) {
  return <>
    <DiagramArrow d="M 240 72 H 288" markerIdPrefix={markerPrefix} tone="indigo" />
    <DiagramArrow d="M 504 72 H 552" markerIdPrefix={markerPrefix} tone="violet" />
    <DiagramArrow d="M 660 112 V 200" markerIdPrefix={markerPrefix} tone="warning" />
    <DiagramArrow d="M 552 240 H 504" markerIdPrefix={markerPrefix} tone="success" />
    <DiagramArrow d="M 288 240 H 240" markerIdPrefix={markerPrefix} tone="cyan" />
    <DiagramArrow d="M 132 200 C 132 152 184 152 288 112" markerIdPrefix={markerPrefix} tone="cyan" />
  </>;
}

function MobileArrows({ markerPrefix }: { markerPrefix: string }) {
  return <>
    {MOBILE_STEPS.slice(0, -1).map((step, index) => <DiagramArrow key={step.title} d={`M 160 ${step.y + 80} V ${MOBILE_STEPS[index + 1].y}`} markerIdPrefix={markerPrefix} tone={MOBILE_STEPS[index + 1].tone} />)}
    <DiagramArrow d="M 24 584 H 8 V 168 H 24" markerIdPrefix={markerPrefix} tone="cyan" />
  </>;
}
