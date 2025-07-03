import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, CreditCard, Wallet, AlertCircle, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { WalletManager } from "@/components/wallet-manager";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const queryClient = useQueryClient();

  // Get cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Get wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    enabled: isAuthenticated,
  });

  // Calculate totals
  const subtotal = cartItems.reduce((total: number, item: any) => {
    return total + parseFloat(item.website.pricePerPost);
  }, 0);
  const platformFee = subtotal * 0.05;
  const totalAmount = subtotal + platformFee;
  const walletBalance = parseFloat(walletData?.balance || "0");
  const hasInsufficientFunds = walletBalance < totalAmount;

  const paymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/orders/checkout", {
        paymentMethod: 'wallet',
        needsContent: false
      });
    },
    onSuccess: (data, method) => {
      if (method === 'razorpay') {
        // Open Razorpay checkout
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "LinkConnect",
          description: "Guest Post Payment",
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await apiRequest("POST", "/api/payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              
              toast({
                title: "Payment Successful",
                description: "Your orders have been created successfully!",
              });
              
              // Redirect to orders page
              window.location.href = "/orders";
            } catch (error: any) {
              toast({
                title: "Payment Verification Failed",
                description: error.message,
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`,
            email: user?.email || '',
          },
          theme: {
            color: "#3B82F6"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Wallet payment successful
        toast({
          title: "Payment Successful",
          description: "Your orders have been created successfully!",
        });
        window.location.href = "/orders";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPaymentLoading(false);
    }
  });

  const handleWalletPayment = () => {
    setPaymentLoading(true);
    paymentMutation.mutate();
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some websites to your cart to proceed with checkout.</p>
          <Button onClick={() => window.location.href = "/"}>
            Browse Websites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b">
                    <div className="flex-1">
                      <h3 className="font-medium">{new URL(item.website.url.startsWith('http') ? item.website.url : `https://${item.website.url}`).hostname}</h3>
                      <p className="text-sm text-gray-600">{item.website.category?.name}</p>
                      <p className="text-sm text-gray-600">DA: {item.website.domainAuthority}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.website.pricePerPost}</p>
                    </div>
                  </div>
                ))}
                
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (5%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Balance Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
                    <span className="text-lg font-bold">${walletBalance.toFixed(2)}</span>
                  </div>
                  {hasInsufficientFunds && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You need ${(totalAmount - walletBalance).toFixed(2)} more to complete this purchase.
                        <div className="mt-2">
                          <WalletManager triggerText="Add Funds" triggerVariant="default" />
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Wallet Payment Button */}
                <Button
                  className="w-full h-16"
                  onClick={handleWalletPayment}
                  disabled={paymentLoading || hasInsufficientFunds || cartItems.length === 0}
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  <div>
                    {paymentLoading ? "Processing..." : `Pay $${totalAmount.toFixed(2)} with Wallet`}
                  </div>
                </Button>

                <div className="pt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}