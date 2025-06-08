import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Cohorts from "./pages/Cohorts";
import CohortBuilder from "./pages/CohortBuilder";
import CohortDetail from "./pages/CohortDetail";
import Segments from "./pages/Segments";
import SegmentDetail from "./pages/SegmentDetail";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import Promotions from "./pages/Promotions";
import Calendar from "./pages/Calendar";
import ActivityLog from "./pages/ActivityLog";
import Admin from "./pages/Admin";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import Integrations from "./pages/Integrations";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Switch>
          {/* Auth Routes */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          
          {/* Main App Routes */}
          <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
          <Route path="/users" component={() => <Layout><Users /></Layout>} />
          <Route path="/users/:userId" component={() => <Layout><UserProfile /></Layout>} />
          <Route path="/cohorts" component={() => <Layout><Cohorts /></Layout>} />
          <Route path="/cohorts/new" component={() => <Layout><CohortBuilder /></Layout>} />
          <Route path="/cohorts/:cohortId" component={() => <Layout><CohortDetail /></Layout>} />
          <Route path="/cohorts/:cohortId/edit" component={() => <Layout><CohortDetail /></Layout>} />
          <Route path="/segments" component={() => <Layout><Segments /></Layout>} />
          <Route path="/segments/:segmentId" component={() => <Layout><SegmentDetail /></Layout>} />
          <Route path="/segments/:segmentId/edit" component={() => <Layout><SegmentDetail /></Layout>} />
          <Route path="/campaigns" component={() => <Layout><Campaigns /></Layout>} />
          <Route path="/campaigns/new" component={() => <Layout><CampaignBuilder /></Layout>} />
          <Route path="/campaigns/:campaignId/edit" component={() => <Layout><CampaignBuilder /></Layout>} />
          <Route path="/campaigns/:campaignId/analytics" component={() => <Layout><Campaigns /></Layout>} />
          <Route path="/promotions" component={() => <Layout><Promotions /></Layout>} />
          <Route path="/calendar" component={() => <Layout><Calendar /></Layout>} />
          <Route path="/activity-log" component={() => <Layout><ActivityLog /></Layout>} />
          <Route path="/integrations" component={() => <Layout><Integrations /></Layout>} />
          <Route path="/admin" component={() => <Layout><Admin /></Layout>} />
          
          {/* Catch-all route */}
          <Route component={NotFound} />
        </Switch>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
