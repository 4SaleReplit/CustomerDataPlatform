import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ConsoleLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function ConsoleLogModal({ isOpen, onClose, sessionId }: ConsoleLogModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const pollLogs = async () => {
      try {
        const response = await fetch(`/api/migration-progress/${sessionId}`);
        const data = await response.json();
        
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        
        if (data.status === 'completed' || data.status === 'error') {
          setIsCompleted(true);
        }
      } catch (error) {
        console.error('Error fetching migration logs:', error);
      }
    };

    // Initial fetch
    pollLogs();

    // Poll every 1 second if not completed
    const interval = setInterval(() => {
      if (!isCompleted) {
        pollLogs();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, sessionId, isCompleted]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-4/5 h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Migration Console Output
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Console Output */}
        <div className="flex-1 p-4 overflow-auto bg-black text-green-400 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for migration to start...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Session ID: {sessionId}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isCompleted ? (
              <span className="text-green-600 dark:text-green-400">Migration Completed</span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400">Migration Running...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}