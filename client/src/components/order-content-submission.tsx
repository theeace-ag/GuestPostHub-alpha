import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, ExternalLink } from "lucide-react";

const contentSubmissionSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Content must be under 2000 characters"),
  requirements: z.string().min(1, "Requirements are required"),
  targetKeywords: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const publisherSubmissionSchema = z.object({
  publishedUrl: z.string().url("Please enter a valid URL"),
  publisherNotes: z.string().optional(),
});

type ContentSubmissionForm = z.infer<typeof contentSubmissionSchema>;
type PublisherSubmissionForm = z.infer<typeof publisherSubmissionSchema>;

interface OrderContentSubmissionProps {
  order: any;
  userRole: string;
}

export function OrderContentSubmission({ order, userRole }: OrderContentSubmissionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentForm = useForm<ContentSubmissionForm>({
    resolver: zodResolver(contentSubmissionSchema),
    defaultValues: {
      content: order.content || "",
      requirements: order.requirements || "",
      targetKeywords: order.targetKeywords || "",
      additionalNotes: order.additionalNotes || "",
    },
  });

  const publisherForm = useForm<PublisherSubmissionForm>({
    resolver: zodResolver(publisherSubmissionSchema),
    defaultValues: {
      publishedUrl: order.publishedUrl || "",
      publisherNotes: order.publisherNotes || "",
    },
  });

  const submitContentMutation = useMutation({
    mutationFn: async (data: ContentSubmissionForm) => {
      const response = await fetch(`/api/orders/${order.id}/submit-content`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to submit content");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Submitted",
        description: "Your content and requirements have been submitted to the publisher.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const submitPublisherMutation = useMutation({
    mutationFn: async (data: PublisherSubmissionForm) => {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "submitted",
          publisherSubmittedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit completion");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Submitted",
        description: "Your guest post has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmitContent = (data: ContentSubmissionForm) => {
    setIsSubmitting(true);
    submitContentMutation.mutate(data);
  };

  const onSubmitPublisher = (data: PublisherSubmissionForm) => {
    setIsSubmitting(true);
    submitPublisherMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "content_submitted":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "submitted":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "content_submitted":
        return "Content Submitted";
      case "in_progress":
        return "In Progress";
      case "submitted":
        return "Submitted for Review";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            <CardDescription>
              Website: {order.website?.url}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Amount:</span> ₹{order.amount}
          </div>
          <div>
            <span className="font-medium">Platform Fee:</span> ₹{order.platformFee}
          </div>
          <div>
            <span className="font-medium">Total:</span> ₹{order.totalAmount}
          </div>
          <div>
            <span className="font-medium">Content Writing:</span> {order.needsContent ? "Yes" : "No"}
          </div>
        </div>

        {/* Buyer Content Submission */}
        {userRole === "buyer" && order.status === "pending" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Submit Content & Requirements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Content & Requirements</DialogTitle>
                <DialogDescription>
                  Provide your content and requirements for the guest post. Maximum 2000 characters.
                </DialogDescription>
              </DialogHeader>
              <Form {...contentForm}>
                <form onSubmit={contentForm.handleSubmit(onSubmitContent)} className="space-y-4">
                  <FormField
                    control={contentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your blog post content here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-sm text-gray-500">
                          {field.value?.length || 0}/2000 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter specific requirements for the guest post..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="targetKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter target keywords (comma separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional notes or instructions..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Content"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Publisher Submission */}
        {userRole === "publisher" && order.status === "content_submitted" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Submit Completed Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Completed Guest Post</DialogTitle>
                <DialogDescription>
                  Provide the URL of the published guest post.
                </DialogDescription>
              </DialogHeader>
              <Form {...publisherForm}>
                <form onSubmit={publisherForm.handleSubmit(onSubmitPublisher)} className="space-y-4">
                  <FormField
                    control={publisherForm.control}
                    name="publishedUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Published URL *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/guest-post"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={publisherForm.control}
                    name="publisherNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any notes about the published post..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Completion"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Show published URL if available */}
        {order.publishedUrl && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Published at:</span>
            <a
              href={order.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {order.publishedUrl}
            </a>
          </div>
        )}

        {/* Show content if submitted */}
        {order.content && (
          <div className="space-y-2">
            <h4 className="font-medium">Submitted Content:</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">{order.content}</p>
            </div>
          </div>
        )}

        {/* Show requirements if submitted */}
        {order.requirements && (
          <div className="space-y-2">
            <h4 className="font-medium">Requirements:</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">{order.requirements}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}