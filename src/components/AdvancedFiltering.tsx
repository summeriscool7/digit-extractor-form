
import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import FileUpload from "./FileUpload";
import { extractNumbersFromCSV } from "@/utils/csvParser";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Filter,
  Search,
  Calculator,
  Hash,
  Star,
  X,
  Repeat,
  Infinity,
  Settings,
  Download,
  Trash2,
  PlusCircle,
  MinusCircle,
  Superscript,
  MousePointerSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type FilterOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const filterOptions: FilterOption[] = [
  { id: "search", label: "Search", description: "Search for specific digits", icon: <Search className="h-4 w-4" /> },
  { id: "pattern", label: "Patterns", description: "Find numbers with patterns", icon: <Hash className="h-4 w-4" /> },
  { id: "sum", label: "Digit Sum", description: "Filter by digit sum", icon: <Calculator className="h-4 w-4" /> },
  { id: "preference", label: "Preferences", description: "Digit preferences", icon: <Settings className="h-4 w-4" /> },
  { id: "special", label: "Special", description: "Special number types", icon: <Star className="h-4 w-4" /> },
];

const patternTypes = [
  { id: "mirror", label: "Mirror", example: "1221, 5665" },
  { id: "repeating", label: "Repeating", example: "7777, 8888" },
  { id: "sequential", label: "Sequential", example: "1234, 6789" },
  { id: "ending", label: "Ending with", example: "xxx0000" },
  { id: "penta", label: "Penta", example: "Five same digits" },
  { id: "hexa", label: "Hexa", example: "Six same digits" },
  { id: "tetra", label: "Tetra", example: "Four same digits" },
];

// Special number types
const specialNumberTypes = [
  { id: "fancy", label: "Fancy", description: "Special combinations like 786xxx, 111x" },
  { id: "xy", label: "XY Pattern", description: "Numbers following AB-AB-AB pattern" },
  { id: "rising", label: "Rising", description: "Digits increasing throughout" },
  { id: "falling", label: "Falling", description: "Digits decreasing throughout" },
];

// Function to check if a number is mirrored (palindrome)
const isMirror = (num: string): boolean => {
  return num === num.split("").reverse().join("");
};

// Function to check if a number has repeating sequences
const hasRepeatingSequence = (num: string, length = 4): boolean => {
  for (let i = 0; i <= num.length - length; i++) {
    const pattern = num.substring(i, i + length);
    if (pattern === pattern[0].repeat(length)) {
      return true;
    }
  }
  return false;
};

// Function to check if a number is sequential
const isSequential = (num: string, length = 4): boolean => {
  for (let i = 0; i <= num.length - length; i++) {
    const slice = num.substring(i, i + length);
    let isSeq = true;
    for (let j = 1; j < slice.length; j++) {
      if (parseInt(slice[j]) !== (parseInt(slice[j - 1]) + 1) % 10) {
        isSeq = false;
        break;
      }
    }
    if (isSeq) return true;
  }
  return false;
};

// Function to check if a number follows XY pattern (like 121212, 787878)
const hasXYPattern = (num: string): boolean => {
  if (num.length < 6) return false;
  
  // Check for patterns like ABABAB or ABCABC
  for (let patternLength = 2; patternLength <= 3; patternLength++) {
    if (num.length % patternLength !== 0) continue;
    
    const pattern = num.substring(0, patternLength);
    let isXY = true;
    
    for (let i = patternLength; i < num.length; i += patternLength) {
      if (num.substring(i, i + patternLength) !== pattern) {
        isXY = false;
        break;
      }
    }
    
    if (isXY) return true;
  }
  
  return false;
};

// Function to check if digits are consistently rising
const hasRisingDigits = (num: string): boolean => {
  for (let i = 1; i < num.length; i++) {
    if (parseInt(num[i]) <= parseInt(num[i-1])) {
      return false;
    }
  }
  return true;
};

// Function to check if digits are consistently falling
const hasFallingDigits = (num: string): boolean => {
  for (let i = 1; i < num.length; i++) {
    if (parseInt(num[i]) >= parseInt(num[i-1])) {
      return false;
    }
  }
  return true;
};

// Function to check if a number ends with a specific pattern
const endsWithPattern = (num: string, pattern: string): boolean => {
  return num.endsWith(pattern);
};

// Function to calculate the digit sum
const calculateDigitSum = (num: string): number => {
  return num.split("").reduce((sum, digit) => sum + parseInt(digit), 0);
};

// Function to calculate the single digit sum (keep adding until single digit)
const calculateSingleDigitSum = (num: string): number => {
  let sum = calculateDigitSum(num);
  while (sum > 9) {
    sum = sum
      .toString()
      .split("")
      .reduce((s, d) => s + parseInt(d), 0);
  }
  return sum;
};

