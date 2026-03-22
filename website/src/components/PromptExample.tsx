import React, { type ReactNode } from 'react';

// Markdown structural punctuation at text-node start
const RE_HEADING = /^(#{1,6}) /;
const RE_UL      = /^(-) /;
const RE_OL      = /^(\d+\.) /;

/** Wrap leading markdown punctuation in a colored span. */
function colorize(text: string): ReactNode {
  for (const re of [RE_HEADING, RE_UL, RE_OL]) {
    const m = text.match(re);
    if (m) {
      return (
        <>
          <span className="md-punct">{m[1]}</span>
          {text.slice(m[1].length)}
        </>
      );
    }
  }
  return text;
}

/** Recursively walk JSX children, colorizing text nodes. */
function walk(children: ReactNode): ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') return colorize(child);
    if (!React.isValidElement(child)) return child;
    // Leaf elements like <br /> — pass through
    if (!child.props.children) return child;
    // Recurse into all children, including <code> elements — intentional.
    // Styled code spans like <code className="mono-spec"># Task:</code> should
    // also receive cyan punctuation so heading/list markers look consistent
    // whether they appear in plain text or in a voice-typed code span.
    return React.cloneElement(child as React.ReactElement<{ children?: ReactNode }>, {}, walk(child.props.children));
  });
}

export default function PromptExample({ children }: { children: ReactNode }) {
  return <div className="prompt-example">{walk(children)}</div>;
}
