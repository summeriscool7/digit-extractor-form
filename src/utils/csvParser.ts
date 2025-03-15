
/**
 * Extracts all 10-digit numbers from a CSV file with chunking for large files
 * @param file - The CSV file to parse
 * @returns Promise resolving to an array of 10-digit numbers
 */
export const extractNumbersFromCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // For very large files (over 10MB), use chunking
    const useChunking = file.size > 10 * 1024 * 1024;
    const numbersArray: string[] = [];
    const tenDigitNumberRegex = /^[6-9]\d{9}$/;
    
    if (useChunking) {
      // Use FileReader with chunking for large files
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      let offset = 0;
      let processNextChunk = true;
      
      // Process the file in chunks
      const processChunk = () => {
        const fileReader = new FileReader();
        const blob = file.slice(offset, offset + chunkSize);
        
        fileReader.onload = (e) => {
          const chunk = e.target?.result as string;
          if (!chunk) {
            processNextChunk = false;
            return;
          }
          
          // Process the chunk
          const rows = chunk.split(/[\r\n,\t ]+/);
          
          // Extract valid numbers from this chunk
          for (const item of rows) {
            const trimmed = item.trim();
            if (tenDigitNumberRegex.test(trimmed)) {
              numbersArray.push(trimmed);
            }
          }
          
          // Move to next chunk if we haven't reached the end of file
          offset += chunkSize;
          if (offset < file.size && processNextChunk) {
            processChunk();
          } else {
            resolve(numbersArray);
          }
        };
        
        fileReader.onerror = () => {
          reject(new Error("Error reading file chunk"));
          processNextChunk = false;
        };
        
        fileReader.readAsText(blob);
      };
      
      // Start processing chunks
      processChunk();
    } else {
      // Use simple FileReader for smaller files
      const reader = new FileReader();
      
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
    }
  });
};
