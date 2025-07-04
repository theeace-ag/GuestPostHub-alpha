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
import {
  CheckCircle,
  Clock,
  CreditCard,
  User,
  Building,
  DollarSign,
} from "lucide-react";

export function AdminPaymentConfirmation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentPendingOrders = [], isLoading } = useQuery({
    queryKey: ["/api/admin/orders/payment-pending"],
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: number }) => {
      return await apiRequest("PATCH", `/api/admin/orders/${orderId}/confirm-payment`, {});
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Payment has been released to the publisher's wallet.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/payment-pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const handleConfirmPayment = (orderId: number) => {
    confirmPaymentMutation.mutate({ orderId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading payment pending orders...</span>
        </div>
      </div>
    );
  }

  if (paymentPendingOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Payments Processed!</h3>
          <p className="text-muted-foreground">
            No payments are currently pending confirmation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Payment Confirmation</h2>
        <Badge variant="outline">{paymentPendingOrders.length} pending</Badge>
      </div>

      <div className="grid gap-6">
        {paymentPendingOrders.map((order: any) => (
          <Card key={order.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Order #{order.orderNumber}</span>
                  <Badge variant="outline">₹{parseFloat(order.amount).toFixed(2)}</Badge>
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-800">
                  Payment Pending
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
                    <p><span className="font-medium">Amount:</span> ₹{parseFloat(order.amount).toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Publisher Banking Details</h4>
                  {order.publisher?.hasBankingDetails ? (
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{order.publisher?.bankingDetails?.accountHolderName || "Available"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{order.publisher?.bankingDetails?.bankName || "Available"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{order.publisher?.bankingDetails?.accountType || "Available"}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Banking details are available for verification
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ⚠️ No banking details provided
                    </div>
                  )}
                </div>
              </div>

              {order.publishedUrl && (
                <div className="space-y-2">
                  <h4 className="font-medium">Published Content:</h4>
                  <a 
                    href={order.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {order.publishedUrl}
                  </a>
                </div>
              )}

              {order.publisherNotes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Publisher Notes:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{order.publisherNotes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleConfirmPayment(order.id)}
                  disabled={confirmPaymentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmPaymentMutation.isPending ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}