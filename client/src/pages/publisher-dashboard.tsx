import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  Plus, 
  TrendingUp,
  Edit,
  BarChart3,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Wrench
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BankingProgressBar } from "@/components/banking-progress-bar";
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
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch publisher's websites
  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ['/api/websites', { publisherId: user?.id }],
    enabled: !!user?.id,
  });

  // Fetch publisher's orders (earnings)
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders', { publisherId: user?.id }],
    enabled: !!user?.id,
  });

  // Calculate earnings
  const totalEarnings = orders.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.amount || '0');
  }, 0);

  const pendingEarnings = orders
    .filter((order: any) => order.status === 'pending' || order.status === 'in_progress')
    .reduce((sum: number, order: any) => sum + parseFloat(order.amount || '0'), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Publisher Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Manage your websites and track your earnings.</p>
        </div>

        {/* Banking Progress Bar */}
        <BankingProgressBar user={user} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{websites.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{pendingEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/website-submission">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add New Website</span>
            </Button>
          </Link>
          
          <Button variant="outline" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Withdraw Earnings</span>
          </Button>

          <Button variant="outline" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Free SEO Tools</span>
          </Button>

          <Button variant="outline" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Button>
        </div>

        {/* Websites Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Websites</CardTitle>
          </CardHeader>
          <CardContent>
            {websitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No websites yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first website to the marketplace</p>
                <Link href="/website-submission">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Website
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Website</TableHead>
                    <TableHead>Domain Authority</TableHead>
                    <TableHead>Price per Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {websites.map((website: any) => (
                    <TableRow key={website.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{website.url}</div>
                            <div className="text-sm text-gray-500">{website.category?.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{website.domainAuthority}</TableCell>
                      <TableCell>₹{website.pricePerPost}</TableCell>
                      <TableCell>{getStatusBadge(website.approvalStatus)}</TableCell>
                      <TableCell>{website.totalOrders || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Orders will appear here once buyers start purchasing from your websites</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.website?.url}</TableCell>
                      <TableCell>{order.buyer?.firstName} {order.buyer?.lastName}</TableCell>
                      <TableCell>₹{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}