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
  ShoppingBag, 
  Clock, 
  Plus, 
  FileText, 
  TrendingUp,
  Edit,
  BarChart3,
  Home,
  Menu,
  X,
  Search,
  Settings,
  Award,
  CreditCard
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function PublisherDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  
  const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'websites', label: 'My Websites', icon: Globe },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'affiliate', label: 'Affiliate Program', icon: Award },
    { id: 'seo-tools', label: 'Free SEO Tools', icon: TrendingUp },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'publisher') {
    return null;
  }

  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-100">Total Websites</p>
                      <p className="text-3xl font-bold">{activeWebsites}</p>
                    </div>
                    <Globe className="h-8 w-8 text-cyan-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-100">Total Orders</p>
                      <p className="text-3xl font-bold">{thisMonthOrders}</p>
                      <div className="flex space-x-4 mt-2 text-sm">
                        <span>0 Completed Orders</span>
                        <span>{pendingOrders} Pending Orders</span>
                      </div>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-teal-100">Total Sales</p>
                      <p className="text-3xl font-bold">${totalEarnings.toFixed(0)}</p>
                      <p className="text-sm text-teal-200 mt-1">$0 Amount Withdrawn</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-teal-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'websites':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Websites</h2>
              <Link href="/website-submission">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Website
                </Button>
              </Link>
            </div>
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
              <Card>
                <CardContent className="p-0">
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
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Orders</h2>
            <div className="flex space-x-4 mb-4">
              <Button variant="outline" size="sm">New(0)</Button>
              <Button variant="outline" size="sm">In Progress(0)</Button>
              <Button variant="outline" size="sm">Delayed(0)</Button>
              <Button variant="outline" size="sm">Delivered(0)</Button>
              <Button variant="default" size="sm">Completed(0)</Button>
              <Button variant="outline" size="sm">Rejected(0)</Button>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No data available in table</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'payouts':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payouts</h2>
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">paypal@example.com</span>
                    <Button variant="outline" size="sm">WITHDRAW</Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Note: All withdrawal requests will be paid in your respective PayPal account on the 15th and the 28th of each month.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <h3 className="font-medium">Balance</h3>
                    <p className="text-lg">${user?.walletBalance || '0.00'}</p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium">Withdrawn</h3>
                    <p className="text-lg">$0.00</p>
                  </div>
                  <div className="text-center bg-orange-100 p-3 rounded">
                    <h3 className="font-medium">Tax Information</h3>
                    <Button variant="link" className="text-blue-600 p-0">
                      Click here to complete your profile to withdraw funds.
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <div>Coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo and Brand */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded">
              <Globe className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg">Link Publishers</span>
            )}
          </div>
        </div>

        {/* Balance Circle */}
        <div className="p-4 text-center border-b border-slate-700">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-slate-800">${user?.walletBalance ? parseInt(user.walletBalance) : 0}</span>
          </div>
          {sidebarOpen && <p className="text-sm text-slate-300">Balance</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                      activeTab === item.id 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{user?.firstName?.[0] || 'U'}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.firstName || 'User'}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-slate-400">Online</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Tax Information Alert */}
              <div className="bg-green-100 border border-green-400 px-4 py-2 rounded flex items-center space-x-2">
                <span className="text-sm text-green-800">Tax information needed</span>
                <Button variant="link" className="text-blue-600 p-0 h-auto text-sm">
                  Click here to complete your profile to withdraw funds.
                </Button>
              </div>
              
              {/* Vacation Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">Vacation Mode</span>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
}
