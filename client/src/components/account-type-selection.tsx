import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingCart, Globe, Shield, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountTypeSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelection: (role: string) => void;
}

export function AccountTypeSelection({ isOpen, onClose, onSelection }: AccountTypeSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: "Selection Required",
        description: "Please select an account type to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/set-role", { role: selectedRole });
      onSelection(selectedRole);
      onClose();
      toast({
        title: "Account Created",
        description: `Your ${selectedRole} account has been set up successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set account type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypes = [
    {
      role: "buyer",
      title: "Buyer Account",
      description: "I want to purchase guest posts and build backlinks",
      icon: <ShoppingCart className="h-8 w-8" />,
      features: [
        "Browse high-quality websites",
        "Purchase guest posts",
        "Track order progress",
        "Access to premium publishers",
        "Order management dashboard"
      ],
      badge: "Most Popular"
    },
    {
      role: "publisher",
      title: "Publisher Account", 
      description: "I want to sell guest posts on my website",
      icon: <Globe className="h-8 w-8" />,
      features: [
        "Submit your websites for review",
        "Set your own pricing",
        "Manage orders and content",
        "Track earnings",
        "Publisher dashboard"
      ],
      badge: "Earn Money"
    },
    {
      role: "admin",
      title: "Admin Account",
      description: "Platform administration (Dev Team Only)",
      icon: <Shield className="h-8 w-8" />,
      features: [
        "Approve/reject websites",
        "Manage users and orders",
        "Financial oversight",
        "Platform analytics",
        "System administration"
      ],
      badge: "Dev Team",
      disabled: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Account Type</DialogTitle>
          <DialogDescription className="text-center">
            Select the type of account that best describes how you'll use LinkConnect. You can change this once later from your settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {accountTypes.map((account) => (
            <Card 
              key={account.role}
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === account.role 
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${account.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !account.disabled && setSelectedRole(account.role)}
            >
              <CardHeader className="text-center">
                <div className="relative">
                  {account.badge && (
                    <Badge 
                      variant={account.role === 'buyer' ? 'default' : account.role === 'publisher' ? 'secondary' : 'outline'}
                      className="absolute -top-2 -right-2 text-xs"
                    >
                      {account.badge}
                    </Badge>
                  )}
                  <div className={`mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                    account.role === 'buyer' ? 'bg-blue-100 text-blue-600' :
                    account.role === 'publisher' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {account.icon}
                  </div>
                  <CardTitle className="text-lg">{account.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  {account.description}
                </p>
                <div className="space-y-2">
                  {account.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {selectedRole === account.role && (
                  <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium text-center">
                      ✓ Selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="px-8 py-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up account...
              </>
            ) : (
              `Create ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : ''} Account`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}