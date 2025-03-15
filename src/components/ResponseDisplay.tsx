
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ResponseDisplayProps {
  response: {
    status: string;
    message: string;
  } | null;
  isLoading: boolean;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden border animate-pulse-subtle">
        <CardHeader className="pb-3">
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded mt-2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
          <div className="h-4 w-4/5 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return null;
  }

  const isSuccess = response.status === "success";

  return (
    <Card className="w-full overflow-hidden border animate-slide-up">
      <CardHeader className={`pb-3 ${isSuccess ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"}`}>
        <div className="flex items-center space-x-2">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <CardTitle className={isSuccess ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
            {isSuccess ? "Success" : "Error"}
          </CardTitle>
        </div>
        <CardDescription>
          Response from the server
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div>
            <span className="font-medium text-sm">Status:</span>
            <span className="ml-2 text-sm">{response.status}</span>
          </div>
          <div>
            <span className="font-medium text-sm">Message:</span>
            <span className="ml-2 text-sm">{response.message}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseDisplay;
