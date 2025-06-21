import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, Mail, MoreVertical, Copy, Edit, Trash2, Play, Pause, CheckCircle, XCircle, Clock3, Download } from "lucide-react";

interface SentEmail {
  id: string;
  templateId: string | null;
  presentationId: string | null;
  scheduledReportId: string | null;
  subject: string;
  recipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
  emailType: 'one_time' | 'scheduled';
  status: 'sent' | 'failed' | 'pending';
  pdfDownloadUrl: string | null;
  emailHtml: string | null;
  emailText: string | null;
  messageId: string | null;
  errorMessage: string | null;
  deliveredAt: string | null;
  sentBy: string | null;
  createdAt: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  presentationId: string;
  cronExpression: string | null;
  timezone: string;
  emailSubject: string;
  emailBody: string;
  recipientList: string[];
  ccList: string[];
  bccList: string[];
  isActive: boolean;
  lastExecuted: string | null;
  nextExecution: string | null;
  executionCount: number;
  successCount: number;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  sentImmediately?: boolean;
  sentAt?: string;
  emailTemplate?: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  };
  pdfDeliveryUrl?: string;
  placeholderConfig?: Record<string, any>;
  formatSettings?: { format: string; includeCharts: boolean };
}

interface SimpleEmailListViewProps {
  reports: ScheduledReport[];
  mode: 'one-time' | 'scheduled';
  onEdit: (report: ScheduledReport) => void;
  onDuplicate: (report: ScheduledReport) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  presentations?: any[];
}

export function SimpleEmailListView({
  reports,
  mode,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  presentations = []
}: SimpleEmailListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch sent emails for one-time mode
  const { data: sentEmails = [], isLoading } = useQuery({
    queryKey: ['/api/sent-emails'],
    enabled: mode === 'one-time'
  });

  // Use sent emails for one-time mode, reports for scheduled mode
  const dataToDisplay = mode === 'one-time' ? (sentEmails || []) : (reports || []);
  
  const filteredReports = dataToDisplay.filter(item => {
    if (mode === 'one-time') {
      // Filter sent emails
      const sentEmail = item as SentEmail;
      const matchesSearch = searchTerm === "" || 
        sentEmail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sentEmail.recipients.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "sent" && sentEmail.status === 'sent') ||
        (statusFilter === "failed" && sentEmail.status === 'failed');
      
      return matchesSearch && matchesStatus;
    } else {
      // Filter scheduled reports
      const report = item as ScheduledReport;
      const matchesSearch = searchTerm === "" || 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && report.isActive) ||
        (statusFilter === "paused" && !report.isActive) ||
        (statusFilter === "sent" && report.sentImmediately) ||
        (statusFilter === "error" && report.lastError);
      
      return matchesSearch && matchesStatus;
    }
  });

  const getStatusBadge = (item: ScheduledReport | SentEmail) => {
    if (mode === 'one-time') {
      const sentEmail = item as SentEmail;
      if (sentEmail.status === 'failed') {
        return <Badge variant="destructive">Failed</Badge>;
      }
      if (sentEmail.status === 'sent') {
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      }
      return <Badge variant="secondary">Pending</Badge>;
    } else {
      const report = item as ScheduledReport;
      if (report.isActive) {
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      }
      return <Badge variant="secondary">Paused</Badge>;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {mode === 'one-time' ? (
              <>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="error">Failed</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {mode === 'one-time' ? 'one-time emails' : 'scheduled emails'} found</p>
              <p className="text-sm">Create your first email to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{(report.recipientList || []).length} recipient(s)</span>
                      {report.cronExpression && (
                        <>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{report.timezone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(report)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(report)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(report)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {mode === 'scheduled' && (
                          <DropdownMenuItem onClick={() => onToggleActive(report.id, report.isActive)}>
                            {report.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Email</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{report.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(report.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p className="text-muted-foreground">{report.emailSubject}</p>
                  </div>
                  <div>
                    <span className="font-medium">
                      {mode === 'one-time' ? 'Sent At:' : 'Last Executed:'}
                    </span>
                    <p className="text-muted-foreground">
                      {mode === 'one-time' 
                        ? formatDateTime(report.sentAt || null)
                        : formatDateTime(report.lastExecuted)
                      }
                    </p>
                  </div>
                  {mode === 'scheduled' && (
                    <div>
                      <span className="font-medium">Next Execution:</span>
                      <p className="text-muted-foreground">{formatDateTime(report.nextExecution)}</p>
                    </div>
                  )}
                </div>
                
                {report.lastError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Last Error:</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">{report.lastError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}