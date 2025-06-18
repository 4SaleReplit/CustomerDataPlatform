import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Copy, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ConsoleLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string | null;
  migrationData?: {
    stage: string;
    currentJob: string;
    progress: number;
    status: string;
    logs?: string[];
    error?: string;
  } | null;
}

export function ConsoleLogModal({ 
  isOpen, 
  onClose, 
  sessionId, 
  migrationData: initialMigrationData 
}: ConsoleLogModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [migrationData, setMigrationData] = useState(initialMigrationData);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time polling for migration progress and logs
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    const pollMigrationData = async () => {
      try {
        // Fetch migration progress
        const progressResponse = await apiRequest(`/api/migration-progress/${sessionId}`);
        setMigrationData(progressResponse);

        // Fetch migration logs
        const logsResponse = await apiRequest(`/api/migration-logs/${sessionId}`);
        if (logsResponse.logs) {
          setLogs(logsResponse.logs);
        }

        // Stop polling if migration is completed or failed
        if (progressResponse.status === 'completed' || progressResponse.status === 'error') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error polling migration data:', error);
      }
    };

    // Initial fetch
    pollMigrationData();

    // Set up polling interval (every 2 seconds)
    pollingRef.current = setInterval(pollMigrationData, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, isOpen]);

  // Update logs when migration data changes
  useEffect(() => {
    if (migrationData?.logs) {
      setLogs(migrationData.logs);
    }
  }, [migrationData?.logs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  const handleCopyLogs = async () => {
    try {
      const logText = logs.join('\n');
      await navigator.clipboard.writeText(logText);
      toast({
        title: "Logs copied",
        description: "Console logs have been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy logs to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-${sessionId || 'unknown'}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Migration logs are being downloaded",
    });
  };

  const getStatusIcon = () => {
    if (!migrationData) return <Terminal className="h-5 w-5 text-gray-500" />;
    
    switch (migrationData.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Terminal className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!migrationData) return <Badge variant="outline">Unknown</Badge>;
    
    switch (migrationData.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatLogEntry = (log: string) => {
    // Check if log contains timestamp
    const timestampMatch = log.match(/^\[(.+?)\]/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const message = log.replace(/^\[.+?\]\s*/, '');
      
      // Color code different types of messages
      let messageClass = 'text-gray-800';
      if (message.includes('✓')) {
        messageClass = 'text-green-700';
      } else if (message.includes('❌')) {
        messageClass = 'text-red-700';
      } else if (message.includes('⚠')) {
        messageClass = 'text-yellow-700';
      } else if (message.toLowerCase().includes('error')) {
        messageClass = 'text-red-700';
      } else if (message.toLowerCase().includes('completed') || message.toLowerCase().includes('success')) {
        messageClass = 'text-green-700';
      }
      
      return (
        <div className="flex text-sm font-mono">
          <span className="text-gray-500 mr-2 shrink-0">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          <span className={messageClass}>{message}</span>
        </div>
      );
    }
    
    return (
      <div className="text-sm font-mono text-gray-800">
        {log}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Migration Console</span>
              {getStatusBadge()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLogs}
                disabled={logs.length === 0}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Real-time console output for migration session: {sessionId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Migration Status Summary */}
          {migrationData && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Stage:</span>
                  <span className="ml-2 font-medium">{migrationData.stage}</span>
                </div>
                <div>
                  <span className="text-gray-600">Progress:</span>
                  <span className="ml-2 font-medium">{migrationData.progress}%</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600 text-sm">Current Job:</span>
                <span className="ml-2 text-sm">{migrationData.currentJob}</span>
              </div>
            </div>
          )}

          {/* Console Logs */}
          <div className="border rounded-lg bg-gray-900 text-white">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4" />
                <span className="text-sm font-medium">Console Output</span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {logs.length} lines
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={isAutoScroll}
                    onChange={(e) => setIsAutoScroll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-300">Auto-scroll</span>
                </label>
              </div>
            </div>
            
            <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
              {logs.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">
                  No console output yet...
                  {migrationData?.status === 'running' && (
                    <div className="mt-2">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-white">
                      {formatLogEntry(log)}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Error Details */}
          {migrationData?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
              <p className="text-sm text-red-700 font-mono">{migrationData.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {migrationData?.status === 'running' && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migration in Progress...
              </Button>
            )}
            {(migrationData?.status === 'completed' || migrationData?.status === 'error') && (
              <Button onClick={onClose}>
                Close Console
              </Button>
            )}
            {!migrationData?.status && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}