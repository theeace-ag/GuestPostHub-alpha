import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  AlertTriangle,
} from "lucide-react";

export function AdminOrderApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: pendingOrders = [], isLoading } = useQuery({
    queryKey: ["/api/admin/orders/pending"],
  });

  const approveOrderMutation = useMutation({
    mutationFn: async ({ orderId, approved, rejectionReason }: { 
      orderId: number; 
      approved: boolean; 
      rejectionReason?: string; 
    }) => {
      return await apiRequest("PATCH", `/api/admin/orders/${orderId}/approve`, {
        approved,
        rejectionReason,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.approved ? "Order Approved" : "Order Rejected",
        description: variables.approved 
          ? "Payment will be released to publisher within 24 hours."
          : "Order has been rejected and buyer will be refunded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/pending"] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process order",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (orderId: number) => {
    approveOrderMutation.mutate({ orderId, approved: true });
  };

  const handleReject = (order: any) => {
    setSelectedOrder(order);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this order.",
        variant: "destructive",
      });
      return;
    }

    approveOrderMutation.mutate({
      orderId: selectedOrder.id,
      approved: false,
      rejectionReason: rejectionReason.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading pending orders...</span>
        </div>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No orders are currently pending approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Order Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve completed orders for payment release
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pendingOrders.length} pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {pendingOrders.map((order: any) => (
          <Card key={order.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Order #{order.orderNumber}</span>
                  <Badge variant="outline">₹{parseFloat(order.amount).toFixed(2)}</Badge>
                </CardTitle>
                <Badge className="bg-orange-100 text-orange-800">
                  Pending Approval
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Order Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Website:</span> {order.website?.url}</p>
                    <p><span className="font-medium">Publisher:</span> {order.publisher?.email}</p>
                    <p><span className="font-medium">Buyer:</span> {order.buyer?.email}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(order.contentSubmittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Content Submission</h4>
                  <div className="space-y-2">
                    {order.blogContent && (
                      <div>
                        <p className="text-sm font-medium">Blog Content:</p>
                        <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                          {order.blogContent.substring(0, 200)}
                          {order.blogContent.length > 200 && "..."}
                        </div>
                      </div>
                    )}
                    {order.linkUrl && (
                      <div>
                        <p className="text-sm font-medium">Link URL:</p>
                        <a 
                          href={order.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          {order.linkUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApprove(order.id)}
                  disabled={approveOrderMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Release Payment
                </Button>
                
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(order)}
                      disabled={approveOrderMutation.isPending}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Reject Order #{selectedOrder?.orderNumber}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Please explain why this order is being rejected..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This reason will be sent to both the buyer and publisher.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={confirmReject}
                          disabled={approveOrderMutation.isPending || !rejectionReason.trim()}
                          variant="destructive"
                          className="flex-1"
                        >
                          Confirm Rejection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRejectDialogOpen(false);
                            setRejectionReason("");
                            setSelectedOrder(null);
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}