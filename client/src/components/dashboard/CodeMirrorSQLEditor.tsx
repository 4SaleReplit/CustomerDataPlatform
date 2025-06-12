import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CodeMirrorSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function CodeMirrorSQLEditor({ value, onChange, placeholder, className, onExecute }: CodeMirrorSQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // SQL token types and their colors
  const tokenColors = {
    keyword: '#859900',
    function: '#268BD2', 
    datatype: '#B58900',
    string: '#2AA198',
    number: '#D33682',
    operator: '#839496',
    comment: '#586E75',
    default: '#839496'
  };

  // SQL patterns
  const sqlPatterns = {
    keywords: /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/gi,
    functions: /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND)\s*(?=\()/gi,
    datatypes: /\b(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|NTEXT|BINARY|VARBINARY|IMAGE|DATE|TIME|DATETIME|DATETIME2|SMALLDATETIME|DATETIMEOFFSET|TIMESTAMP|UNIQUEIDENTIFIER|SQL_VARIANT|XML|CURSOR|TABLE|BOOLEAN|BOOL|JSON|UUID|SERIAL|AUTOINCREMENT)\b/gi,
    strings: /'([^']*)'/g,
    numbers: /\b\d+(\.\d+)?\b/g,
    operators: /([=<>!]+|[\+\-\*\/\%]|::|&&|\|\|)/g,
    comments: /--.*$/gm
  };

  // Tokenize and colorize text
  const colorizeText = useCallback((text: string): string => {
    if (!text) return '';
    
    // Start with escaped HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Apply syntax highlighting
    html = html.replace(sqlPatterns.comments, `<span style="color: ${tokenColors.comment}; font-style: italic;">$&</span>`);
    html = html.replace(sqlPatterns.strings, `<span style="color: ${tokenColors.string};">$&</span>`);
    html = html.replace(sqlPatterns.keywords, `<span style="color: ${tokenColors.keyword}; font-weight: 600;">$&</span>`);
    html = html.replace(sqlPatterns.functions, `<span style="color: ${tokenColors.function}; font-weight: 500;">$&</span>`);
    html = html.replace(sqlPatterns.datatypes, `<span style="color: ${tokenColors.datatype}; font-weight: 500;">$&</span>`);
    html = html.replace(sqlPatterns.numbers, `<span style="color: ${tokenColors.number};">$&</span>`);
    html = html.replace(sqlPatterns.operators, `<span style="color: ${tokenColors.operator};">$&</span>`);

    return html;
  }, []);

  // Handle contenteditable input
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';
    onChange(text);
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (onExecute) {
        onExecute();
      }
    }
  }, [onExecute]);

  // Update content when value changes
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const colorized = colorizeText(value);
      editorRef.current.innerHTML = colorized || `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder || ''}</span>`;
    }
  }, [value, colorizeText, placeholder]);

  // Handle focus/blur for placeholder
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (editorRef.current && !value) {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (editorRef.current && !value && placeholder) {
      editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
    }
  }, [value, placeholder]);

  return (
    <div className={`relative ${className || ''}`}>
      <style>{`
        .codemirror-sql-editor {
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          letter-spacing: 0.025em;
          width: 100%;
          height: 100%;
          padding: 12px;
          margin: 0;
          border: none;
          outline: none;
          box-sizing: border-box;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          
          /* Solarized Dark Theme */
          background-color: #002B36;
          color: #839496;
          caret-color: #839496;
        }
        
        .codemirror-sql-editor:empty:before {
          content: attr(data-placeholder);
          color: #586E75;
          font-style: italic;
          pointer-events: none;
        }
        
        .codemirror-sql-editor::selection {
          background-color: #073642;
        }
        
        .codemirror-sql-editor:focus {
          outline: none;
        }
      `}</style>
      
      <div
        ref={editorRef}
        className="codemirror-sql-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}