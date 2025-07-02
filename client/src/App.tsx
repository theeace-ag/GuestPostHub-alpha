import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

// Pages
import Landing from "@/pages/landing";
import BuyerDashboard from "@/pages/buyer-dashboard";
import PublisherDashboard from "@/pages/publisher-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Orders from "@/pages/orders";
import Checkout from "@/pages/checkout";
import WebsiteSubmission from "@/pages/website-submission";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug user data to check what's being returned
  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      console.log('User role:', (user as any)?.role);
    }
  }, [user]);

  // Get user role safely
  const userRole = (user as any)?.role || 'buyer';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated user routes
  return (
    <Switch>
      {/* Role-based home route */}
      <Route path="/">
        {userRole === 'buyer' ? <BuyerDashboard /> :
         userRole === 'publisher' ? <PublisherDashboard /> :
         userRole === 'admin' ? <AdminDashboard /> :
         <BuyerDashboard />}
      </Route>

      {/* Specific role routes */}
      <Route path="/buyer">
        {userRole === 'buyer' ? <BuyerDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/publisher">
        {userRole === 'publisher' ? <PublisherDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/admin">
        {userRole === 'admin' ? <AdminDashboard /> : <NotFound />}
      </Route>

      <Route path="/website-submission">
        {userRole === 'publisher' ? <WebsiteSubmission /> : <NotFound />}
      </Route>

      {/* Shared authenticated routes */}
      <Route path="/orders" component={Orders} />
      <Route path="/checkout" component={Checkout} />

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
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
