import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SimpleMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string | null;
  migrationData?: {
    stage: string;
    currentJob: string;
    progress: number;
    status: string;
    totalItems?: number;
    completedItems?: number;
    error?: string;
  } | null;
}

export function SimpleMigrationModal({ 
  isOpen, 
  onClose, 
  sessionId, 
  migrationData 
}: SimpleMigrationModalProps) {
  if (!migrationData) return null;

  const getStatusIcon = () => {
    switch (migrationData.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (migrationData.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Migration Progress</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Session ID: {sessionId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{migrationData.progress}%</span>
            </div>
            <Progress value={migrationData.progress} className="w-full" />
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Stage</h4>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Stage:</strong> {migrationData.stage}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Current Job:</strong> {migrationData.currentJob}
            </p>
          </div>

          {/* Progress Details */}
          {migrationData.totalItems && migrationData.totalItems > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Migration Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Items:</span>
                  <span className="ml-2 font-medium">{migrationData.totalItems}</span>
                </div>
                <div>
                  <span className="text-blue-700">Completed:</span>
                  <span className="ml-2 font-medium">{migrationData.completedItems || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {migrationData.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
              <p className="text-sm text-red-700">{migrationData.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {migrationData.status === 'running' && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migration in Progress...
              </Button>
            )}
            {(migrationData.status === 'completed' || migrationData.status === 'error') && (
              <Button onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}