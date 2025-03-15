
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowUpFromLine, FileIcon, X } from "lucide-react";

interface FileUploadProps {
  onFileProcessed: (numbers: string[]) => void;
  extractNumbers: (file: File) => Promise<string[]>;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, extractNumbers }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const numbers = await extractNumbers(selectedFile);
      onFileProcessed(numbers);
      toast({
        title: "File processed successfully",
        description: `Extracted ${numbers.length} valid numbers`,
      });
    } catch (error) {
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    onFileProcessed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6 w-full">
      <label className="block text-sm font-medium mb-2">CSV File with Phone Numbers</label>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
            ref={fileInputRef}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <ArrowUpFromLine className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                Drag and drop a CSV file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                File should contain 10-digit phone numbers
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-xl p-4 bg-muted/30 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="truncate">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={isProcessing}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {isProcessing && (
            <div className="mt-2">
              <div className="h-1 w-full overflow-hidden bg-muted rounded-full">
                <div className="h-full bg-primary animate-pulse-subtle rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Processing file...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
