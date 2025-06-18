import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreVertical, Clock, Users, Database, Send, Pause, CheckCircle, XCircle, Clock3, Copy, Edit, Trash2, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered and paginated data
  const filteredAndPaginatedData = useMemo(() => {
    let filtered = reports;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (isOneTime) {
        filtered = filtered.filter(report => {
          if (statusFilter === 'sent') return report.sendingStatus === 'sent' || report.sentImmediately || report.sentAt;
          if (statusFilter === 'failed') return report.sendingStatus === 'failed' || report.lastError;
          if (statusFilter === 'draft') return report.sendingStatus === 'draft' || (!report.sentImmediately && !report.sentAt && !report.lastError);
          return true;
        });
      } else {
        filtered = filtered.filter(report => {
          if (statusFilter === 'active') return report.isActive;
          if (statusFilter === 'paused') return !report.isActive;
          return true;
        });
      }
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [reports, searchTerm, statusFilter, currentPage, isOneTime]);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setCurrentPage(1);
    onSearchChange(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setCurrentPage(1);
    onStatusFilterChange(value);
  };

  const getStatusBadge = (report: any) => {
    if (isOneTime) {
      // One-time email status - use sendingStatus field from database
      if (report.sendingStatus === 'failed' || report.lastError) {
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      }
      if (report.sendingStatus === 'sent' || report.sentImmediately || report.sentAt) {
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      }
      // For one-time emails that haven't been sent yet (draft status)
      return <Badge variant="outline" className="bg-gray-50 text-gray-600"><Clock3 className="h-3 w-3 mr-1" />Draft</Badge>;
    } else {
      // Scheduled email status - cohort style (Active/Paused only)
      if (!report.isActive) {
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      }
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {isOneTime ? (
                <>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="error">Failed</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="error">Failed</SelectItem>
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
      ) : filteredAndPaginatedData.totalItems === 0 ? (
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
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>{isOneTime ? "Sent At" : "Schedule"}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndPaginatedData.items.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-medium">{report.name}</span>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(report)}
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
                        ? (report.sentAt ? new Date(report.sentAt).toLocaleString() : 
                           report.sendingStatus === 'sent' ? 'Recently sent' : 
                           report.sendingStatus === 'failed' ? 'Send failed' :
                           '-')
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
          
          {/* Pagination Controls */}
          {filteredAndPaginatedData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndPaginatedData.totalItems)} of {filteredAndPaginatedData.totalItems} emails
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!filteredAndPaginatedData.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredAndPaginatedData.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!filteredAndPaginatedData.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}