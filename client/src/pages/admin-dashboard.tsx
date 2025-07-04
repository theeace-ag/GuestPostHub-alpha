import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DollarSign, 
  Users, 
  Clock, 
  ShoppingCart,
  CheckCircle,
  XCircle,
  Eye,
  Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AdminOrderApproval } from "@/components/admin-order-approval";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin session expired. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: pendingWebsites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/admin/websites/pending"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const approveWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      await apiRequest("PATCH", `/api/admin/websites/${websiteId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Website Approved",
        description: "The website has been approved and is now live",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/websites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      await apiRequest("PATCH", `/api/admin/websites/${websiteId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Website Rejected",
        description: "The website has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/websites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = allOrders.filter((order: any) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.website.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Platform management and oversight</p>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${statsLoading ? '...' : dashboardStats?.totalRevenue || '0.00'}
                    </p>
                    <p className="text-sm text-green-600">Platform earnings</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.activeUsers?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-green-600">Total registered</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-primary text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.pendingApprovals || '0'}
                    </p>
                    <p className="text-sm text-amber-600">Requires attention</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-amber-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.totalOrders?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-green-600">All time</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-purple-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Card>
            <Tabs defaultValue="approvals" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="approvals">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Website Approval Queue</h2>
                      <div className="flex space-x-3">
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Bulk Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                        >
                          Bulk Reject
                        </Button>
                      </div>
                    </div>

                    {websitesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading pending websites...</p>
                      </div>
                    ) : pendingWebsites.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                        <p className="mt-1 text-sm text-gray-500">No websites pending approval.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Website</TableHead>
                              <TableHead>Publisher</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>DA/Traffic</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Submitted</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingWebsites.map((website: any) => (
                              <TableRow key={website.id}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                      <span className="text-xs font-medium">
                                        {website.url[0]?.toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{website.url}</p>
                                      <p className="text-sm text-gray-600">{website.category?.name || 'General'}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                      <span className="text-xs">
                                        {website.publisher.firstName?.[0] || website.publisher.email?.[0] || 'U'}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                      {website.publisher.firstName || website.publisher.email?.split('@')[0] || 'Unknown'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                  {website.category?.name || 'General'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p className="font-medium">DA: {website.domainAuthority || 'N/A'}</p>
                                    <p className="text-gray-600">
                                      {website.monthlyTraffic ? `${Math.round(website.monthlyTraffic / 1000)}k visits/mo` : 'Traffic N/A'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">₹{website.pricePerPost}</TableCell>
                                <TableCell className="text-gray-600">
                                  {new Date(website.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => approveWebsiteMutation.mutate(website.id)}
                                      disabled={approveWebsiteMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => rejectWebsiteMutation.mutate(website.id)}
                                      disabled={rejectWebsiteMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4 mr-1" />
                                      Review
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="users">
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">User Management</h3>
                    <p className="mt-1 text-sm text-gray-500">User management features coming soon.</p>
                  </div>
                </TabsContent>

                <TabsContent value="orders">
                  <AdminOrderApproval />
                </TabsContent>

                <TabsContent value="analytics">
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">📊</div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Dashboard</h3>
                    <p className="mt-1 text-sm text-gray-500">Advanced analytics and reporting coming soon.</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
