import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main App Routes */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="/users/:userId" element={<Layout><UserProfile /></Layout>} />
          <Route path="/cohorts" element={<Layout><Cohorts /></Layout>} />
          <Route path="/cohorts/new" element={<Layout><CohortBuilder /></Layout>} />
          <Route path="/cohorts/:cohortId" element={<Layout><CohortDetail /></Layout>} />
          <Route path="/cohorts/:cohortId/edit" element={<Layout><CohortDetail /></Layout>} />
          <Route path="/segments" element={<Layout><Segments /></Layout>} />
          <Route path="/segments/:segmentId" element={<Layout><SegmentDetail /></Layout>} />
          <Route path="/segments/:segmentId/edit" element={<Layout><SegmentDetail /></Layout>} />
          <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
          <Route path="/campaigns/new" element={<Layout><CampaignBuilder /></Layout>} />
          <Route path="/campaigns/:campaignId/edit" element={<Layout><CampaignBuilder /></Layout>} />
          <Route path="/campaigns/:campaignId/analytics" element={<Layout><Campaigns /></Layout>} />
          <Route path="/promotions" element={<Layout><Promotions /></Layout>} />
          <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
          <Route path="/activity-log" element={<Layout><ActivityLog /></Layout>} />
          <Route path="/integrations" element={<Layout><Integrations /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
