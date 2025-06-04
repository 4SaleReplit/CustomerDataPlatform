import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Plus, Play, Pause, Edit, Trash, BarChart3, PlayCircle, Ticket, Percent, Coins } from "lucide-react";
import type { Promotion, Cohort } from "@shared/schema";

export default function Promotions() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: "",
    description: "",
    type: "credits",
    cohort_id: "",
    value: "",
    max_redemptions: "",
    starts_at: "",
    expires_at: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
  });

  const { data: cohorts } = useQuery<Cohort[]>({
    queryKey: ["/api/cohorts"],
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promotions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      setIsCreateDialogOpen(false);
      setNewPromotion({
        name: "",
        description: "",
        type: "credits",
        cohort_id: "",
        value: "",
        max_redemptions: "",
        starts_at: "",
        expires_at: "",
      });
      toast({
        title: "Campaign created",
        description: "The promotional campaign has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/promotions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Campaign updated",
        description: "The promotional campaign has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/promotions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Campaign deleted",
        description: "The promotional campaign has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePromotion = () => {
    if (!newPromotion.name.trim()) {
      toast({
        title: "Validation error",
        description: "Campaign name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!newPromotion.value || isNaN(Number(newPromotion.value))) {
      toast({
        title: "Validation error",
        description: "Valid value is required.",
        variant: "destructive",
      });
      return;
    }

    createPromotionMutation.mutate({
      name: newPromotion.name,
      description: newPromotion.description,
      type: newPromotion.type,
      cohort_id: newPromotion.cohort_id ? parseInt(newPromotion.cohort_id) : null,
      value: parseFloat(newPromotion.value),
      max_redemptions: newPromotion.max_redemptions ? parseInt(newPromotion.max_redemptions) : null,
      starts_at: newPromotion.starts_at || null,
      expires_at: newPromotion.expires_at || null,
    });
  };

  const togglePromotionStatus = (promotion: Promotion) => {
    updatePromotionMutation.mutate({
      id: promotion.id,
      data: { is_active: !promotion.is_active }
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No expiry";
    return new Date(date).toLocaleDateString();
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.expiry_date ? new Date(promotion.expiry_date) : null;
    
    if (startDate && startDate > now) return { label: "Scheduled", color: "bg-yellow-100 text-yellow-800" };
    if (endDate && endDate < now) return { label: "Expired", color: "bg-red-100 text-red-800" };
    return { label: "Active", color: "bg-green-100 text-green-800" };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "credits": return <Coins className="h-4 w-4" />;
      case "discount": return <Percent className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "credits": return "bg-blue-100 text-blue-800";
      case "discount": return "bg-purple-100 text-purple-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  const filteredPromotions = promotions?.filter(promotion => {
    const matchesSearch = (promotion.promo_code || '').toLowerCase().includes(search.toLowerCase()) ||
                         (promotion.promo_type || '').toLowerCase().includes(search.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    
    const status = getPromotionStatus(promotion);
    return matchesSearch && status.label.toLowerCase() === filter;
  });

  const stats = {
    active: promotions?.filter(p => getPromotionStatus(p).label === "Active").length || 0,
    totalRedemptions: promotions?.reduce((sum, p) => sum + (p.current_redemptions || 0), 0) || 0,
    conversionRate: "15.7%", // This would be calculated from actual data
    creditsDistributed: "124.5K", // This would be calculated from actual data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Promotions</h2>
          <p className="text-sm text-slate-500">Create and manage promotional campaigns for user cohorts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a promotional campaign targeting specific user cohorts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newPromotion.type} onValueChange={(value) => setNewPromotion(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credits">Credits</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="free_addon">Free Addon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPromotion.description}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the campaign"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cohort">Target Cohort</Label>
                  <Select value={newPromotion.cohort_id} onValueChange={(value) => setNewPromotion(prev => ({ ...prev, cohort_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      {cohorts?.map(cohort => (
                        <SelectItem key={cohort.cohort_id} value={cohort.cohort_id}>
                          {cohort.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newPromotion.value}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={newPromotion.type === "discount" ? "Percentage" : "Amount"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_redemptions">Max Redemptions</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    value={newPromotion.max_redemptions}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, max_redemptions: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires At</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newPromotion.expires_at}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePromotion} disabled={createPromotionMutation.isPending}>
                  {createPromotionMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Active Campaigns</h3>
              <PlayCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Total Redemptions</h3>
              <Ticket className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalRedemptions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Conversion Rate</h3>
              <Percent className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.conversionRate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Credits Distributed</h3>
              <Coins className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.creditsDistributed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {promotionsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-96 mb-3" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, j) => (
                          <Skeleton key={j} className="h-4 w-24" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-6">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredPromotions?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No campaigns found. Create your first campaign to get started.
              </div>
            ) : (
              filteredPromotions?.map((promotion) => {
                const status = getPromotionStatus(promotion);
                const cohort = cohorts?.find(c => c.cohort_id === promotion.cohort_id);
                
                return (
                  <div key={promotion.promo_id} className="p-6 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{promotion.promo_code || 'Untitled Promotion'}</h3>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                          <Badge className={getTypeBadge(promotion.promo_type || 'credits')}>
                            <span className="flex items-center">
                              {getTypeIcon(promotion.promo_type || 'credits')}
                              <span className="ml-1 capitalize">{promotion.promo_type || 'credits'}</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">Promotion campaign</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Cohort:</span>
                            <span className="text-slate-800 font-medium ml-1">{cohort?.name || "All Users"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Redemptions:</span>
                            <span className="text-slate-800 font-medium ml-1">
                              {promotion.current_redemptions || 0}
                              {promotion.max_redemptions ? ` / ${promotion.max_redemptions}` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Expires:</span>
                            <span className="text-slate-800 font-medium ml-1">{formatDate(promotion.expires_at?.toString() || null)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Value:</span>
                            <span className="text-slate-800 font-medium ml-1">
                              {promotion.type === "discount" ? `${promotion.value}%` : promotion.value}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-6">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePromotionStatus(promotion)}
                          disabled={updatePromotionMutation.isPending}
                          className={promotion.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                        >
                          {promotion.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePromotionMutation.mutate(promotion.id)}
                          disabled={deletePromotionMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
