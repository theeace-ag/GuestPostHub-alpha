import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Orders() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
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

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: any }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "The order has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter((order: any) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.role === 'buyer' && order.publisher.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user?.role === 'publisher' && order.buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'default';
      case 'disputed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `order-status-${status}`;
  };

  const canUpdateOrder = (order: any) => {
    if (user?.role === 'publisher' && order.publisherId === user.id) {
      return ['pending', 'in_progress'].includes(order.status);
    }
    if (user?.role === 'buyer' && order.buyerId === user.id) {
      return ['pending'].includes(order.status);
    }
    if (user?.role === 'admin') {
      return true;
    }
    return false;
  };

  const getAvailableStatuses = (order: any) => {
    if (user?.role === 'publisher' && order.status === 'pending') {
      return ['in_progress', 'cancelled'];
    }
    if (user?.role === 'publisher' && order.status === 'in_progress') {
      return ['completed'];
    }
    if (user?.role === 'admin') {
      return ['pending', 'in_progress', 'completed', 'disputed', 'cancelled'];
    }
    return [];
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.role === 'buyer' ? 'My Orders' : 
               user?.role === 'publisher' ? 'Received Orders' : 
               'All Orders'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'buyer' ? 'Track your guest post orders and their progress' : 
               user?.role === 'publisher' ? 'Manage guest post orders for your websites' : 
               'Monitor all platform orders and transactions'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Orders</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search orders..."
                      className="pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? 'Try adjusting your search criteria.' 
                      : user?.role === 'buyer' 
                        ? 'You haven\'t placed any orders yet.'
                        : 'No orders have been received yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        {user?.role === 'buyer' && <TableHead>Website</TableHead>}
                        {user?.role === 'buyer' && <TableHead>Publisher</TableHead>}
                        {user?.role === 'publisher' && <TableHead>Buyer</TableHead>}
                        {user?.role === 'publisher' && <TableHead>Website</TableHead>}
                        {user?.role === 'admin' && <TableHead>Buyer</TableHead>}
                        {user?.role === 'admin' && <TableHead>Website</TableHead>}
                        {user?.role === 'admin' && <TableHead>Publisher</TableHead>}
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                          
                          {user?.role === 'buyer' && (
                            <>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{order.website.url}</p>
                                  <p className="text-gray-600">{order.website.category?.name || 'General'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs">
                                      {order.publisher.firstName?.[0] || order.publisher.email?.[0] || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm">
                                    {order.publisher.firstName || order.publisher.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                            </>
                          )}

                          {user?.role === 'publisher' && (
                            <>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs">
                                      {order.buyer.firstName?.[0] || order.buyer.email?.[0] || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm">
                                    {order.buyer.firstName || order.buyer.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{order.website.url}</p>
                                  <p className="text-gray-600">{order.website.category?.name || 'General'}</p>
                                </div>
                              </TableCell>
                            </>
                          )}

                          {user?.role === 'admin' && (
                            <>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs">
                                      {order.buyer.firstName?.[0] || order.buyer.email?.[0] || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm">
                                    {order.buyer.firstName || order.buyer.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{order.website.url}</p>
                                  <p className="text-gray-600">{order.website.category?.name || 'General'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs">
                                      {order.publisher.firstName?.[0] || order.publisher.email?.[0] || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm">
                                    {order.publisher.firstName || order.publisher.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                            </>
                          )}

                          <TableCell className="font-medium">${order.totalAmount}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <p><span className="font-medium">Status:</span> 
                                            <Badge className={`ml-2 ${getStatusBadgeClass(order.status)}`}>
                                              {order.status.replace('_', ' ')}
                                            </Badge>
                                          </p>
                                          <p><span className="font-medium">Amount:</span> ${order.amount}</p>
                                          <p><span className="font-medium">Platform Fee:</span> ${order.platformFee}</p>
                                          <p><span className="font-medium">Total:</span> ${order.totalAmount}</p>
                                          <p><span className="font-medium">Content Required:</span> {order.needsContent ? 'Yes' : 'No'}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Website Details</h4>
                                        <div className="space-y-2 text-sm">
                                          <p><span className="font-medium">URL:</span> {order.website.url}</p>
                                          <p><span className="font-medium">Category:</span> {order.website.category?.name || 'General'}</p>
                                          <p><span className="font-medium">DA:</span> {order.website.domainAuthority || 'N/A'}</p>
                                          <p><span className="font-medium">Link Type:</span> {order.website.linkType}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {order.requirements && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{order.requirements}</p>
                                      </div>
                                    )}

                                    {order.publisherNotes && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Publisher Notes</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{order.publisherNotes}</p>
                                      </div>
                                    )}

                                    {order.postUrl && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Published Post</h4>
                                        <a 
                                          href={order.postUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          {order.postUrl}
                                        </a>
                                      </div>
                                    )}

                                    {canUpdateOrder(order) && (
                                      <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Update Order</h4>
                                        <div className="space-y-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              Change Status
                                            </label>
                                            <Select 
                                              defaultValue={order.status}
                                              onValueChange={(status) => {
                                                updateOrderMutation.mutate({
                                                  orderId: order.id,
                                                  updates: { status }
                                                });
                                              }}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {getAvailableStatuses(order).map((status) => (
                                                  <SelectItem key={status} value={status}>
                                                    {status.replace('_', ' ')}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {user?.role === 'publisher' && (
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Publisher Notes
                                              </label>
                                              <Textarea
                                                placeholder="Add notes for the buyer..."
                                                defaultValue={order.publisherNotes || ''}
                                                onBlur={(e) => {
                                                  if (e.target.value !== order.publisherNotes) {
                                                    updateOrderMutation.mutate({
                                                      orderId: order.id,
                                                      updates: { publisherNotes: e.target.value }
                                                    });
                                                  }
                                                }}
                                              />
                                            </div>
                                          )}

                                          {user?.role === 'publisher' && order.status === 'completed' && (
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Post URL
                                              </label>
                                              <Input
                                                placeholder="Enter the URL of the published post..."
                                                defaultValue={order.postUrl || ''}
                                                onBlur={(e) => {
                                                  if (e.target.value !== order.postUrl) {
                                                    updateOrderMutation.mutate({
                                                      orderId: order.id,
                                                      updates: { postUrl: e.target.value }
                                                    });
                                                  }
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
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
