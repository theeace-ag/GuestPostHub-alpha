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
import WebsiteSubmission from "@/pages/website-submission";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Handle role assignment after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const selectedRole = localStorage.getItem('selectedRole');
      if (selectedRole && user.role === 'buyer' && selectedRole !== 'buyer') {
        // Update user role if different from stored selection
        // This would typically be handled by the backend during first login
        localStorage.removeItem('selectedRole');
      }
    }
  }, [isAuthenticated, user]);

  return (
    <Switch>
      {isLoading ? (
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </>
      ) : (
        <>
          {/* Role-based home routes */}
          <Route path="/">
            {user?.role === 'buyer' && <BuyerDashboard />}
            {user?.role === 'publisher' && <PublisherDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
          </Route>

          {/* Buyer routes */}
          {user?.role === 'buyer' && (
            <>
              <Route path="/buyer" component={BuyerDashboard} />
            </>
          )}

          {/* Publisher routes */}
          {user?.role === 'publisher' && (
            <>
              <Route path="/publisher" component={PublisherDashboard} />
              <Route path="/website-submission" component={WebsiteSubmission} />
            </>
          )}

          {/* Admin routes */}
          {user?.role === 'admin' && (
            <>
              <Route path="/admin" component={AdminDashboard} />
            </>
          )}

          {/* Shared authenticated routes */}
          <Route path="/orders" component={Orders} />

          {/* Fallback to role-based dashboard for unknown routes */}
          <Route>
            {user?.role === 'buyer' && <BuyerDashboard />}
            {user?.role === 'publisher' && <PublisherDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
            {!user && <NotFound />}
          </Route>
        </>
      )}
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
