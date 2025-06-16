import React, { useState, useEffect, useRef } from 'react';

interface BasicMigrationPopupProps {
  isVisible: boolean;
  sessionId: string;
  onClose: () => void;
}

export function BasicMigrationPopup({ isVisible, sessionId, onClose }: BasicMigrationPopupProps) {
  const [logs, setLogs] = useState<string[]>(['Migration starting...']);
  const [isComplete, setIsComplete] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !sessionId) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/migration-progress/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logs && Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
          if (data.status === 'completed' || data.status === 'error') {
            setIsComplete(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every second
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, [isVisible, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{
          backgroundColor: '#000',
          color: '#00ff00',
          width: '80%',
          height: '80%',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '2px solid #00ff00',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px',
          borderBottom: '1px solid #00ff00',
          paddingBottom: '10px'
        }}>
          <span>Migration Console Output - Session: {sessionId.substring(0, 8)}</span>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#00ff00',
              border: '1px solid #00ff00',
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            Close
          </button>
        </div>

        {/* Console Output */}
        <div 
          ref={logsRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4'
          }}
        >
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {log}
            </div>
          ))}
          {!isComplete && (
            <div style={{ marginTop: '10px', opacity: 0.7 }}>
              Migration in progress...
            </div>
          )}
          {isComplete && (
            <div style={{ marginTop: '10px', color: '#ffff00' }}>
              Migration completed!
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '10px',
          borderTop: '1px solid #00ff00',
          paddingTop: '10px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          Status: {isComplete ? 'Completed' : 'Running'} | 
          Logs: {logs.length} entries | 
          Auto-refreshing every 1 second
        </div>
      </div>
    </div>
  );
}