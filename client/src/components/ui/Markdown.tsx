import ReactMarkdown from 'react-markdown';

/** Renders AI Markdown. Raw HTML stays disabled (react-markdown default), NFR-7. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown components={{ a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" /> }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
