import React, { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';

interface MigrationProgress {
  sessionId: string;
  type: string;
  stage: string;
  currentJob: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  startTime: string;
  error?: string;
  migrationMetadata?: {
    sourceDatabase: string;
    targetDatabase: string;
    totalTables: number;
    totalSchemas: number;
    totalColumns: number;
    totalRowsMigrated: number;
    tablesCompleted: string[];
    startTime: string;
    endTime?: string;
    duration?: number;
  };
}

interface MigrationProgressProps {
  sessionId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function MigrationProgress({ sessionId, onComplete, onError }: MigrationProgressProps) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for migration progress');
        setIsConnected(true);
        
        // Subscribe to this migration session
        ws.send(JSON.stringify({
          type: 'subscribe',
          sessionId: sessionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress' && data.data) {
            setProgress(data.data);
            
            // Handle completion or error
            if (data.data.status === 'completed') {
              onComplete?.();
            } else if (data.data.status === 'error') {
              onError?.(data.data.error || 'Migration failed');
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    }

    // Also poll for progress via REST API as fallback
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/migration-progress/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          
          if (data.status === 'completed') {
            onComplete?.();
          } else if (data.status === 'error') {
            onError?.(data.error || 'Migration failed');
          }
        }
      } catch (error) {
        console.error('Error polling migration progress:', error);
      }
    };

    // Poll every 2 seconds as fallback
    const pollInterval = setInterval(pollProgress, 2000);

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(pollInterval);
    };
  }, [sessionId, onComplete, onError]);

  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing migration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[progress.status] || 'bg-gray-100 text-gray-800'}>
        {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = () => {
    const start = new Date(progress.startTime);
    const now = new Date();
    const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {progress.type.charAt(0).toUpperCase() + progress.type.slice(1)} Migration
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Badge variant="outline">
              {isConnected ? 'Live' : 'Polling'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className="w-full" />
        </div>

        {/* Current Stage and Job */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Stage:</span>
            <span className="text-sm text-gray-600">{progress.stage}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Job:</span>
            <span className="text-sm text-gray-600">{progress.currentJob}</span>
          </div>
        </div>

        {/* Items Progress */}
        {progress.totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items Processed</span>
              <span>{progress.completedItems} / {progress.totalItems}</span>
            </div>
            <Progress 
              value={(progress.completedItems / progress.totalItems) * 100} 
              className="w-full h-2" 
            />
          </div>
        )}

        {/* Duration */}
        <div className="flex justify-between items-center text-sm">
          <span>Duration:</span>
          <span>{formatDuration()}</span>
        </div>

        {/* Migration Completion Summary */}
        {progress.status === 'completed' && progress.migrationMetadata && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-green-800">Migration Completed Successfully!</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-green-800">Source & Destination</div>
                <div className="text-green-700">
                  <div>From: {progress.migrationMetadata.sourceDatabase}</div>
                  <div>To: {progress.migrationMetadata.targetDatabase}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium text-green-800">Migration Statistics</div>
                <div className="text-green-700">
                  <div>Tables: {progress.migrationMetadata.totalTables}</div>
                  <div>Schemas: {progress.migrationMetadata.totalSchemas}</div>
                  <div>Columns: {progress.migrationMetadata.totalColumns}</div>
                  <div>Rows: {progress.migrationMetadata.totalRowsMigrated.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-green-800">Duration</div>
              <div className="text-green-700">
                {progress.migrationMetadata.duration ? 
                  `${Math.floor(progress.migrationMetadata.duration / 60000)}m ${Math.floor((progress.migrationMetadata.duration % 60000) / 1000)}s` 
                  : 'N/A'}
              </div>
            </div>
            
            {progress.migrationMetadata.tablesCompleted.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-green-800">Tables Migrated</div>
                <div className="text-green-700 text-xs">
                  {progress.migrationMetadata.tablesCompleted.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'error' && progress.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{progress.error}</p>
          </div>
        )}

        {/* Session ID */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Session ID:</span>
            <code className="font-mono">{progress.sessionId}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}