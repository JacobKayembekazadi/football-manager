/**
 * MarkdownRenderer Component
 *
 * Renders markdown content as styled HTML with support for:
 * - Headers, bold, italic
 * - Tables with proper styling
 * - Code blocks and inline code
 * - Lists (ordered and unordered)
 * - Links
 * - Blockquotes
 * - Dark mode support (add 'prose-invert' to className)
 */

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const isDark = className.includes('prose-invert');

  // Dynamic colors based on mode
  const colors = {
    text: isDark ? 'text-slate-300' : 'text-slate-700',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    heading: isDark ? 'text-white' : 'text-slate-800',
    link: isDark ? 'text-green-400' : 'text-blue-600',
    code: isDark ? 'bg-white/10 text-green-400' : 'bg-slate-200 text-pink-600',
    codeBlock: isDark ? 'bg-black/40' : 'bg-slate-900',
    codeLang: isDark ? 'bg-black/60 text-slate-400' : 'bg-slate-800 text-slate-400',
    blockquote: isDark ? 'border-green-500 bg-green-500/10' : 'border-blue-400 bg-blue-50',
    tableBg: isDark ? 'bg-white/5' : 'bg-white',
    tableHeader: isDark ? 'bg-white/10' : 'bg-slate-100',
    tableBorder: isDark ? 'border-white/10' : 'border-slate-200',
    tableRowAlt: isDark ? 'bg-white/5' : 'bg-slate-50',
  };

  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let tableRows: string[] = [];
    let inTable = false;
    let listItems: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let codeBlock: { lang: string; code: string[] } | null = null;

    const flushList = () => {
      if (listItems) {
        const ListTag = listItems.type === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${i}`} className={`${listItems.type === 'ol' ? 'list-decimal' : 'list-disc'} ml-4 my-2 space-y-1`}>
            {listItems.items.map((item, idx) => (
              <li key={idx} className={colors.text}>{parseInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = null;
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        const headerRow = tableRows[0].split('|').filter(c => c.trim());
        const dataRows = tableRows.slice(2).map(row => row.split('|').filter(c => c.trim()));

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-3">
            <table className={`min-w-full border ${colors.tableBorder} rounded-lg overflow-hidden`}>
              <thead className={colors.tableHeader}>
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className={`px-3 py-2 text-left text-xs font-semibold ${colors.textMuted} border-b ${colors.tableBorder}`}>
                      {parseInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? colors.tableBg : colors.tableRowAlt}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className={`px-3 py-2 text-sm ${colors.text} border-b ${colors.tableBorder}`}>
                        {parseInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden">
            {codeBlock.lang && (
              <div className={`${colors.codeLang} px-3 py-1 text-xs`}>{codeBlock.lang}</div>
            )}
            <pre className={`${colors.codeBlock} p-3 overflow-x-auto`}>
              <code className="text-sm text-green-400 font-mono">{codeBlock.code.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlock = null;
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      // Code block start/end
      if (line.startsWith('```')) {
        if (codeBlock) {
          flushCodeBlock();
        } else {
          flushList();
          flushTable();
          codeBlock = { lang: line.slice(3).trim(), code: [] };
        }
        i++;
        continue;
      }

      // Inside code block
      if (codeBlock) {
        codeBlock.code.push(line);
        i++;
        continue;
      }

      // Table detection
      if (line.includes('|') && line.trim().startsWith('|')) {
        flushList();
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
        i++;
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(<h4 key={i} className={`text-sm font-bold ${colors.heading} mt-3 mb-1`}>{parseInline(line.slice(4))}</h4>);
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(<h3 key={i} className={`text-base font-bold ${colors.heading} mt-3 mb-1`}>{parseInline(line.slice(3))}</h3>);
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(<h2 key={i} className={`text-lg font-bold ${colors.heading} mt-3 mb-2`}>{parseInline(line.slice(2))}</h2>);
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={i} className={`border-l-4 ${colors.blockquote} pl-3 my-2 italic py-2 pr-3 rounded-r`}>
            {parseInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
        flushList();
        elements.push(<hr key={i} className={`my-3 ${colors.tableBorder}`} />);
        i++;
        continue;
      }

      // Unordered list
      if (line.match(/^[\s]*[-*]\s/)) {
        const item = line.replace(/^[\s]*[-*]\s/, '');
        if (!listItems || listItems.type !== 'ul') {
          flushList();
          listItems = { type: 'ul', items: [] };
        }
        listItems.items.push(item);
        i++;
        continue;
      }

      // Ordered list
      if (line.match(/^[\s]*\d+\.\s/)) {
        const item = line.replace(/^[\s]*\d+\.\s/, '');
        if (!listItems || listItems.type !== 'ol') {
          flushList();
          listItems = { type: 'ol', items: [] };
        }
        listItems.items.push(item);
        i++;
        continue;
      }

      // Empty line
      if (!line.trim()) {
        flushList();
        i++;
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(<p key={i} className={`${colors.text} my-1`}>{parseInline(line)}</p>);
      i++;
    }

    // Flush any remaining content
    flushList();
    flushTable();
    flushCodeBlock();

    return elements;
  };

  const parseInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text** or __text__
      const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(boldMatch[1]);
        parts.push(<strong key={key++} className="font-semibold">{parseInline(boldMatch[3])}</strong>);
        remaining = boldMatch[4];
        continue;
      }

      // Italic: *text* or _text_
      const italicMatch = remaining.match(/^(.*?)(\*|_)(.+?)\2(.*)$/s);
      if (italicMatch && !italicMatch[1].endsWith('*') && !italicMatch[4].startsWith('*')) {
        if (italicMatch[1]) parts.push(italicMatch[1]);
        parts.push(<em key={key++} className="italic">{parseInline(italicMatch[3])}</em>);
        remaining = italicMatch[4];
        continue;
      }

      // Inline code: `code`
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(codeMatch[1]);
        parts.push(
          <code key={key++} className={`${colors.code} px-1.5 py-0.5 rounded text-sm font-mono`}>
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
        continue;
      }

      // Link: [text](url)
      const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/s);
      if (linkMatch) {
        if (linkMatch[1]) parts.push(linkMatch[1]);
        parts.push(
          <a key={key++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className={`${colors.link} hover:underline`}>
            {linkMatch[2]}
          </a>
        );
        remaining = linkMatch[4];
        continue;
      }

      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
