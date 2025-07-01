import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RoleSwitcherProps {
  currentRole?: string;
}

export function RoleSwitcher({ currentRole = 'buyer' }: RoleSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest("POST", "/api/auth/switch-role", { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role Switched",
        description: "Your role has been updated successfully",
      });
      // Force a page reload to apply role changes
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to switch role",
        variant: "destructive",
      });
    },
  });

  const roles = [
    { id: 'buyer', label: 'Buyer', description: 'Purchase guest post placements' },
    { id: 'publisher', label: 'Publisher', description: 'Sell website placements' },
    { id: 'admin', label: 'Admin', description: 'Platform administration' },
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Switch Role</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Current role: <Badge variant="outline">{currentRole}</Badge>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.map((role) => (
          <Button
            key={role.id}
            onClick={() => switchRoleMutation.mutate(role.id)}
            disabled={switchRoleMutation.isPending || currentRole === role.id}
            variant={currentRole === role.id ? "default" : "outline"}
            className="w-full flex flex-col items-start h-auto p-4"
          >
            <span className="font-medium">{role.label}</span>
            <span className="text-xs opacity-75">{role.description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}