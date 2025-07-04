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

  // Check admin permission
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "This portal requires admin privileges",
        variant: "destructive",
      });
    }
  }, [user, isLoading, toast]);

  const { data: pendingWebsites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/admin/websites/pending"],
    enabled: !!user && user.role === 'admin',
  });

  const approveWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      return await apiRequest("PATCH", `/api/admin/websites/${websiteId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Website Approved",
        description: "The website has been approved and is now live in the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/websites/pending"] });
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
      return await apiRequest("PATCH", `/api/admin/websites/${websiteId}/reject`, { reason });
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

  const filteredWebsites = (pendingWebsites as any[]).filter((website: any) =>
    website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.publisher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !isAuthenticated || (user as any)?.role !== 'admin') {
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
                    <p className="text-sm text-gray-600">Pending Websites</p>
                    <p className="text-2xl font-bold text-blue-600">{(pendingWebsites as any[]).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-2xl font-bold text-green-600">+12%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600 h-6 w-6" />
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
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <p className="text-sm text-gray-500">{website.description?.substring(0, 60)}...</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-gray-900">{website.publisher.email}</p>
                                  <p className="text-sm text-gray-500">Publisher</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {website.category?.name || "Uncategorized"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>DA: {website.domainAuthority || "N/A"}</p>
                                  <p>Traffic: {website.monthlyTraffic ? `${website.monthlyTraffic.toLocaleString()}/mo` : "N/A"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">₹{parseFloat(website.pricePerPost).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{website.linkType}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-gray-600">
                                  {new Date(website.createdAt).toLocaleDateString()}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Review
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Review Website: {website.url}</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="font-semibold mb-2">Website Details</h4>
                                            <div className="space-y-2 text-sm">
                                              <p><span className="font-medium">URL:</span> {website.url}</p>
                                              <p><span className="font-medium">Category:</span> {website.category?.name || "None"}</p>
                                              <p><span className="font-medium">Language:</span> {website.language}</p>
                                              <p><span className="font-medium">Link Type:</span> {website.linkType}</p>
                                              <p><span className="font-medium">Post Duration:</span> {website.postDuration}</p>
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold mb-2">Metrics</h4>
                                            <div className="space-y-2 text-sm">
                                              <p><span className="font-medium">Domain Authority:</span> {website.domainAuthority || "N/A"}</p>
                                              <p><span className="font-medium">Domain Rating:</span> {website.domainRating || "N/A"}</p>
                                              <p><span className="font-medium">Monthly Traffic:</span> {website.monthlyTraffic?.toLocaleString() || "N/A"}</p>
                                              <p><span className="font-medium">Price:</span> ₹{parseFloat(website.pricePerPost).toFixed(2)}</p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {website.description && (
                                          <div>
                                            <h4 className="font-semibold mb-2">Description</h4>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                              {website.description}
                                            </p>
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-end space-x-3">
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