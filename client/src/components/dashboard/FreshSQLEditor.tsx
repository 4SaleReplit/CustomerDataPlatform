import React, { useState, useRef, useEffect } from 'react';

interface FreshSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function FreshSQLEditor({ value, onChange, placeholder, className, onExecute }: FreshSQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

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
    setCursorPosition(e.target.selectionStart);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
  };

  return (
    <div className={`relative ${className || ''}`}>
      <style>{`
        .fresh-sql-editor {
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
          resize: none;
          box-sizing: border-box;
          
          /* Solarized Dark Theme */
          background-color: #002B36;
          color: #839496;
          caret-color: #839496;
        }
        
        .fresh-sql-editor::placeholder {
          color: #586E75;
          font-style: italic;
        }
        
        .fresh-sql-editor::selection {
          background-color: #073642;
        }
        
        /* Apply syntax highlighting through CSS classes */
        .fresh-sql-editor.sql-highlighted {
          background: linear-gradient(transparent, transparent);
        }
        
        /* Keywords styling */
        .fresh-sql-editor[data-contains-keywords="true"] {
          /* This approach won't work either - we need a different solution */
        }
      `}</style>
      
      <textarea
        ref={textareaRef}
        className="fresh-sql-editor"
        value={value}
        onChange={handleInput}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}