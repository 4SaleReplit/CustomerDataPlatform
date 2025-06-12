import React, { useState, useRef, useEffect } from 'react';

interface ColoredSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function ColoredSQLEditor({ value, onChange, placeholder, className, onExecute }: ColoredSQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // Scroll synchronization
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
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

  // Apply syntax highlighting
  const getHighlightedText = (text: string) => {
    if (!text) return '';
    
    // SQL keywords
    let highlighted = text.replace(
      /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END)\b/gi,
      '<span class="sql-keyword">$1</span>'
    );

    // SQL functions
    highlighted = highlighted.replace(
      /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP)\s*(?=\()/gi,
      '<span class="sql-function">$1</span>'
    );

    // String literals
    highlighted = highlighted.replace(
      /'([^']*)'/g,
      '<span class="sql-string">\'$1\'</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b\d+(\.\d+)?\b/g,
      '<span class="sql-number">$&</span>'
    );

    // Operators
    highlighted = highlighted.replace(
      /[=<>!]+|[\+\-\*\/]/g,
      '<span class="sql-operator">$&</span>'
    );

    // Comments
    highlighted = highlighted.replace(
      /--.*$/gm,
      '<span class="sql-comment">$&</span>'
    );

    return highlighted;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <>
      <style>{`
        .colored-sql-container {
          position: relative;
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .colored-sql-highlight {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 12px;
          border: none;
          background: transparent;
          color: transparent;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow: auto;
          pointer-events: none;
          z-index: 1;
          box-sizing: border-box;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }
        
        .colored-sql-textarea {
          position: relative;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 12px;
          border: none;
          outline: none;
          background: transparent;
          color: #374151;
          caret-color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
          resize: none;
          z-index: 2;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          box-sizing: border-box;
        }
        
        .colored-sql-textarea::placeholder {
          color: #9ca3af;
          font-style: italic;
        }
        
        /* SQL Syntax Colors */
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
        
        .sql-comment {
          color: #6b7280;
          font-style: italic;
        }
        
        /* Dark mode */
        .dark .colored-sql-textarea {
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
        
        .dark .sql-comment {
          color: #9ca3af;
        }
      `}</style>
      
      <div className={`colored-sql-container ${className || ''}`}>
        <pre 
          ref={highlightRef}
          className="colored-sql-highlight"
          dangerouslySetInnerHTML={{ __html: getHighlightedText(value) }}
        />
        <textarea
          ref={textareaRef}
          className="colored-sql-textarea"
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