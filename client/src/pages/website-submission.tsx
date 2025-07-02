import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Globe, ArrowLeft, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";

const websiteSubmissionSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  categoryId: z.coerce.number().min(1, "Please select a category"),
  domainAuthority: z.coerce.number().min(1).max(100).optional(),
  domainRating: z.coerce.number().min(1).max(100).optional(),
  monthlyTraffic: z.coerce.number().min(0).optional(),
  language: z.string().min(1, "Please select a language"),
  linkType: z.string().min(1, "Please select a link type"),
  postDuration: z.string().min(1, "Please select post duration"),
  pricePerPost: z.coerce.number().min(1, "Price must be at least $1"),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

type WebsiteSubmissionForm = z.infer<typeof websiteSubmissionSchema>;

export default function WebsiteSubmission() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated or not publisher
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'publisher')) {
      toast({
        title: "Unauthorized",
        description: "Publisher access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
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

  const form = useForm<WebsiteSubmissionForm>({
    resolver: zodResolver(websiteSubmissionSchema),
    defaultValues: {
      url: "",
      categoryId: 0,
      domainAuthority: undefined,
      domainRating: undefined,
      monthlyTraffic: undefined,
      language: "en",
      linkType: "dofollow",
      postDuration: "permanent",
      pricePerPost: 0,
      description: "",
    },
  });

  const submitWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteSubmissionForm) => {
      await apiRequest("POST", "/api/websites", data);
    },
    onSuccess: () => {
      toast({
        title: "Website Submitted",
        description: "Your website has been submitted for review. You'll be notified once it's approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/websites"] });
      setLocation("/publisher");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WebsiteSubmissionForm) => {
    // Convert number to string for decimal field
    const formData = {
      ...data,
      pricePerPost: data.pricePerPost.toString()
    };
    submitWebsiteMutation.mutate(formData);
  };

  if (isLoading || !isAuthenticated || user?.role !== 'publisher') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/publisher">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Website for Review</h1>
            <p className="text-gray-600">
              Add your website to our marketplace. All submissions are manually reviewed to ensure quality.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Website Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your website, its content, audience, and what makes it valuable for guest posting..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* SEO Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">SEO Metrics</h3>
                    <p className="text-sm text-gray-600">
                      Provide accurate metrics to help buyers make informed decisions.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="domainAuthority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Authority (DA)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 45" 
                                min="1" 
                                max="100"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="domainRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Rating (DR)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 42" 
                                min="1" 
                                max="100"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="monthlyTraffic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Organic Traffic</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 50000" 
                              min="0"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Publishing Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Publishing Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                                <SelectItem value="pt">Portuguese</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select link type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dofollow">Dofollow</SelectItem>
                                <SelectItem value="nofollow">Nofollow</SelectItem>
                                <SelectItem value="mixed">Mixed (Case by case)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="postDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Duration *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How long will the post stay live?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="permanent">Permanent</SelectItem>
                              <SelectItem value="12_months">12 Months</SelectItem>
                              <SelectItem value="6_months">6 Months</SelectItem>
                              <SelectItem value="3_months">3 Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
                    
                    <FormField
                      control={form.control}
                      name="pricePerPost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Guest Post (USD) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                              <Input 
                                type="number" 
                                placeholder="50" 
                                className="pl-8"
                                min="1"
                                step="0.01"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Guidelines */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submission Guidelines
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your website must have original, high-quality content</li>
                      <li>• Ensure your website is regularly updated and maintained</li>
                      <li>• Provide accurate metrics - we verify all submissions</li>
                      <li>• Adult content, gambling, and illegal content are not allowed</li>
                      <li>• Review process typically takes 1-3 business days</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Link href="/publisher">
                      <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button 
                      type="submit" 
                      disabled={submitWebsiteMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {submitWebsiteMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit for Review'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
