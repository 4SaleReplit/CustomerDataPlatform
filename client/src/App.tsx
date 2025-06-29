import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Layout } from "./components/layout/Layout";
import { UserProvider, useUser } from "./contexts/UserContext";
import { initializeAmplitude } from "./lib/amplitude";
import Dashboard from "./pages/Dashboard";
import { DataStudio } from "./pages/DataStudio";
import { DataStudioSQL } from "./pages/DataStudioSQL";
import { DataStudioFiles } from "./pages/DataStudioFiles";
import { DataStudioLineage } from "./pages/DataStudioLineage";
import { DataStudioDataExplorer } from "./pages/DataStudioDataExplorer";
import { DataStudioDashboards } from "./pages/DataStudioDashboards";
import { DataStudioExplores } from "./pages/DataStudioExploresClean";
import { DataStudioExploreView } from "./pages/DataStudioExploreView";
import { DataStudioExploreEdit } from "./pages/DataStudioExploreEdit";
import { DataStudioReports } from "./pages/DataStudioReports";
import ReportBuilder from "./pages/ReportBuilder";
import { EmailSender } from "./pages/EmailSender";
import { EmailTemplatesDesigner } from "./pages/EmailTemplatesDesigner";
import { PresentationView } from "./pages/PresentationView";
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
import Admin from "./pages/AdminNew";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import Integrations from "./pages/Integrations";
import RoleManagement from "./pages/RoleManagement";

const AppRouter = () => {
  const [location] = useLocation();
  const { user } = useUser();
  const isAuthRoute = location === '/login' || location === '/register';

  // Show auth routes
  if (isAuthRoute) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Switch>
    );
  }

  // If no user, show login
  if (!user) {
    return <Login />;
  }

  // Show main app
  return (
    <Layout>
      <Switch>
        {/* Main App Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/data-studio" component={DataStudio} />
        <Route path="/data-studio/dashboards" component={DataStudioDashboards} />
        <Route path="/data-studio/explores" component={DataStudioExplores} />
        <Route path="/data-studio/explores/:id" component={DataStudioExploreView} />
        <Route path="/data-studio/explores/:id/edit" component={DataStudioExploreEdit} />
        <Route path="/data-studio/sql" component={DataStudioSQL} />
        <Route path="/data-studio/files" component={DataStudioFiles} />
        <Route path="/data-studio/lineage" component={DataStudioLineage} />
        <Route path="/data-studio/explorer" component={DataStudioDataExplorer} />
        <Route path="/reports" component={DataStudioReports} />
        <Route path="/reports/builder/:id?" component={ReportBuilder} />
        <Route path="/reports/designer" component={ReportBuilder} />
        <Route path="/reports/scheduler" component={EmailSender} />
        <Route path="/reports/email-templates" component={EmailTemplatesDesigner} />
        <Route path="/reports/presentation/:id" component={({ params }) => <PresentationView presentationId={params.id} />} />
        <Route path="/design-studio" component={ReportBuilder} />
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
        <Route path="/campaigns/:campaignId" component={CampaignDetail} />
        <Route path="/campaigns/:campaignId/edit" component={CampaignEdit} />
        <Route path="/campaigns/:campaignId/analytics" component={Campaigns} />
        <Route path="/promotions" component={Promotions} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/activity-log" component={ActivityLog} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/admin" component={Admin} />
        <Route path="/roles" component={RoleManagement} />
        
        {/* Catch-all route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
};

const App = () => {
  // Initialize Amplitude on app start
  React.useEffect(() => {
    initializeAmplitude();
  }, []);

  return (
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
};

export default App;
