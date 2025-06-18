import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreVertical, Clock, Users, Database, Send, Pause, CheckCircle, XCircle, Clock3, Copy, Edit, Trash2, Play } from "lucide-react";

interface EmailListViewProps {
  reports: any[];
  presentations: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  isLoading: boolean;
  emptyMessage: string;
  emptyDescription: string;
  onDuplicate: (report: any) => void;
  onEdit: (report: any) => void;
  onDelete: (id: string) => void;
  onToggleActive: (report: any) => void;
  isOneTime?: boolean;
}

export function EmailListView({
  reports,
  presentations,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  isLoading,
  emptyMessage,
  emptyDescription,
  onDuplicate,
  onEdit,
  onDelete,
  onToggleActive,
  isOneTime = false
}: EmailListViewProps) {
  const getStatusBadge = (report: any) => {
    if (report.sentImmediately) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
    }
    
    if (!report.isActive) {
      return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
    }
    
    if (report.lastError) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    
    if (report.lastExecuted) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
    
    return <Badge variant="outline"><Clock3 className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const formatScheduleDescription = (cronExpression: string | null, timezone: string) => {
    if (!cronExpression) return "One-time email";
    
    const cronDescriptions: Record<string, string> = {
      "0 9 * * 1": "Weekly on Monday at 9:00 AM",
      "0 9 1 * *": "Monthly on 1st at 9:00 AM", 
      "0 9 * * *": "Daily at 9:00 AM",
      "0 */6 * * *": "Every 6 hours"
    };
    
    return cronDescriptions[cronExpression] || `Custom schedule (${timezone})`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/50 p-4 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails by name, description, or report..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {isOneTime ? (
                <>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          {!isOneTime && typeFilter && onTypeFilterChange && (
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading emails...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="border border-dashed border-muted rounded-lg p-12 text-center">
          <Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name & Status</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>{isOneTime ? "Sent At" : "Schedule"}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{report.name}</span>
                        {getStatusBadge(report)}
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {presentations?.find((p: any) => p.id === report.presentationId)?.title || "Unknown Report"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{report.recipientList.length} recipients</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {isOneTime 
                        ? (report.sentAt ? new Date(report.sentAt).toLocaleString() : 'Pending')
                        : formatScheduleDescription(report.cronExpression, report.timezone)
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDuplicate(report)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {!isOneTime && (
                          <DropdownMenuItem onClick={() => onToggleActive(report)}>
                            {report.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(report)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(report.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}