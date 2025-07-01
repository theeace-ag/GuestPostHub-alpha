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
            {userRole === 'buyer' && <BuyerDashboard />}
            {userRole === 'publisher' && <PublisherDashboard />}
            {userRole === 'admin' && <AdminDashboard />}
          </Route>

          {/* Buyer routes */}
          {userRole === 'buyer' && (
            <>
              <Route path="/buyer" component={BuyerDashboard} />
            </>
          )}

          {/* Publisher routes */}
          {userRole === 'publisher' && (
            <>
              <Route path="/publisher" component={PublisherDashboard} />
              <Route path="/website-submission" component={WebsiteSubmission} />
            </>
          )}

          {/* Admin routes */}
          {userRole === 'admin' && (
            <>
              <Route path="/admin" component={AdminDashboard} />
            </>
          )}

          {/* Shared authenticated routes */}
          <Route path="/orders" component={Orders} />
          <Route path="/checkout" component={Checkout} />

          {/* Fallback to role-based dashboard for unknown routes */}
          <Route>
            {userRole === 'buyer' && <BuyerDashboard />}
            {userRole === 'publisher' && <PublisherDashboard />}
            {userRole === 'admin' && <AdminDashboard />}
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
