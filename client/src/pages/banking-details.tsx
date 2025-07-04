import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBankingDetailsSchema } from "@shared/schema";

const bankingDetailsFormSchema = insertBankingDetailsSchema.extend({
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankAccountNumber: z.string().min(10, "Bank account number must be at least 10 digits").max(20, "Bank account number must be at most 20 digits"),
  ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters"),
  bankName: z.string().min(1, "Bank name is required"),
  accountType: z.enum(["savings", "current", "business"])
});

type BankingDetailsForm = z.infer<typeof bankingDetailsFormSchema>;

export default function BankingDetails() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bankingDetails, isLoading } = useQuery({
    queryKey: ["/api/banking-details"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<BankingDetailsForm>({
    resolver: zodResolver(bankingDetailsFormSchema),
    defaultValues: {
      accountHolderName: (bankingDetails as any)?.accountHolderName || "",
      bankAccountNumber: (bankingDetails as any)?.bankAccountNumber || "",
      ifscCode: (bankingDetails as any)?.ifscCode || "",
      bankName: (bankingDetails as any)?.bankName || "",
      accountType: (bankingDetails as any)?.accountType || "savings",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BankingDetailsForm) => {
      const response = await fetch("/api/banking-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to save banking details");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking details saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/banking-details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BankingDetailsForm) => {
      const response = await fetch("/api/banking-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update banking details");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/banking-details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BankingDetailsForm) => {
    if (bankingDetails) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
            <CardDescription>
              Add your banking details to receive payments for your guest posts. All information is securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name as per bank records" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your bank account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., SBIN0001234" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : bankingDetails
                    ? "Update Banking Details"
                    : "Save Banking Details"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}