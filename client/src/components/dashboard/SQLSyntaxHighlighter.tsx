import React, { useRef, useEffect, useState } from 'react';

interface SQLSyntaxHighlighterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

// SQL syntax highlighting patterns and colors
const SQL_PATTERNS = {
  keywords: {
    pattern: /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END)\b/gi,
    className: 'sql-keyword'
  },
  functions: {
    pattern: /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP)\s*(?=\()/gi,
    className: 'sql-function'
  },
  strings: {
    pattern: /'[^']*'/g,
    className: 'sql-string'
  },
  numbers: {
    pattern: /\b\d+(\.\d+)?\b/g,
    className: 'sql-number'
  },
  operators: {
    pattern: /[=<>!]+|[\+\-\*\/]/g,
    className: 'sql-operator'
  },
  tables: {
    pattern: /\b([A-Z_][A-Z0-9_]*\.){0,2}[A-Z_][A-Z0-9_]*\b(?=\s*(?:AS\s+\w+\s*)?(?:WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ORDER|GROUP|HAVING|LIMIT|UNION|$|;|\)|,))/gi,
    className: 'sql-table'
  },
  columns: {
    pattern: /\b[A-Z_][A-Z0-9_]*(?=\s*[=<>!])|(?<=\bSELECT\s+(?:DISTINCT\s+)?)[A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)*(?=\s*(?:,|FROM|AS))/gi,
    className: 'sql-column'
  },
  comments: {
    pattern: /--.*$/gm,
    className: 'sql-comment'
  }
};

const applySyntaxHighlighting = (text: string): string => {
  if (!text) return '';
  
  let highlightedText = text;
  const tokens: Array<{start: number; end: number; className: string}> = [];
  
  // Find all tokens and their positions
  const patterns = [
    SQL_PATTERNS.comments,
    SQL_PATTERNS.strings,
    SQL_PATTERNS.keywords,
    SQL_PATTERNS.functions,
    SQL_PATTERNS.tables,
    SQL_PATTERNS.columns,
    SQL_PATTERNS.numbers,
    SQL_PATTERNS.operators
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.pattern.exec(text)) !== null) {
      tokens.push({
        start: match.index,
        end: match.index + match[0].length,
        className: pattern.className
      });
    }
    pattern.pattern.lastIndex = 0; // Reset regex
  });

  // Sort tokens by start position and remove overlaps
  tokens.sort((a, b) => a.start - b.start);
  const nonOverlappingTokens: Array<{start: number; end: number; className: string}> = [];
  for (const token of tokens) {
    if (nonOverlappingTokens.length === 0 || token.start >= nonOverlappingTokens[nonOverlappingTokens.length - 1].end) {
      nonOverlappingTokens.push(token);
    }
  }

  // Apply highlighting from end to start to avoid position shifts
  nonOverlappingTokens.reverse().forEach((token) => {
    const before = highlightedText.substring(0, token.start);
    const content = highlightedText.substring(token.start, token.end);
    const after = highlightedText.substring(token.end);
    highlightedText = before + `<span class="${token.className}">${content}</span>` + after;
  });

  return highlightedText;
};

export function SQLSyntaxHighlighter({ value, onChange, placeholder, className, onExecute }: SQLSyntaxHighlighterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightedContent, setHighlightedContent] = useState('');

  useEffect(() => {
    const highlighted = applySyntaxHighlighting(value || '');
    setHighlightedContent(highlighted);
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (onExecute) {
        onExecute();
      }
    }
  };

  return (
    <>
      <style>{`
        .sql-editor-container {
          position: relative;
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .sql-highlight-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          white-space: pre-wrap;
          word-wrap: break-word;
          padding: 12px;
          margin: 0;
          border: none;
          background: transparent;
          color: transparent;
          overflow: auto;
          z-index: 1;
          box-sizing: border-box;
        }
        
        .sql-textarea {
          position: relative;
          width: 100%;
          height: 100%;
          background: transparent;
          color: #1f2937;
          caret-color: #1f2937;
          resize: none;
          border: none;
          outline: none;
          padding: 12px;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          z-index: 2;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          box-sizing: border-box;
        }
        
        .sql-textarea::placeholder {
          color: #9ca3af;
          font-style: italic;
        }
        
        /* SQL Syntax Highlighting Colors */
        .sql-keyword {
          color: #7c3aed;
          font-weight: 600;
        }
        
        .sql-function {
          color: #059669;
          font-weight: 500;
        }
        
        .sql-string {
          color: #dc2626;
        }
        
        .sql-number {
          color: #ea580c;
        }
        
        .sql-operator {
          color: #4338ca;
          font-weight: 500;
        }
        
        .sql-table {
          color: #0891b2;
          font-weight: 500;
        }
        
        .sql-column {
          color: #be185d;
        }
        
        .sql-comment {
          color: #6b7280;
          font-style: italic;
        }
        
        /* Dark mode support */
        .dark .sql-textarea {
          color: #f9fafb;
          caret-color: #f9fafb;
        }
        
        .dark .sql-keyword {
          color: #a78bfa;
        }
        
        .dark .sql-function {
          color: #34d399;
        }
        
        .dark .sql-string {
          color: #f87171;
        }
        
        .dark .sql-number {
          color: #fb923c;
        }
        
        .dark .sql-operator {
          color: #818cf8;
        }
        
        .dark .sql-table {
          color: #22d3ee;
        }
        
        .dark .sql-column {
          color: #f472b6;
        }
        
        .dark .sql-comment {
          color: #9ca3af;
        }
      `}</style>
      
      <div className={`sql-editor-container ${className || ''}`}>
        <div 
          ref={highlightRef}
          className="sql-highlight-overlay"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
        <textarea
          ref={textareaRef}
          className="sql-textarea"
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </>
  );
}