// Function to check if a number is fancy (special combinations)
const isFancyNumber = (num: string): boolean => {
  // Common fancy patterns in Indian context
  if (num.startsWith("786")) return true;  // Considered lucky
  if (num.includes("111") || num.includes("222") || num.includes("333")) return true;
  if (num.includes("555") || num.includes("777") || num.includes("888") || num.includes("999")) return true;
  
  // Check for consecutive pairs
  for (let i = 0; i < num.length - 3; i++) {
    if (num[i] === num[i+1] && num[i+2] === num[i+3]) return true;
  }
  
  return false;
};

// Function to check digit preferences (contains/doesn't contain specific digits)
const matchesDigitPreferences = (
  num: string,
  luckyDigits: string[],
  unluckyDigits: string[]
): boolean => {
  // Must contain all lucky digits
  if (luckyDigits.length > 0) {
    const hasAllLucky = luckyDigits.every((digit) => num.includes(digit));
    if (!hasAllLucky) return false;
  }

  // Must not contain any unlucky digits
  if (unluckyDigits.length > 0) {
    const hasNoUnlucky = unluckyDigits.every((digit) => !num.includes(digit));
    if (!hasNoUnlucky) return false;
  }

  return true;
};

const AdvancedFiltering: React.FC = () => {
  const [extractedNumbers, setExtractedNumbers] = useState<string[]>([]);
  const [filteredNumbers, setFilteredNumbers] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("mirror");
  const [endingPattern, setEndingPattern] = useState("0000");
  const [exactDigitSum, setExactDigitSum] = useState("");
  const [selectedSpecialType, setSelectedSpecialType] = useState("fancy");
  const [useSingleDigitSum, setUseSingleDigitSum] = useState(false);
  const [luckyDigits, setLuckyDigits] = useState<string[]>([]);
  const [unluckyDigits, setUnluckyDigits] = useState<string[]>([]);
  const [tempLuckyDigit, setTempLuckyDigit] = useState("");
  const [tempUnluckyDigit, setTempUnluckyDigit] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterProgress, setFilterProgress] = useState(0);

  const handleFileProcessed = useCallback((numbers: string[]) => {
    setExtractedNumbers(numbers);
    setFilteredNumbers(numbers);
    toast({
      title: "CSV Processed",
      description: `${numbers.length} valid numbers found`,
    });
  }, []);

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const addLuckyDigit = () => {
    if (tempLuckyDigit && !luckyDigits.includes(tempLuckyDigit)) {
      setLuckyDigits([...luckyDigits, tempLuckyDigit]);
      setTempLuckyDigit("");
    }
  };

  const removeLuckyDigit = (digit: string) => {
    setLuckyDigits(luckyDigits.filter((d) => d !== digit));
  };

  const addUnluckyDigit = () => {
    if (tempUnluckyDigit && !unluckyDigits.includes(tempUnluckyDigit)) {
      setUnluckyDigits([...unluckyDigits, tempUnluckyDigit]);
      setTempUnluckyDigit("");
    }
  };

  const removeUnluckyDigit = (digit: string) => {
    setUnluckyDigits(unluckyDigits.filter((d) => d !== digit));
  };

  const applyFilters = useCallback(() => {
    if (extractedNumbers.length === 0) {
      toast({
        title: "No numbers to filter",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsFiltering(true);
    setFilterProgress(0);

    // Use a web worker or batched processing for large arrays
    const batchSize = 1000;
    const totalBatches = Math.ceil(extractedNumbers.length / batchSize);
    let currentBatch = 0;
    let results: string[] = [];

    const processBatch = () => {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, extractedNumbers.length);
      const batch = extractedNumbers.slice(start, end);

      const batchResults = batch.filter((number) => {
        // Apply global search filter
        if (activeFilters.includes("search") && searchQuery) {
          if (!number.includes(searchQuery)) return false;
        }

        // Apply pattern filters
        if (activeFilters.includes("pattern")) {
          if (selectedPattern === "mirror" && !isMirror(number)) return false;
          if (selectedPattern === "repeating" && !hasRepeatingSequence(number)) return false;
          if (selectedPattern === "sequential" && !isSequential(number)) return false;
          if (selectedPattern === "ending" && !endsWithPattern(number, endingPattern)) return false;
          if (selectedPattern === "penta" && !hasRepeatingSequence(number, 5)) return false;
          if (selectedPattern === "hexa" && !hasRepeatingSequence(number, 6)) return false;
          if (selectedPattern === "tetra" && !hasRepeatingSequence(number, 4)) return false;
        }

        // Apply digit sum filter - Now using exact digit sum
        if (activeFilters.includes("sum") && exactDigitSum) {
          const targetSum = parseInt(exactDigitSum);
          const sum = useSingleDigitSum
            ? calculateSingleDigitSum(number)
            : calculateDigitSum(number);
          if (sum !== targetSum) return false;
        }

        // Apply digit preferences
        if (activeFilters.includes("preference")) {
          if (!matchesDigitPreferences(number, luckyDigits, unluckyDigits)) return false;
        }
        
        // Apply special filters
        if (activeFilters.includes("special")) {
          if (selectedSpecialType === "fancy" && !isFancyNumber(number)) return false;
          if (selectedSpecialType === "xy" && !hasXYPattern(number)) return false;
          if (selectedSpecialType === "rising" && !hasRisingDigits(number)) return false;
          if (selectedSpecialType === "falling" && !hasFallingDigits(number)) return false;
        }

        return true;
      });

      results = [...results, ...batchResults];
      currentBatch++;
      
      const progress = Math.min(100, Math.round((currentBatch / totalBatches) * 100));
      setFilterProgress(progress);

      if (currentBatch < totalBatches) {
        // Use setTimeout to avoid blocking the main thread
        setTimeout(processBatch, 0);
      } else {
        setFilteredNumbers(results);
        setIsFiltering(false);
        toast({
          title: "Filtering Complete",
          description: `Found ${results.length} matching numbers out of ${extractedNumbers.length}`,
        });
      }
    };

    // Start processing
    processBatch();
  }, [
    extractedNumbers,
    activeFilters,
    searchQuery,
    selectedPattern,
    endingPattern,
    exactDigitSum,
    selectedSpecialType,
    useSingleDigitSum,
    luckyDigits,
    unluckyDigits,
  ]);

  const downloadFilteredCSV = useCallback(() => {
    if (filteredNumbers.length === 0) {
      toast({
        title: "No numbers to download",
        description: "Apply filters first to get results",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content with digit sums
    let csvContent = "Number,Digit Sum,Single Digit Sum\n";
    filteredNumbers.forEach(number => {
      const digitSum = calculateDigitSum(number);
      const singleDigitSum = calculateSingleDigitSum(number);
      csvContent += `${number},${digitSum},${singleDigitSum}\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_numbers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: `Downloading ${filteredNumbers.length} numbers with digit sums`,
    });
  }, [filteredNumbers]);

  const resetFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery("");
    setSelectedPattern("mirror");
    setEndingPattern("0000");
    setExactDigitSum("");
    setSelectedSpecialType("fancy");
    setUseSingleDigitSum(false);
    setLuckyDigits([]);
    setUnluckyDigits([]);
    setFilteredNumbers(extractedNumbers);
  }, [extractedNumbers]);

  // Memoize the filter cards to avoid unnecessary re-renders
  const filterCards = useMemo(() => {
    return filterOptions.map((option) => (
      <Toggle
        key={option.id}
        pressed={activeFilters.includes(option.id)}
        onPressedChange={() => toggleFilter(option.id)}
        className={`flex-1 flex flex-col items-center justify-center gap-2 h-24 text-center ${
          activeFilters.includes(option.id)
            ? "border-primary"
            : "border-muted"
        }`}
        variant="outline"
      >
        <div className="rounded-full bg-muted/80 p-2">{option.icon}</div>
        <div>
          <p className="font-medium text-sm">{option.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {option.description}
          </p>
        </div>
      </Toggle>
    ));
  }, [activeFilters]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold mb-3">Advanced Number Filtering</h1>
        <p className="text-muted-foreground">
          Upload a CSV file, apply filters, and find the perfect numbers
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 mb-6">
        <FileUpload
          onFileProcessed={handleFileProcessed}
          extractNumbers={extractNumbersFromCSV}
        />

        {extractedNumbers.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-md border animate-fade-in">
            <p className="font-medium text-sm">
              Extracted {extractedNumbers.length} numbers from CSV
            </p>
          </div>
        )}
      </div>

      {extractedNumbers.length > 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {filterCards}
            </div>

            {/* Filter controls */}
            <div className="space-y-6 mt-8">
              {/* Search filter */}
              {activeFilters.includes("search") && (
                <div className="p-4 rounded-lg border border-dashed animate-fade-in">
                  <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search by Digits
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="search-query">Search for numbers containing:</Label>
                      <Input
                        id="search-query"
                        type="text"
                        placeholder="E.g., 786, 555, etc."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pattern filter */}
              {activeFilters.includes("pattern") && (
                <div className="p-4 rounded-lg border border-dashed animate-fade-in">
                  <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Number Patterns
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pattern-type">Pattern Type:</Label>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={selectedPattern}
                        onValueChange={(value) => {
                          if (value) setSelectedPattern(value);
                        }}
                        className="mt-1 flex flex-wrap gap-2"
                      >
                        {patternTypes.map((type) => (
                          <ToggleGroupItem
                            key={type.id}
                            value={type.id}
                            aria-label={type.label}
                            className="text-xs"
                          >
                            {type.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    {selectedPattern === "ending" && (
                      <div>
                        <Label htmlFor="ending-pattern">Ending with:</Label>
                        <Input
                          id="ending-pattern"
                          value={endingPattern}
                          onChange={(e) => setEndingPattern(e.target.value)}
                          placeholder="E.g., 0000"
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div className="bg-muted/40 rounded p-3 text-xs">
                      <span className="font-medium">Example: </span>
                      {patternTypes.find((p) => p.id === selectedPattern)?.example}
                    </div>
                  </div>
                </div>
              )}

              {/* Digit Sum filter - Updated to use exact sum */}
              {activeFilters.includes("sum") && (
                <div className="p-4 rounded-lg border border-dashed animate-fade-in">
                  <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Digit Sum
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-single-digit"
                        checked={useSingleDigitSum}
                        onCheckedChange={setUseSingleDigitSum}
                      />
                      <Label htmlFor="use-single-digit">
                        Use single digit sum (e.g., 7777 = 28 = 10 = 1)
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="exact-digit-sum">Exact Digit Sum:</Label>
                      <Input
                        id="exact-digit-sum"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Enter the exact sum to find"
                        value={exactDigitSum}
                        onChange={(e) => setExactDigitSum(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Special number types */}
              {activeFilters.includes("special") && (
                <div className="p-4 rounded-lg border border-dashed animate-fade-in">
                  <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Special Number Types
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="special-type">Special Type:</Label>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={selectedSpecialType}
                        onValueChange={(value) => {
                          if (value) setSelectedSpecialType(value);
                        }}
                        className="mt-1 flex flex-wrap gap-2"
                      >
                        {specialNumberTypes.map((type) => (
                          <ToggleGroupItem
                            key={type.id}
                            value={type.id}
                            aria-label={type.label}
                            className="text-xs"
                          >
                            {type.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                    <div className="bg-muted/40 rounded p-3 text-xs">
                      <span className="font-medium">Description: </span>
                      {specialNumberTypes.find((p) => p.id === selectedSpecialType)?.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Digit Preferences filter */}
              {activeFilters.includes("preference") && (
                <div className="p-4 rounded-lg border border-dashed animate-fade-in">
                  <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Digit Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        Lucky Digits (must contain)
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="text"
                          placeholder="Add digit"
                          value={tempLuckyDigit}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            if (value.length <= 1) setTempLuckyDigit(value);
                          }}
                          maxLength={1}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addLuckyDigit}
                          disabled={!tempLuckyDigit}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {luckyDigits.map((digit) => (
                          <div
                            key={digit}
                            className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm"
                          >
                            {digit}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-green-700 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400"
                              onClick={() => removeLuckyDigit(digit)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5 text-red-500" />
                        Unlucky Digits (must not contain)
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="text"
                          placeholder="Add digit"
                          value={tempUnluckyDigit}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            if (value.length <= 1) setTempUnluckyDigit(value);
                          }}
                          maxLength={1}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addUnluckyDigit}
                          disabled={!tempUnluckyDigit}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {unluckyDigits.map((digit) => (
                          <div
                            key={digit}
                            className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded text-sm"
                          >
                            {digit}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-red-700 dark:text-red-400 hover:text-red-500 dark:hover:text-red-400"
                              onClick={() => removeUnluckyDigit(digit)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/50 mt-8 pt-6 flex flex-wrap gap-3 justify-between">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Reset Filters
              </Button>
              <Button
                onClick={applyFilters}
                disabled={isFiltering}
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {isFiltering && (
            <div className="my-4 space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span>Filtering numbers...</span>
                <span>{filterProgress}%</span>
              </div>
              <Progress value={filterProgress} />
            </div>
          )}

          {/* Results Section - Updated to show digit sums */}
          {filteredNumbers.length > 0 && !isFiltering && (
            <div className="rounded-xl border bg-card shadow-sm p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Filtered Results ({filteredNumbers.length})
                </h2>
                <Button
                  onClick={downloadFilteredCSV}
                  variant="outline"
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead className="w-[100px] text-right">Digit Sum</TableHead>
                      <TableHead className="w-[120px] text-right">Single Digit Sum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNumbers.slice(0, 100).map((number, idx) => {
                      const digitSum = calculateDigitSum(number);
                      const singleDigitSum = calculateSingleDigitSum(number);
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{idx + 1}</TableCell>
                          <TableCell className="font-mono">{number}</TableCell>
                          <TableCell className="font-mono text-right">{digitSum}</TableCell>
                          <TableCell className="font-mono text-right">{singleDigitSum}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredNumbers.length > 100 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing 100 of {filteredNumbers.length} results. Download the CSV to see all numbers.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFiltering;
