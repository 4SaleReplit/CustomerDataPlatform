import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Ban, User, Coins, List, CreditCard, Calendar } from "lucide-react";
import type { CdpUser } from "@shared/schema";

export default function UserProfile() {
  const [match, params] = useRoute("/users/:id");
  const userId = params?.id ? parseInt(params.id) : null;

  const { data: user, isLoading, error } = useQuery<CdpUser>({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const res = await fetch(`/api/users/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  if (!match || !userId) {
    return <div>User not found</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-24" />
              <div className="flex space-x-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center text-red-600">
        Failed to load user profile. Please try again.
      </div>
    );
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const getUserStatus = () => {
    if (user.is_block === 1) return { label: "Blocked", color: "bg-red-100 text-red-800" };
    if (user.days_since_last_transaction === null || user.days_since_last_transaction <= 7) {
      return { label: "Active", color: "bg-green-100 text-green-800" };
    }
    if (user.days_since_last_transaction <= 30) {
      return { label: "At Risk", color: "bg-yellow-100 text-yellow-800" };
    }
    return { label: "Churned", color: "bg-red-100 text-red-800" };
  };

  const status = getUserStatus();

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/users">
              <a className="flex items-center text-slate-600 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </a>
            </Link>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </Button>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center">
              <User className="h-8 w-8 text-slate-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">User ID: {user.user_id}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Phone Number</p>
                  <p className="text-sm font-medium text-slate-800">{user.phone ? `+${user.phone}` : "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">User Type</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {user.user_type || "Basic"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Account Created</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(user.user_account_creation_date)}</p>
                </div>
              </div>
              <div className="mt-4">
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Current Credits</h3>
              <Coins className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {user.current_credits_in_wallet?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Total Listings</h3>
              <List className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {user.total_listings_count || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Credits Spent</h3>
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {user.total_credits_spent?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Active Months</h3>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {user.active_months_last_6 || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Card>
        <Tabs defaultValue="activity" className="w-full">
          <div className="border-b border-slate-200">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="activity" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="listings" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent"
              >
                Listings
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="segments" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent"
              >
                Segments
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="activity" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Key Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Favorite Vertical</span>
                      <span className="text-sm font-medium text-slate-800">{user.favorite_vertical || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Days Since Last Activity</span>
                      <span className="text-sm font-medium text-slate-800">{user.days_since_last_transaction || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Multi-vertical User</span>
                      <span className="text-sm font-medium text-slate-800">{user.is_multivertical_user ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Paid Listings</span>
                      <span className="text-sm font-medium text-slate-800">{user.paid_listings_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Free Listings</span>
                      <span className="text-sm font-medium text-slate-800">{user.free_listings_count || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Activity Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Account Created</p>
                        <p className="text-xs text-slate-500">{formatDate(user.user_account_creation_date)}</p>
                      </div>
                    </div>
                    {user.first_paid_listing_date && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">First Paid Listing</p>
                          <p className="text-xs text-slate-500">{formatDate(user.first_paid_listing_date)}</p>
                        </div>
                      </div>
                    )}
                    {user.last_transaction_date && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Last Transaction</p>
                          <p className="text-xs text-slate-500">{formatDate(user.last_transaction_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="listings" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Basic Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{user.basic_listings_count || 0}</div>
                    <div className="text-sm text-slate-500">Credits: {user.basic_credits_spent || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Pro Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{user.pro_listings_count || 0}</div>
                    <div className="text-sm text-slate-500">Credits: {user.pro_credits_spent || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Premium Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{user.premium_listings_count || 0}</div>
                    <div className="text-sm text-slate-500">Credits: {user.premium_credits_spent || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Credit Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total Credits Spent</span>
                        <span className="text-sm font-medium text-slate-800">{user.total_credits_spent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Premium Credits</span>
                        <span className="text-sm font-medium text-slate-800">{user.total_premium_credits_spent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Free Credits</span>
                        <span className="text-sm font-medium text-slate-800">{user.total_free_credits_spent?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Add-ons Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Extra Add-ons Count</span>
                        <span className="text-sm font-medium text-slate-800">{user.extra_addons_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Add-ons Credits</span>
                        <span className="text-sm font-medium text-slate-800">{user.extra_addons_total_credits?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Favorite Add-on</span>
                        <span className="text-sm font-medium text-slate-800">{user.favorite_extra_addon || "None"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">User Segmentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">Activity Level</h4>
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">Value Tier</h4>
                    <Badge className={
                      (user.total_credits_spent || 0) > 10000 
                        ? "bg-gold-100 text-gold-800" 
                        : (user.total_credits_spent || 0) > 1000
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }>
                      {(user.total_credits_spent || 0) > 10000 
                        ? "High Value" 
                        : (user.total_credits_spent || 0) > 1000
                        ? "Medium Value"
                        : "Low Value"}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
