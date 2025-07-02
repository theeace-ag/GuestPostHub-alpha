import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  ShoppingCart, 
  Filter,
  SortAsc,
  Star,
  Globe,
  TrendingUp,
  DollarSign,
  Package
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { WebsiteCard } from "@/components/website-card";
import { ShoppingCartSheet } from "@/components/shopping-cart";
import { Link } from "wouter";

export default function BuyerDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minDA, setMinDA] = useState("");
  const [maxDA, setMaxDA] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [linkType, setLinkType] = useState("");
  const [sortBy, setSortBy] = useState("domainAuthority");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch websites with filters
  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ['/api/websites', { 
      search: searchTerm,
      categoryId: selectedCategory,
      minDA,
      maxDA,
      minPrice,
      maxPrice,
      linkType,
      approvalStatus: 'approved'
    }],
  });

  // Fetch buyer's cart
  const { data: cartItems = [] } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!user?.id,
  });

  // Fetch buyer's orders for stats
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders', { buyerId: user?.id }],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalSpent = orders.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.totalAmount || '0');
  }, 0);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setMinDA("");
    setMaxDA("");
    setMinPrice("");
    setMaxPrice("");
    setLinkType("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Find high-authority websites for your guest posts.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Websites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{websites.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <ShoppingCartSheet />
          
          <Link href="/orders">
            <Button variant="outline" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </Button>
          </Link>

          <Button variant="outline" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search websites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Domain Authority Range */}
              <div className="flex gap-2">
                <Input
                  placeholder="Min DA"
                  value={minDA}
                  onChange={(e) => setMinDA(e.target.value)}
                  type="number"
                />
                <Input
                  placeholder="Max DA"
                  value={maxDA}
                  onChange={(e) => setMaxDA(e.target.value)}
                  type="number"
                />
              </div>

              {/* Price Range */}
              <div className="flex gap-2">
                <Input
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  type="number"
                />
                <Input
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* Link Type */}
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Link Types</SelectItem>
                  <SelectItem value="dofollow">DoFollow</SelectItem>
                  <SelectItem value="nofollow">NoFollow</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domainAuthority">Domain Authority</SelectItem>
                  <SelectItem value="pricePerPost">Price</SelectItem>
                  <SelectItem value="monthlyTraffic">Traffic</SelectItem>
                  <SelectItem value="createdAt">Newest</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Website Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Websites</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <SortAsc className="w-4 h-4" />
              {websites.length} websites found
            </div>
          </div>

          {websitesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : websites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No websites found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory || minDA || maxDA || minPrice || maxPrice || linkType
                    ? "Try adjusting your filters to see more results"
                    : "No approved websites are available at the moment"
                  }
                </p>
                {(searchTerm || selectedCategory || minDA || maxDA || minPrice || maxPrice || linkType) && (
                  <Button onClick={resetFilters}>Clear All Filters</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((website: any) => (
                <WebsiteCard key={website.id} website={website} />
              ))}
            </div>
          )}
        </div>

        {/* Featured Categories */}
        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Browse by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category: any) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center space-y-2"
                    onClick={() => setSelectedCategory(category.id.toString())}
                  >
                    <Star className="w-5 h-5" />
                    <span className="text-xs text-center">{category.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}