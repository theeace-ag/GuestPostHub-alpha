import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { AdminOrderApproval } from "@/components/admin-order-approval";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CheckCircle,
  XCircle,
  Eye,
  Globe,
  TrendingUp,
  Search,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DevPortal() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required for Dev Portal",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: pendingWebsites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/admin/websites/pending"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const approveWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      await apiRequest("PATCH", `/api/admin/websites/${websiteId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Website Approved",
        description: "The website has been approved and is now live in the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/websites/pending"] });
      setSelectedWebsite(null);
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectWebsiteMutation = useMutation({
    mutationFn: async ({ websiteId, reason }: { websiteId: number; reason: string }) => {
      await apiRequest("PATCH", `/api/admin/websites/${websiteId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Website Rejected",
        description: "The website has been rejected and publisher has been notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/websites/pending"] });
      setSelectedWebsite(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    rejectWebsiteMutation.mutate({ websiteId: selectedWebsite.id, reason: rejectionReason });
  };

  const filteredWebsites = pendingWebsites.filter((website: any) =>
    website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.publisher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dev Team Portal</h1>
            <p className="text-gray-600">Review and approve publisher website submissions and orders</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {pendingWebsites.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-amber-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Review Time</p>
                    <p className="text-2xl font-bold text-blue-600">24h</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approval Rate</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="websites" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="websites">Website Approvals</TabsTrigger>
              <TabsTrigger value="orders">Order Approvals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="websites" className="space-y-6">
              {/* Search and Filter */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Website Review Queue</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search websites..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Badge variant="outline">
                    {filteredWebsites.length} websites
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {websitesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading pending websites...</p>
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                  <p className="mt-1 text-sm text-gray-500">No websites pending review.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Website</TableHead>
                        <TableHead>Publisher</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Metrics</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWebsites.map((website: any) => (
                        <TableRow key={website.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <Globe className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900">{website.url}</p>
                                  <a 
                                    href={website.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-blue-600"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                                <p className="text-sm text-gray-500">{website.description?.substring(0, 50)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {website.publisher.firstName?.[0] || website.publisher.email?.[0] || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {website.publisher.firstName || website.publisher.email?.split('@')[0] || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500">{website.publisher.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{website.category?.name || 'General'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">DA: {website.domainAuthority || 'N/A'}</p>
                              <p className="text-gray-600">
                                {website.monthlyTraffic ? `${(website.monthlyTraffic / 1000).toFixed(0)}k/mo` : 'Traffic N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${website.pricePerPost}</TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(website.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedWebsite(website)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Review Website: {website.url}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Domain Authority</Label>
                                        <p className="text-sm text-gray-600">{website.domainAuthority || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Monthly Traffic</Label>
                                        <p className="text-sm text-gray-600">{website.monthlyTraffic?.toLocaleString() || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Language</Label>
                                        <p className="text-sm text-gray-600">{website.language || 'English'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Link Type</Label>
                                        <p className="text-sm text-gray-600">{website.linkType || 'DoFollow'}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Description</Label>
                                      <p className="text-sm text-gray-600 mt-1">{website.description || 'No description provided'}</p>
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                      <Button
                                        onClick={() => approveWebsiteMutation.mutate(website.id)}
                                        disabled={approveWebsiteMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="destructive">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Reject Website</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label htmlFor="reason">Reason for rejection</Label>
                                              <Textarea
                                                id="reason"
                                                placeholder="Please provide a clear reason for rejection..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                rows={3}
                                              />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                              <Button variant="outline" onClick={() => setRejectionReason("")}>
                                                Cancel
                                              </Button>
                                              <Button 
                                                variant="destructive" 
                                                onClick={handleReject}
                                                disabled={rejectWebsiteMutation.isPending}
                                              >
                                                {rejectWebsiteMutation.isPending ? "Rejecting..." : "Reject Website"}
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-6">
              <AdminOrderApproval />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}