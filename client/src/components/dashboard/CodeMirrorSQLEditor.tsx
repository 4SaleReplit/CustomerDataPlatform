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
    
    // Escape HTML first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Split by lines to preserve line breaks
    const lines = escaped.split('\n');
    const colorizedLines = lines.map(line => {
      if (!line) return '';
      
      // Use a more precise tokenization approach
      const tokens = [];
      let remaining = line;
      let position = 0;
      
      while (remaining) {
        let matched = false;
        
        // Check for comments first
        const commentMatch = remaining.match(/^--.*$/);
        if (commentMatch) {
          tokens.push(`<span style="color: ${tokenColors.comment}; font-style: italic;">${commentMatch[0]}</span>`);
          remaining = '';
          matched = true;
        }
        
        // Check for strings
        if (!matched) {
          const stringMatch = remaining.match(/^'[^']*'/);
          if (stringMatch) {
            tokens.push(`<span style="color: ${tokenColors.string};">${stringMatch[0]}</span>`);
            remaining = remaining.slice(stringMatch[0].length);
            matched = true;
          }
        }
        
        // Check for keywords
        if (!matched) {
          const keywordMatch = remaining.match(/^(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/i);
          if (keywordMatch) {
            tokens.push(`<span style="color: ${tokenColors.keyword}; font-weight: 600;">${keywordMatch[0]}</span>`);
            remaining = remaining.slice(keywordMatch[0].length);
            matched = true;
          }
        }
        
        // Check for functions
        if (!matched) {
          const functionMatch = remaining.match(/^(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND)\s*(?=\()/i);
          if (functionMatch) {
            tokens.push(`<span style="color: ${tokenColors.function}; font-weight: 500;">${functionMatch[0]}</span>`);
            remaining = remaining.slice(functionMatch[0].length);
            matched = true;
          }
        }
        
        // Check for data types
        if (!matched) {
          const datatypeMatch = remaining.match(/^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|NTEXT|BINARY|VARBINARY|IMAGE|DATE|TIME|DATETIME|DATETIME2|SMALLDATETIME|DATETIMEOFFSET|TIMESTAMP|UNIQUEIDENTIFIER|SQL_VARIANT|XML|CURSOR|TABLE|BOOLEAN|BOOL|JSON|UUID|SERIAL|AUTOINCREMENT)\b/i);
          if (datatypeMatch) {
            tokens.push(`<span style="color: ${tokenColors.datatype}; font-weight: 500;">${datatypeMatch[0]}</span>`);
            remaining = remaining.slice(datatypeMatch[0].length);
            matched = true;
          }
        }
        
        // Check for numbers
        if (!matched) {
          const numberMatch = remaining.match(/^\d+(\.\d+)?/);
          if (numberMatch) {
            tokens.push(`<span style="color: ${tokenColors.number};">${numberMatch[0]}</span>`);
            remaining = remaining.slice(numberMatch[0].length);
            matched = true;
          }
        }
        
        // Check for operators
        if (!matched) {
          const operatorMatch = remaining.match(/^([=<>!]+|[\+\-\*\/\%]|::|&&|\|\|)/);
          if (operatorMatch) {
            tokens.push(`<span style="color: ${tokenColors.operator};">${operatorMatch[0]}</span>`);
            remaining = remaining.slice(operatorMatch[0].length);
            matched = true;
          }
        }
        
        // If no match, take the next character as default text
        if (!matched) {
          tokens.push(remaining.charAt(0));
          remaining = remaining.slice(1);
        }
      }
      
      return tokens.join('');
    });
    
    return colorizedLines.join('<br>');
  }, [tokenColors]);

  // Handle contenteditable input - simple approach without real-time highlighting
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

  // Handle focus/blur for placeholder and highlighting
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (editorRef.current && !value) {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      if (text) {
        // Apply syntax highlighting when user finishes editing
        const colorized = colorizeText(text);
        editorRef.current.innerHTML = colorized;
      } else if (placeholder) {
        editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
      }
    }
  }, [colorizeText, placeholder, tokenColors.comment]);

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