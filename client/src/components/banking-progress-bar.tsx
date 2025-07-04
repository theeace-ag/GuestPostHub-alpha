import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, AlertCircle } from "lucide-react";

interface BankingProgressBarProps {
  user: any;
}

export function BankingProgressBar({ user }: BankingProgressBarProps) {
  const hasBankingDetails = user?.hasBankingDetails || false;
  const progress = hasBankingDetails ? 100 : 0;

  if (hasBankingDetails) {
    return (
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Banking details completed
              </span>
            </div>
            <Link href="/banking-details">
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-orange-50 border-orange-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                Complete your banking details to receive payments
              </span>
            </div>
            <Link href="/banking-details">
              <Button variant="outline" size="sm">
                Add Details
              </Button>
            </Link>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-orange-600">
            Add your banking details to start receiving payments for your guest posts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}