
/**
 * Extracts all 10-digit numbers from a CSV file
 * @param file - The CSV file to parse
 * @returns Promise resolving to an array of 10-digit numbers
 */
export const extractNumbersFromCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const numbersArray: string[] = [];
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
          reject(new Error("Failed to read file content"));
          return;
        }
        
        // Split by common delimiters (comma, line break, tab, space)
        const rows = content.split(/[\r\n,\t ]+/);
        
        // Extract all 10-digit numbers
        const tenDigitNumberRegex = /^[6-9]\d{9}$/;
        
        for (const item of rows) {
          const trimmed = item.trim();
          if (tenDigitNumberRegex.test(trimmed)) {
            numbersArray.push(trimmed);
          }
        }
        
        resolve(numbersArray);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};
