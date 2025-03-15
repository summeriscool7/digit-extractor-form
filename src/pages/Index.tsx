
import React from "react";
import NumberForm from "@/components/NumberForm";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4 py-16">
      <div className="w-full max-w-4xl">
        <NumberForm />
        
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
