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
import { Search, Plus, FolderSync, Edit, Trash, Users, Clock, AlertTriangle } from "lucide-react";
import type { Cohort } from "@shared/schema";
import type { CohortCondition } from "@/types";

export default function Cohorts() {
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCohort, setNewCohort] = useState({
    name: "",
    description: "",
    conditions: [] as CohortCondition[],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cohorts, isLoading, error } = useQuery<Cohort[]>({
    queryKey: ["/api/cohorts"],
  });

  const createCohortMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cohorts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      setIsCreateDialogOpen(false);
      setNewCohort({ name: "", description: "", conditions: [] });
      toast({
        title: "Cohort created",
        description: "The cohort has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncCohortMutation = useMutation({
    mutationFn: async ({ id, target }: { id: number; target: string }) => {
      const res = await apiRequest("POST", `/api/cohorts/${id}/sync`, { target });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      toast({
        title: "Cohort synced",
        description: "The cohort has been synced successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to sync cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCohortMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/cohorts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      toast({
        title: "Cohort deleted",
        description: "The cohort has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCondition = () => {
    setNewCohort(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: "", operator: "", value: "", connector: "AND" }]
    }));
  };

  const updateCondition = (index: number, field: keyof CohortCondition, value: string) => {
    setNewCohort(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setNewCohort(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleCreateCohort = () => {
    if (!newCohort.name.trim()) {
      toast({
        title: "Validation error",
        description: "Cohort name is required.",
        variant: "destructive",
      });
      return;
    }

    createCohortMutation.mutate({
      name: newCohort.name,
      description: newCohort.description,
      conditions: JSON.stringify(newCohort.conditions),
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const filteredCohorts = cohorts?.filter(cohort =>
    cohort.name.toLowerCase().includes(search.toLowerCase()) ||
    cohort.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center text-red-600">
        Failed to load cohorts. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Cohorts</h2>
          <p className="text-sm text-slate-500">Create and manage user segments for targeted campaigns</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Cohort
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Cohort</DialogTitle>
              <DialogDescription>
                Define conditions to segment users based on their profile attributes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Cohort Name</Label>
                <Input
                  id="name"
                  value={newCohort.name}
                  onChange={(e) => setNewCohort(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter cohort name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCohort.description}
                  onChange={(e) => setNewCohort(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the cohort criteria"
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <Label>Conditions</Label>
                {newCohort.conditions.map((condition, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg">
                      <Select value={condition.field} onValueChange={(value) => updateCondition(index, "field", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total_credits_spent">Total Credits Spent</SelectItem>
                          <SelectItem value="days_since_last_transaction">Days Since Last Transaction</SelectItem>
                          <SelectItem value="user_type">User Type</SelectItem>
                          <SelectItem value="is_multivertical_user">Multi-vertical User</SelectItem>
                          <SelectItem value="total_listings_count">Total Listings</SelectItem>
                          <SelectItem value="current_credits_in_wallet">Current Credits</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={condition.operator} onValueChange={(value) => updateCondition(index, "operator", value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="Op" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=">">&gt;</SelectItem>
                          <SelectItem value="<">&lt;</SelectItem>
                          <SelectItem value="=">=</SelectItem>
                          <SelectItem value=">=">&gt;=</SelectItem>
                          <SelectItem value="<=">&lt;=</SelectItem>
                          <SelectItem value="!=">!=</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={condition.value}
                        onChange={(e) => updateCondition(index, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    {index < newCohort.conditions.length - 1 && (
                      <div className="text-center">
                        <Select 
                          value={condition.connector} 
                          onValueChange={(value: "AND" | "OR") => updateCondition(index, "connector", value)}
                        >
                          <SelectTrigger className="w-20 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addCondition}
                  className="w-full border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCohort} disabled={createCohortMutation.isPending}>
                  {createCohortMutation.isPending ? "Creating..." : "Create Cohort"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cohorts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search cohorts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-96 mb-2" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredCohorts?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No cohorts found. Create your first cohort to get started.
              </div>
            ) : (
              filteredCohorts?.map((cohort) => (
                <div key={cohort.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{cohort.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {cohort.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className={cohort.last_synced ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                          {cohort.last_synced ? "Synced" : "Not Synced"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{cohort.description || "No description"}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>
                          <Users className="h-3 w-3 mr-1 inline" />
                          {cohort.user_count || 0} users
                        </span>
                        <span>
                          <Clock className="h-3 w-3 mr-1 inline" />
                          Updated {formatDate(cohort.updated_at?.toString() || null)}
                        </span>
                        <span>
                          {cohort.last_synced ? (
                            <>
                              <FolderSync className="h-3 w-3 mr-1 inline" />
                              Last synced: {formatDate(cohort.last_synced.toString())}
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1 inline text-yellow-500" />
                              FolderSync pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncCohortMutation.mutate({ id: cohort.id, target: "amplitude" })}
                        disabled={syncCohortMutation.isPending}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FolderSync className="h-4 w-4 mr-1" />
                        FolderSync
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCohortMutation.mutate(cohort.id)}
                        disabled={deleteCohortMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
