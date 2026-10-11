import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Raw KaTeX output (Computer Modern). Animate the wrapper yourself.
export const TeX: React.FC<{tex: string; display?: boolean; style?: React.CSSProperties; className?: string}> = ({
  tex, display = false, style, className,
}) => {
  const html = React.useMemo(() => katex.renderToString(tex, {throwOnError: false, displayMode: display}), [tex, display]);
  return <span className={className} style={{whiteSpace: 'nowrap', ...style}} dangerouslySetInnerHTML={{__html: html}} />;
};

// Text containing $...$ math segments, e.g. manuscript titles from data.
export const MixedTeX: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => {
  const parts = React.useMemo(() => text.split(/(\$[^$]+\$)/g), [text]);
  return (
    <span style={style}>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') && p.length > 2 ? (
          <span key={i} dangerouslySetInnerHTML={{__html: katex.renderToString(p.slice(1, -1), {throwOnError: false})}} />
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </span>
  );
};
