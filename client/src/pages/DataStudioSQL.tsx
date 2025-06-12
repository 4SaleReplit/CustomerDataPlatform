import React from 'react';
import { SQLEditor } from '@/components/dashboard/SQLEditor';

export function DataStudioSQL() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold tracking-tight">SQL Editor</h1>
        <p className="text-muted-foreground">
          Advanced SQL editor with syntax highlighting and autocomplete
        </p>
      </div>
      
      <div className="flex-1 p-4">
        <SQLEditor />
      </div>
    </div>
  );
}