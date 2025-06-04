import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function Header({ 
  title = "Dashboard", 
  subtitle = "Overview of key metrics and insights",
  showRefresh = true,
  onRefresh 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2 bg-slate-50 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select defaultValue="7days">
              <SelectTrigger className="bg-transparent text-sm font-medium text-slate-700 border-none focus:outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh Button */}
          {showRefresh && (
            <Button onClick={onRefresh} className="bg-blue-500 hover:bg-blue-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
