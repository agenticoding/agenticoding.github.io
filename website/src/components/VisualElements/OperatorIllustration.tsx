import React from 'react';
import styles from './OperatorIllustration.module.css';

// Computed via scripts/compute-operator-coords.js
// viewBox="0 0 560 280", center=(280,140), R=120, cr=26, nw=80, nh=24
const NODES = [
  {
    label: 'Research',
    // path lengths computed via numerical integration
    pathLen: 85,
    threadDelay: '0.00s',
    nodeDelay: '0.50s',
    // M tx0 ty0 Q cpx cpy ex ey
    d: 'M 280 114 Q 262 73 280 32',
    rx: 240,
    ry: 8,
  },
  {
    label: 'Plan',
    pathLen: 73,
    threadDelay: '0.15s',
    nodeDelay: '0.65s',
    d: 'M 302.5 127 Q 323.8 93.9 363.1 92',
    rx: 343.9,
    ry: 68,
  },
  {
    label: 'Execute',
    pathLen: 73,
    threadDelay: '0.30s',
    nodeDelay: '0.80s',
    d: 'M 302.5 153 Q 341.8 154.9 363.1 188',
    rx: 343.9,
    ry: 188,
  },
  {
    label: 'Validate',
    pathLen: 85,
    threadDelay: '0.45s',
    nodeDelay: '0.95s',
    d: 'M 280 166 Q 298 207 280 248',
    rx: 240,
    ry: 248,
  },
  {
    label: 'Review',
    pathLen: 73,
    threadDelay: '0.60s',
    nodeDelay: '1.10s',
    d: 'M 257.5 153 Q 236.2 186.1 196.9 188',
    rx: 136.1,
    ry: 188,
  },
  {
    label: 'Debug',
    pathLen: 73,
    threadDelay: '0.75s',
    nodeDelay: '1.25s',
    d: 'M 257.5 127 Q 218.2 125.1 196.9 92',
    rx: 136.1,
    ry: 68,
  },
] as const;

const NODE_W = 80;
const NODE_H = 24;

export default function OperatorIllustration() {
  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="auto"
      role="img"
      aria-label="One engineer at center directing six parallel AI agent tasks: Research, Plan, Execute, Validate, Review, and Debug."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <marker
          id="opArrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-violet)" />
        </marker>
      </defs>

      {/* Threads */}
      {NODES.map((n) => (
        <path
          key={n.label + '-thread'}
          className={styles.thread}
          d={n.d}
          stroke="var(--visual-violet)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          markerEnd="url(#opArrow)"
          style={{
            strokeDasharray: n.pathLen,
            strokeDashoffset: n.pathLen,
            animationDelay: n.threadDelay,
          }}
        />
      ))}

      {/* Task nodes */}
      {NODES.map((n) => (
        <g
          key={n.label + '-node'}
          className={styles.node}
          style={{ animationDelay: n.nodeDelay }}
        >
          <rect
            x={n.rx}
            y={n.ry}
            width={NODE_W}
            height={NODE_H}
            rx={12}
            fill="var(--visual-bg-cyan)"
            stroke="var(--visual-cyan)"
            strokeWidth={1}
          />
          <text
            x={n.rx + NODE_W / 2}
            y={n.ry + NODE_H / 2}
            fill="var(--visual-cyan)"
            style={{ fontFamily: 'var(--font-mono-keyword)' }}
            fontSize={11}
            fontWeight={500}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Center node — human actor (Rose) */}
      <circle
        cx={280}
        cy={140}
        r={26}
        fill="var(--visual-bg-rose)"
        stroke="var(--visual-rose)"
        strokeWidth={2.5}
      />
      <text
        x={280}
        y={140}
        fill="var(--visual-rose)"
        style={{ fontFamily: 'var(--font-mono-human)' }}
        fontSize={11}
        fontWeight={500}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        YOU
      </text>
    </svg>
  );
}
