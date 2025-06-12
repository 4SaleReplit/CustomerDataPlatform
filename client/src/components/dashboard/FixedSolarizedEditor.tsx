import React, { useRef, useEffect, useState, useCallback } from 'react';

interface FixedSolarizedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function FixedSolarizedEditor({ value, onChange, placeholder, className, onExecute }: FixedSolarizedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

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

  // Create highlighted HTML content
  const getHighlightedHTML = useCallback((text: string): string => {
    if (!text) return '';
    
    let html = text;
    
    // Escape HTML first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Apply syntax highlighting with proper HTML tags
    // Keywords - Green #859900
    html = html.replace(
      /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/gi,
      '<span style="color: #859900; font-weight: 600;">$1</span>'
    );

    // Functions - Blue #268BD2
    html = html.replace(
      /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND|CHARINDEX|PATINDEX|STUFF|LEN|LTRIM|RTRIM|REVERSE|SPACE|STR|ASCII|CHAR|UNICODE|NCHAR|SOUNDEX|DIFFERENCE|QUOTENAME|REPLICATE|RIGHT)\s*(?=\()/gi,
      '<span style="color: #268BD2; font-weight: 500;">$1</span>'
    );

    // Data types - Yellow #B58900
    html = html.replace(
      /\b(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|NTEXT|BINARY|VARBINARY|IMAGE|DATE|TIME|DATETIME|DATETIME2|SMALLDATETIME|DATETIMEOFFSET|TIMESTAMP|UNIQUEIDENTIFIER|SQL_VARIANT|XML|CURSOR|TABLE|BOOLEAN|BOOL|JSON|UUID|SERIAL|AUTOINCREMENT)\b/gi,
      '<span style="color: #B58900; font-weight: 500;">$1</span>'
    );

    // Strings - Cyan #2AA198
    html = html.replace(
      /'([^']*)'/g,
      '<span style="color: #2AA198;">\'$1\'</span>'
    );

    // Numbers - Orange #D33682
    html = html.replace(
      /\b\d+(\.\d+)?\b/g,
      '<span style="color: #D33682;">$&</span>'
    );

    // Operators - Light Gray #839496
    html = html.replace(
      /([=&lt;&gt;!]+|[\+\-\*\/\%]|::|&amp;&amp;)/g,
      '<span style="color: #839496;">$1</span>'
    );

    // Comments - Dark Gray #586E75
    html = html.replace(
      /--.*$/gm,
      '<span style="color: #586E75; font-style: italic;">$&</span>'
    );

    return html;
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative ${className || ''}`} style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace" }}>
      <style>{`
        .solarized-container {
          position: relative;
          background-color: #002B36;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .solarized-highlight {
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
          font-size: 14px;
          line-height: 1.6;
        }
        
        .solarized-textarea {
          position: relative;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 12px;
          border: none;
          outline: none;
          background: transparent;
          color: #839496;
          caret-color: #839496;
          white-space: pre-wrap;
          word-wrap: break-word;
          resize: none;
          z-index: 2;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          box-sizing: border-box;
        }
        
        .solarized-textarea::placeholder {
          color: #586E75;
          font-style: italic;
        }
      `}</style>
      
      <div className="solarized-container">
        <pre 
          ref={highlightRef}
          className="solarized-highlight"
          dangerouslySetInnerHTML={{ __html: getHighlightedHTML(value) }}
        />
        <textarea
          ref={textareaRef}
          className="solarized-textarea"
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
    </div>
  );
}