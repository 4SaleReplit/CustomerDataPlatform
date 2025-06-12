import React, { useState, useRef, useEffect } from 'react';

interface SimpleSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function SimpleSQLEditor({ value, onChange, placeholder, className, onExecute }: SimpleSQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        .sql-editor-simple {
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          resize: none;
          padding: 12px;
          margin: 0;
          background: transparent;
          color: #1f2937;
          white-space: pre-wrap;
          word-wrap: break-word;
          box-sizing: border-box;
          font-weight: 500;
          letter-spacing: 0.025em;
        }
        
        .sql-editor-simple::placeholder {
          color: #9ca3af;
          font-style: italic;
        }
        
        /* Dark mode support */
        .dark .sql-editor-simple {
          color: #f9fafb;
        }
        
        .dark .sql-editor-simple::placeholder {
          color: #6b7280;
        }
      `}</style>
      
      <textarea
        ref={textareaRef}
        className={`sql-editor-simple ${className || ''}`}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </>
  );
}