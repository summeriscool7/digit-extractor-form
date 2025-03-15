
import React, { useState } from "react";
import NumberForm from "@/components/NumberForm";
import AdvancedFiltering from "@/components/AdvancedFiltering";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Index: React.FC = () => {
  const [showAdvancedFiltering, setShowAdvancedFiltering] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced-mode-toggle"
              checked={showAdvancedFiltering}
              onCheckedChange={setShowAdvancedFiltering}
            />
            <Label htmlFor="advanced-mode-toggle" className="cursor-pointer">
              Advanced Filtering Mode
            </Label>
          </div>
        </div>

        {showAdvancedFiltering ? <AdvancedFiltering /> : <NumberForm />}
        
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Number Automation Tool — Designed with precision and elegance
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
