import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function ShoppingCartSheet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [needsContent, setNeedsContent] = useState(false);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = "/checkout";
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((total: number, item: any) => {
      return total + parseFloat(item.website.pricePerPost);
    }, 0);
    
    const contentFee = needsContent ? cartItems.length * 50 : 0;
    const platformFee = (subtotal + contentFee) * 0.05;
    const total = subtotal + contentFee + platformFee;

    return { subtotal, contentFee, platformFee, total };
  };

  const { subtotal, contentFee, platformFee, total } = calculateTotals();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart ({cartItems.length})
          {cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {cartItems.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {item.website.url[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.website.url}</h4>
                      <p className="text-sm text-gray-600">{item.website.category?.name || 'General'}</p>
                      <p className="text-sm font-medium text-primary">${item.website.pricePerPost}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCartMutation.mutate(item.id)}
                      disabled={removeFromCartMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Content Options */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Content Options</h3>
                <RadioGroup value={needsContent ? "yes" : "no"} onValueChange={(value) => setNeedsContent(value === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no-content" />
                    <Label htmlFor="no-content" className="text-sm">I'll provide the content</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes-content" />
                    <Label htmlFor="yes-content" className="text-sm">Content writing required (+₹50/post)</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t pt-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} posts)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {contentFee > 0 && (
                  <div className="flex justify-between">
                    <span>Content writing</span>
                    <span>${contentFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Platform Fee (5%)</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full mb-3" 
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
