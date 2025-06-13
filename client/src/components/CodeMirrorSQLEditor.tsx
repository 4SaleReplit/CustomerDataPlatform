import { useEffect, useRef } from 'react';

interface CodeMirrorSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
}

export function CodeMirrorSQLEditor({ value, onChange, onExecute }: CodeMirrorSQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onExecute) {
        e.preventDefault();
        onExecute();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [onExecute]);

  return (
    <div className="w-full h-full border rounded-md overflow-hidden">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-3 font-mono text-sm resize-none border-0 outline-none focus:ring-0"
        placeholder="-- Enter your SQL query here
-- Press Ctrl+Enter to execute

SELECT 
  column1,
  column2,
  COUNT(*) as count
FROM your_table
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC
LIMIT 100;"
        spellCheck={false}
      />
    </div>
  );
}