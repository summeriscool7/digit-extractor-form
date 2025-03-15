
import React, { useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractNumbersFromCSV } from "@/utils/csvParser";
import { searchNumbers } from "@/services/api";
import FileUpload from "./FileUpload";
import ResponseDisplay from "./ResponseDisplay";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Define form schema
const formSchema = z.object({
  pincode: z.string().length(6, { message: "Pincode must be exactly 6 digits" }).regex(/^\d+$/, { message: "Pincode must contain only digits" }),
  mobileNumber: z.string().length(10, { message: "Mobile number must be exactly 10 digits" }).regex(/^[6-9]\d{9}$/, { message: "Please enter a valid Indian mobile number" }),
  category: z.enum(["postpaid-free", "postpaid-paid", "prepaid-free", "prepaid-paid"], {
    required_error: "Please select a category",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const NumberForm: React.FC = () => {
  const [extractedNumbers, setExtractedNumbers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<{ status: string; message: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pincode: "",
      mobileNumber: "",
      category: "postpaid-free",
    },
  });

  const handleFileProcessed = useCallback((numbers: string[]) => {
    setExtractedNumbers(numbers);
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (extractedNumbers.length === 0) {
      toast({
        title: "No numbers extracted",
        description: "Please upload a CSV file with valid 10-digit numbers",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    try {
      const result = await searchNumbers({
        pincode: values.pincode,
        mobileNumber: values.mobileNumber,
        numsArray: extractedNumbers,
        category: values.category,
      });

      setResponse(result);
      toast({
        title: "Request processed",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold mb-3">Number Automation Tool</h1>
        <p className="text-muted-foreground">
          Upload a CSV file with mobile numbers and submit to process
        </p>
      </div>

      <div className="bg-white dark:bg-black/40 rounded-2xl p-8 shadow-sm border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit pincode"
                        {...field}
                        className="transition-all focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 10-digit mobile number"
                        {...field}
                        className="transition-all focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="transition-all focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="postpaid-free">Postpaid - Free</SelectItem>
                      <SelectItem value="postpaid-paid">Postpaid - Paid</SelectItem>
                      <SelectItem value="prepaid-free">Prepaid - Free</SelectItem>
                      <SelectItem value="prepaid-paid">Prepaid - Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FileUpload
              onFileProcessed={handleFileProcessed}
              extractNumbers={extractNumbersFromCSV}
            />

            {extractedNumbers.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl border animate-fade-in">
                <p className="font-medium text-sm mb-2">
                  Extracted Numbers ({extractedNumbers.length})
                </p>
                <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground">
                  <p className="font-mono">
                    [{extractedNumbers.slice(0, 5).join(', ')}
                    {extractedNumbers.length > 5 && ', ...'}{extractedNumbers.length > 5 && ` +${extractedNumbers.length - 5} more`}]
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full relative overflow-hidden group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {(isSubmitting || response) && (
        <div className="mt-8">
          <ResponseDisplay response={response} isLoading={isSubmitting} />
        </div>
      )}
    </div>
  );
};

export default NumberForm;
