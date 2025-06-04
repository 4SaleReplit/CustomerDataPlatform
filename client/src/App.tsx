import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UserExplorer from "@/pages/UserExplorer";
import UserProfile from "@/pages/UserProfile";
import Cohorts from "@/pages/Cohorts";
import Promotions from "@/pages/Promotions";
import Integrations from "@/pages/Integrations";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Dashboard} />
        <Route path="/users" component={UserExplorer} />
        <Route path="/users/:id" component={UserProfile} />
        <Route path="/cohorts" component={Cohorts} />
        <Route path="/promotions" component={Promotions} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
