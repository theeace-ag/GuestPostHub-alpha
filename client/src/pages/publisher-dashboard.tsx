import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Globe, 
  ShoppingBag, 
  Clock, 
  Plus, 
  FileText, 
  TrendingUp,
  Edit,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function PublisherDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/publisher/websites"],
    enabled: isAuthenticated && user?.role === 'publisher',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
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

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && user?.role === 'publisher',
  });

  // Calculate stats
  const totalEarnings = orders
    .filter((order: any) => order.status === 'completed')
    .reduce((sum: number, order: any) => sum + parseFloat(order.amount), 0);
  
  const activeWebsites = websites.filter((w: any) => w.approvalStatus === 'approved').length;
  const thisMonthOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;
  
  const pendingReviews = websites.filter((w: any) => w.approvalStatus === 'pending').length;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'publisher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Publisher Dashboard</h1>
            <p className="text-gray-600">Manage your websites and track your earnings</p>
          </div>

          {/* Publisher Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
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
                    <p className="text-sm text-gray-600">Active Websites</p>
                    <p className="text-2xl font-bold text-gray-900">{activeWebsites}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-primary text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Orders This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{thisMonthOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="text-purple-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingReviews}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-orange-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/website-submission">
                  <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto w-full justify-start border-2 border-dashed hover:border-primary hover:bg-blue-50">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Plus className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Add New Website</h3>
                      <p className="text-sm text-gray-600">Submit a new site for approval</p>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/orders">
                  <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto w-full justify-start border-2 border-dashed hover:border-green-500 hover:bg-green-50">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <FileText className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">View Orders</h3>
                      <p className="text-sm text-gray-600">Manage pending orders</p>
                    </div>
                  </Button>
                </Link>
                
                <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto w-full justify-start border-2 border-dashed hover:border-yellow-500 hover:bg-yellow-50">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">View performance metrics</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Websites */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Websites</CardTitle>
                <Link href="/website-submission">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Website
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {websitesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading websites...</p>
                </div>
              ) : websites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No websites</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first website.</p>
                  <div className="mt-6">
                    <Link href="/website-submission">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Website
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Website</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>DA</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {websites.map((website: any) => (
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
                                <p className="text-sm text-gray-600">
                                  {website.monthlyTraffic ? `${(website.monthlyTraffic / 1000)}k monthly visits` : 'Traffic data unavailable'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {website.category?.name || 'General'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {website.domainAuthority || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${website.pricePerPost}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                website.approvalStatus === 'approved' ? 'default' :
                                website.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {website.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {website.totalOrders || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
