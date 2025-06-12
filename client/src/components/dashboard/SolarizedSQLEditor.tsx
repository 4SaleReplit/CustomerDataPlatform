import React, { useRef, useEffect, useState } from 'react';

interface SolarizedSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function SolarizedSQLEditor({ value, onChange, placeholder, className, onExecute }: SolarizedSQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightedContent, setHighlightedContent] = useState('');

  // SQL syntax highlighting with Solarized Dark colors
  const applySyntaxHighlighting = (text: string): string => {
    if (!text) return '';
    
    let highlighted = text;
    
    // Keywords (SELECT, FROM, etc.) - Green #859900
    highlighted = highlighted.replace(
      /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/gi,
      '<span class="sql-keyword">$1</span>'
    );

    // Functions - Blue #268BD2  
    highlighted = highlighted.replace(
      /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND|SUBSTRING|CHARINDEX|PATINDEX|STUFF|LEN|LTRIM|RTRIM|REVERSE|SPACE|STR|ASCII|CHAR|UNICODE|NCHAR|SOUNDEX|DIFFERENCE|QUOTENAME|REPLICATE|RIGHT|LEFT)\s*(?=\()/gi,
      '<span class="sql-function">$1</span>'
    );

    // Data types - Yellow #B58900
    highlighted = highlighted.replace(
      /\b(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|NTEXT|BINARY|VARBINARY|IMAGE|DATE|TIME|DATETIME|DATETIME2|SMALLDATETIME|DATETIMEOFFSET|TIMESTAMP|UNIQUEIDENTIFIER|SQL_VARIANT|XML|CURSOR|TABLE|BOOLEAN|BOOL|JSON|UUID|SERIAL|AUTOINCREMENT)\b/gi,
      '<span class="sql-datatype">$1</span>'
    );

    // Strings - Cyan #2AA198
    highlighted = highlighted.replace(
      /'([^']*)'/g,
      '<span class="sql-string">\'$1\'</span>'
    );

    // Numeric values - Orange #D33682
    highlighted = highlighted.replace(
      /\b\d+(\.\d+)?\b/g,
      '<span class="sql-number">$&</span>'
    );

    // Operators - Light Gray #839496 (same as default text)
    highlighted = highlighted.replace(
      /([=<>!]+|[\+\-\*\/\%]|::|\|\||&&)/g,
      '<span class="sql-operator">$1</span>'
    );

    // Comments - Dark Gray #586E75
    highlighted = highlighted.replace(
      /--.*$/gm,
      '<span class="sql-comment">$&</span>'
    );

    highlighted = highlighted.replace(
      /\/\*[\s\S]*?\*\//g,
      '<span class="sql-comment">$&</span>'
    );

    return highlighted;
  };

  // Update highlighted content when value changes
  useEffect(() => {
    const highlighted = applySyntaxHighlighting(value || '');
    setHighlightedContent(highlighted);
  }, [value]);

  // Synchronize scroll between textarea and highlight overlay
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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <>
      <style>{`
        .solarized-sql-container {
          position: relative;
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          background-color: #002B36;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .solarized-highlight-overlay {
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
        
        .solarized-sql-textarea {
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
          font-size: inherit;
          line-height: inherit;
          box-sizing: border-box;
        }
        
        .solarized-sql-textarea::placeholder {
          color: #586E75;
          font-style: italic;
        }
        
        /* Solarized Dark SQL Syntax Colors */
        .sql-keyword {
          color: #859900;
          font-weight: 600;
        }
        
        .sql-function {
          color: #268BD2;
          font-weight: 500;
        }
        
        .sql-datatype {
          color: #B58900;
          font-weight: 500;
        }
        
        .sql-string {
          color: #2AA198;
        }
        
        .sql-number {
          color: #D33682;
        }
        
        .sql-operator {
          color: #839496;
        }
        
        .sql-comment {
          color: #586E75;
          font-style: italic;
        }
      `}</style>
      
      <div className={`solarized-sql-container ${className || ''}`}>
        <div 
          ref={highlightRef}
          className="solarized-highlight-overlay"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
        <textarea
          ref={textareaRef}
          className="solarized-sql-textarea"
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