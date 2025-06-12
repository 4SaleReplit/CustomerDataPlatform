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

  // Solarized Dark color scheme - exact specification
  const tokenColors = {
    keyword: '#859900',    // Green - Keywords (SELECT, FROM, etc.)
    function: '#268BD2',   // Blue - Functions (SUM(), AVG(), etc.)
    datatype: '#B58900',   // Yellow - Data Types (INT, VARCHAR, etc.)
    string: '#2AA198',     // Cyan - Strings
    number: '#D33682',     // Orange - Numeric Values
    operator: '#839496',   // Light Gray - Operators (+, -, =, etc.)
    comment: '#586E75',    // Dark Gray - Comments
    default: '#839496'     // Light Gray - Default Text
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

  // Tokenize and colorize text with proper Solarized Dark colors
  const colorizeText = useCallback((text: string): string => {
    if (!text) return '';
    
    // Start with escaped HTML and preserve line breaks
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Apply syntax highlighting in order of precedence to avoid conflicts
    // 1. Comments first (to avoid highlighting keywords inside comments)
    html = html.replace(sqlPatterns.comments, `<span style="color: ${tokenColors.comment}; font-style: italic;">$&</span>`);
    
    // 2. Strings (to avoid highlighting keywords inside strings)
    html = html.replace(sqlPatterns.strings, `<span style="color: ${tokenColors.string};">$&</span>`);
    
    // 3. Keywords (SELECT, FROM, etc.) - Green #859900
    html = html.replace(sqlPatterns.keywords, `<span style="color: ${tokenColors.keyword}; font-weight: 600;">$&</span>`);
    
    // 4. Functions (SUM(), AVG(), etc.) - Blue #268BD2
    html = html.replace(sqlPatterns.functions, `<span style="color: ${tokenColors.function}; font-weight: 500;">$&</span>`);
    
    // 5. Data types (INT, VARCHAR, etc.) - Yellow #B58900
    html = html.replace(sqlPatterns.datatypes, `<span style="color: ${tokenColors.datatype}; font-weight: 500;">$&</span>`);
    
    // 6. Numeric values - Orange #D33682
    html = html.replace(sqlPatterns.numbers, `<span style="color: ${tokenColors.number};">$&</span>`);
    
    // 7. Operators (+, -, =, etc.) - Light Gray #839496
    html = html.replace(sqlPatterns.operators, `<span style="color: ${tokenColors.operator};">$&</span>`);

    return html;
  }, [tokenColors]);

  // Handle contenteditable input with real-time highlighting
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';
    onChange(text);
    
    // Use a timeout to apply highlighting after the input event
    setTimeout(() => {
      if (target && text) {
        const selection = window.getSelection();
        let cursorPosition = 0;
        
        // Get cursor position
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          cursorPosition = range.startOffset;
        }
        
        // Apply syntax highlighting
        const colorized = colorizeText(text);
        target.innerHTML = colorized;
        
        // Restore cursor position
        if (selection && target.firstChild) {
          try {
            const range = document.createRange();
            range.setStart(target.firstChild, Math.min(cursorPosition, target.textContent?.length || 0));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (error) {
            // Place cursor at end if restoration fails
            const range = document.createRange();
            range.selectNodeContents(target);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }, 0);
  }, [onChange, colorizeText]);

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

  // Update content when value changes from external source
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (value) {
        const colorized = colorizeText(value);
        editorRef.current.innerHTML = colorized;
      } else if (placeholder) {
        editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
      } else {
        editorRef.current.innerHTML = '';
      }
    }
  }, [value, colorizeText, placeholder, tokenColors.comment]);

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