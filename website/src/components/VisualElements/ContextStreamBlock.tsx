import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Prism } from 'prism-react-renderer';
import styles from './ContextStreamBlock.module.css';
import type { Role, ContextEntry } from './contextStreamData';

interface Props {
  entries: ContextEntry[];
  ariaLabel?: string;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; contentClass: string; emoji: string; nudgeY?: number }> = {
  system:      { label: 'SYSTEM',      color: 'var(--visual-cyan)',    contentClass: styles.contentSystem,     emoji: '2699'  },
  user:        { label: 'USER',        color: 'var(--visual-neutral)', contentClass: styles.contentUser,       emoji: '1f913' },
  agent:       { label: 'AGENT',       color: 'var(--visual-magenta)', contentClass: styles.contentAgent,      emoji: '1f916', nudgeY: -1 },
  tool_result: { label: 'TOOL_RESULT', color: 'var(--visual-indigo)',  contentClass: styles.contentToolResult, emoji: '1f6e0' },
};

// --- Inline tokenizer ---

type TokenSpan = { text: string; className?: string };

const RE_TOOL_SIG    = /^(- )(\w+)(\([^)]*\))(: .+)$/;
const RE_TEST_STATUS = /^(PASS|FAIL) (.+)$/;
const RE_FILE_REF    = /^(- )?([\w./][\w./-]*\.\w{1,4}(?::\d+)?)(: ?.+)?$/;

const PRISM_CLASS: Record<string, string> = {
  property:    styles.jsonKey,
  string:      styles.jsonString,
  number:      styles.jsonNumber,
  boolean:     styles.jsonBool,
  null:        styles.jsonNull,
  punctuation: styles.jsonPunc,
  operator:    styles.jsonPunc,
};

function flattenContent(content: Prism.Token['content']): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(flattenContent).join('');
  return flattenContent(content.content);
}

// Module-level singleton: warn once per process if Prism JSON grammar is absent.
let _prismWarnShown = false;

function tokenizeJson(line: string): TokenSpan[] {
  if (!Prism.languages.json) {
    if (!_prismWarnShown) {
      console.warn('ContextStreamBlock: Prism JSON grammar not available — syntax highlighting degraded to plain text');
      _prismWarnShown = true;
    }
    return [{ text: line }];
  }
  const tokens = Prism.tokenize(line, Prism.languages.json);
  const spans: TokenSpan[] = [];
  for (const token of tokens) {
    if (typeof token === 'string') {
      spans.push({ text: token });
    } else {
      spans.push({ text: flattenContent(token.content), className: PRISM_CLASS[token.type] });
    }
  }
  return spans.length ? spans : [{ text: line }];
}

function isJsonLine(line: string): boolean {
  return /^\s*[{["0-9]/.test(line);
}

function tokenizeLine(line: string, role: Role): TokenSpan[] {
  switch (role) {
    case 'system': {
      const m = line.match(RE_TOOL_SIG);
      if (!m) return [{ text: line }];
      return [
        { text: m[1] },
        { text: m[2], className: styles.accentSystem },
        { text: m[3], className: styles.accentSystem },
        { text: m[4] },
      ];
    }
    case 'agent':
      return tokenizeJson(line);
    case 'tool_result': {
      const mt = line.match(RE_TEST_STATUS);
      if (mt) return [{ text: mt[1] + ' ' }, { text: mt[2], className: styles.accentToolResult }];
      const m = line.match(RE_FILE_REF);
      if (m) {
        const spans: TokenSpan[] = [];
        if (m[1]) spans.push({ text: m[1] });
        spans.push({ text: m[2], className: styles.accentToolResult });
        if (m[3]) spans.push({ text: m[3] });
        return spans;
      }
      if (isJsonLine(line)) return tokenizeJson(line);
      return [{ text: line }];
    }
    default:
      return [{ text: line }];
  }
}

// --- Component ---

export default function ContextStreamBlock({ entries, ariaLabel = 'Context window stream' }: Props) {
  const emojiBase = useBaseUrl('/img/emoji');
  return (
    <div className={styles.container} role="img" aria-label={ariaLabel}>
      {entries.map((entry, i) => {
        const config = ROLE_CONFIG[entry.role];
        return (
          <div
            key={`${entry.role}-${i}`}
            className={styles.entry}
            style={{ '--entry-accent': config.color } as React.CSSProperties}
          >
            <span className={styles.roleLabel} style={{ color: config.color }}>
              <img src={`${emojiBase}/u${config.emoji}.svg`} alt="" width={14} height={14}
                style={{ display: 'block', ...(config.nudgeY ? { transform: `translateY(${config.nudgeY}px)` } : {}) }}
              />
              {config.label}
            </span>
            <div className={config.contentClass}>
              {entry.content.map((line, j) => (
                <React.Fragment key={j}>
                  {tokenizeLine(line, entry.role).map((span, k) =>
                    span.className
                      ? <span key={k} className={span.className}>{span.text}</span>
                      : span.text
                  )}
                  {'\n'}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
