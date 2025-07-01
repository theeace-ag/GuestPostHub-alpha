import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WebsiteCardProps {
  website: {
    id: number;
    url: string;
    domainAuthority: number;
    monthlyTraffic: number;
    pricePerPost: string;
    linkType: string;
    postDuration: string;
    rating: string;
    category?: {
      name: string;
    };
  };
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        websiteId: website.id,
        needsContent: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${website.url} has been added to your cart`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTraffic = (traffic: number) => {
    if (traffic >= 1000000) {
      return `${(traffic / 1000000).toFixed(1)}M`;
    } else if (traffic >= 1000) {
      return `${(traffic / 1000).toFixed(0)}k`;
    }
    return traffic.toString();
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs font-medium">
                {getDomainFromUrl(website.url)[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{getDomainFromUrl(website.url)}</h3>
              <p className="text-sm text-gray-500">{website.category?.name || 'General'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{website.rating || '4.8'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">{website.domainAuthority || 'N/A'}</div>
            <div className="text-xs text-gray-600">Domain Authority</div>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-secondary">
              {website.monthlyTraffic ? formatTraffic(website.monthlyTraffic) : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Monthly Traffic</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <Badge variant={website.linkType === 'dofollow' ? 'default' : 'secondary'}>
              {website.linkType || 'DoFollow'}
            </Badge>
            <Badge variant="outline">
              {website.postDuration || 'Permanent'}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${website.pricePerPost}</div>
            <div className="text-xs text-gray-500">per post</div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            className="flex-1" 
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
