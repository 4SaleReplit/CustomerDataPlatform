import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle, X } from 'lucide-react';

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

interface SimpleMigrationModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function SimpleMigrationModal({ isOpen, sessionId, onClose, onComplete, onError }: SimpleMigrationModalProps) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Polling function to get migration progress
  useEffect(() => {
    if (!isOpen || !sessionId || sessionId === 'initializing') return;

    setIsPolling(true);
    
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/migration-progress/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          
          if (data.status === 'completed') {
            setIsPolling(false);
            onComplete?.();
          } else if (data.status === 'error') {
            setIsPolling(false);
            onError?.(data.error || 'Migration failed');
          }
        }
      } catch (error) {
        console.log('Polling error (will retry):', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollProgress, 2000);
    
    // Initial poll
    pollProgress();

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isOpen, sessionId, onComplete, onError]);

  const getStatusIcon = () => {
    if (!progress) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
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

  const formatDuration = () => {
    if (!progress) return '0:00';
    
    const start = new Date(progress.startTime);
    const now = new Date();
    const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {getStatusIcon()}
            Migration Progress
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={progress?.status === 'running'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {sessionId === 'initializing' ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-sm text-gray-600">Initializing migration...</p>
            </div>
          ) : progress ? (
            <>
              {/* Status and Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon()}
                      {progress.type.charAt(0).toUpperCase() + progress.type.slice(1)} Migration
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        progress.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        progress.status === 'completed' ? 'bg-green-100 text-green-800' :
                        progress.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {isPolling ? 'Live' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-500">{Math.round(progress.progress)}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Current Stage:</span>
                      <p className="text-gray-600">{progress.stage}</p>
                    </div>
                    <div>
                      <span className="font-medium">Current Job:</span>
                      <p className="text-gray-600">{progress.currentJob}</p>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p className="text-gray-600">{formatDuration()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Session ID:</span>
                      <p className="text-gray-600 font-mono text-xs">{progress.sessionId.substring(0, 12)}...</p>
                    </div>
                  </div>

                  {progress.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{progress.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Migration Metadata */}
              {progress.migrationMetadata && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Migration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Source Database:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.sourceDatabase}</p>
                      </div>
                      <div>
                        <span className="font-medium">Target Database:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.targetDatabase}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total Tables:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.totalTables}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total Columns:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.totalColumns}</p>
                      </div>
                      <div>
                        <span className="font-medium">Rows Migrated:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.totalRowsMigrated}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tables Completed:</span>
                        <p className="text-gray-600">{progress.migrationMetadata.tablesCompleted?.length || 0}</p>
                      </div>
                    </div>

                    {progress.migrationMetadata.duration && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm font-medium">
                          Migration completed in {Math.round(progress.migrationMetadata.duration / 1000)}s
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-sm text-gray-600">Loading migration status...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={progress?.status === 'running'}
          >
            {progress?.status === 'running' ? 'Migration In Progress...' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}