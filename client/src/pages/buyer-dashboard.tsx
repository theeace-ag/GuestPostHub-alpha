import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { WebsiteCard } from "@/components/website-card";
import { ShoppingCartSheet } from "@/components/shopping-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function BuyerDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    categoryId: "",
    minDA: "",
    maxDA: "",
    minPrice: "",
    maxPrice: "",
    language: "",
    linkType: "",
  });

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

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/websites", searchTerm, filters],
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

  const handleSearch = () => {
    // The query will automatically refetch when searchTerm or filters change
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      categoryId: "",
      minDA: "",
      maxDA: "",
      minPrice: "",
      maxPrice: "",
      language: "",
      linkType: "",
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Quality Websites</h1>
                <p className="text-gray-600">Discover high-authority publishers for your guest posting needs</p>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                <ShoppingCartSheet />
                <Link href="/orders">
                  <Button>My Orders</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter niche, category, or keywords..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain Authority</label>
                  <Select value={filters.minDA} onValueChange={(value) => setFilters({...filters, minDA: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any DA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any DA</SelectItem>
                      <SelectItem value="20">DA 20+</SelectItem>
                      <SelectItem value="30">DA 30+</SelectItem>
                      <SelectItem value="50">DA 50+</SelectItem>
                      <SelectItem value="70">DA 70+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <Select value={filters.maxPrice} onValueChange={(value) => setFilters({...filters, maxPrice: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Price</SelectItem>
                      <SelectItem value="50">Under $50</SelectItem>
                      <SelectItem value="100">Under $100</SelectItem>
                      <SelectItem value="250">Under $250</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <Select value={filters.categoryId} onValueChange={(value) => setFilters({...filters, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <Select value={filters.language} onValueChange={(value) => setFilters({...filters, language: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Language</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
                  <Select value={filters.linkType} onValueChange={(value) => setFilters({...filters, linkType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="dofollow">Dofollow</SelectItem>
                      <SelectItem value="nofollow">Nofollow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{websites.length} websites</span> matching your criteria
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Sort by:</span>
              <Select defaultValue="da">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="da">Domain Authority</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website Listings Grid */}
          {websitesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading websites...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No websites found matching your criteria.</p>
              <Button onClick={resetFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {websites.map((website: any) => (
                <WebsiteCard key={website.id} website={website} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
