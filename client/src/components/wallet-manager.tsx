import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet,
  Plus,
  Minus,
  CreditCard,
  History,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";

interface WalletManagerProps {
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export function WalletManager({ triggerText = "Manage Wallet", triggerVariant = "outline" }: WalletManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    enabled: !!user,
  });

  const addFundsMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", "/api/wallet/create-order", {
        amount
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "LinkConnect",
        description: "Wallet Top-up",
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            await apiRequest("POST", "/api/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast({
              title: "Payment Successful",
              description: `₹${(data.amount / 100).toFixed(2)} added to your wallet!`,
            });
            
            queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
            queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
            setAddAmount("");
            setIsAddOpen(false);
            
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user?.firstName || user?.email || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create payment order",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, bankDetails }: { amount: string; bankDetails: any }) => {
      return await apiRequest("POST", "/api/wallet/withdraw", {
        amount,
        bankDetails,
      });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Processed",
        description: `$${withdrawAmount} withdrawal has been processed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setWithdrawAmount("");
      setIsWithdrawOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Process Withdrawal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleAddFunds = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    addFundsMutation.mutate(addAmount);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const currentBalance = parseFloat(walletData?.balance || "0");
    if (parseFloat(withdrawAmount) > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to withdraw this amount",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount: withdrawAmount,
      bankDetails: { accountNumber: "****1234" }, // Mock bank details
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2">
          <Wallet className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Balance</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  ${parseFloat(walletData?.balance || "0").toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Funds to Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="add-amount">Amount ($)</Label>
                        <Input
                          id="add-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          min="1"
                          step="0.01"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddFunds}
                          disabled={addFundsMutation.isPending}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {addFundsMutation.isPending ? "Processing..." : "Add Funds"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {user?.role === "publisher" && (
                  <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2">
                        <Minus className="h-4 w-4" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="withdraw-amount">Amount ($)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min="1"
                            step="0.01"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleWithdraw}
                            disabled={withdrawMutation.isPending}
                            className="flex-1"
                          >
                            {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsWithdrawOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {transactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === "credit" ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "credit" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}