import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Globe } from "lucide-react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const handleRoleSelection = (role: string) => {
    // Store the selected role in localStorage to use after auth
    localStorage.setItem('selectedRole', role);
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900 mb-2">
            Join LinkConnect
          </DialogTitle>
          <p className="text-center text-gray-600">Choose how you want to use our platform</p>
        </DialogHeader>
        
        <div className="space-y-4 mb-6">
          <div 
            className="border-2 border-gray-200 hover:border-primary rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleRoleSelection('buyer')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="text-primary text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">I'm a Buyer</h3>
                <p className="text-sm text-gray-600">Looking for guest post opportunities</p>
              </div>
            </div>
          </div>
          
          <div 
            className="border-2 border-gray-200 hover:border-primary rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleRoleSelection('publisher')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="text-secondary text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">I'm a Publisher</h3>
                <p className="text-sm text-gray-600">I own websites and want to sell placements</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <Button 
            className="w-full mb-3" 
            onClick={() => handleRoleSelection('buyer')}
          >
            Continue with Google
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleRoleSelection('buyer')}
          >
            Continue with Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
