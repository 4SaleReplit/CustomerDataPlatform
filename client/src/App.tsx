import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Layout } from "./components/layout/Layout";
import { UserProvider } from "./contexts/UserContext";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Cohorts from "./pages/Cohorts";
import CohortBuilder from "./pages/CohortBuilder";
import CohortDetail from "./pages/CohortDetail";
import CohortEdit from "./pages/CohortEdit";
import Segments from "./pages/Segments";
import SegmentDetail from "./pages/SegmentDetail";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignDetail from "./pages/CampaignDetail";
import CampaignEdit from "./pages/CampaignEdit";
import Promotions from "./pages/Promotions";
import Calendar from "./pages/Calendar";
import ActivityLog from "./pages/ActivityLog";
import Admin from "./pages/Admin";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import Integrations from "./pages/Integrations";

const AppRouter = () => {
  const [location] = useLocation();
  const isAuthRoute = location === '/login' || location === '/register';

  if (isAuthRoute) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        {/* Main App Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/users" component={Users} />
        <Route path="/users/:userId" component={UserProfile} />
        <Route path="/cohorts" component={Cohorts} />
        <Route path="/cohorts/new" component={CohortBuilder} />
        <Route path="/cohorts/:id" component={CohortDetail} />
        <Route path="/cohorts/:id/edit" component={CohortEdit} />
        <Route path="/segments" component={Segments} />
        <Route path="/segments/:segmentId" component={SegmentDetail} />
        <Route path="/segments/:segmentId/edit" component={SegmentDetail} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/campaigns/new" component={CampaignBuilder} />
        <Route path="/campaigns/:campaignId/edit" component={CampaignBuilder} />
        <Route path="/campaigns/:campaignId/analytics" component={Campaigns} />
        <Route path="/promotions" component={Promotions} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/activity-log" component={ActivityLog} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/admin" component={Admin} />
        
        {/* Catch-all route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
