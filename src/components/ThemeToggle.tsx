
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-center">
      <ToggleGroup 
        type="single" 
        value={theme} 
        onValueChange={(value: string) => {
          if (value) toggleTheme();
        }}
        className="border rounded-lg"
      >
        <ToggleGroupItem value="light" aria-label="Toggle light mode">
          <Sun className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">Light</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Toggle dark mode">
          <Moon className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">Dark</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
