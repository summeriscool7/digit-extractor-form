
/**
 * Extracts all 10-digit numbers from a CSV file with chunking for large files
 * @param file - The CSV file to parse
 * @returns Promise resolving to an array of 10-digit numbers
 */
export const extractNumbersFromCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // Always use chunking for files over 2MB
    const useChunking = file.size > 2 * 1024 * 1024;
    const numbersArray: string[] = [];
    const tenDigitNumberRegex = /^[6-9]\d{9}$/;
    
    if (useChunking) {
      // Use FileReader with chunking for large files
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      let offset = 0;
      let processNextChunk = true;
      let lastPartialRow = '';
      
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
          
          // Process the chunk with handling for partial rows
          let chunkContent = lastPartialRow + chunk;
          
          // Check if the chunk ends with a complete row
          const lastNewlineIndex = chunkContent.lastIndexOf('\n');
          if (lastNewlineIndex !== -1 && lastNewlineIndex < chunkContent.length - 1) {
            // Save partial row for next chunk
            lastPartialRow = chunkContent.substring(lastNewlineIndex + 1);
            chunkContent = chunkContent.substring(0, lastNewlineIndex);
          } else {
            lastPartialRow = '';
          }
          
          // Split by common delimiters (comma, line break, tab, space)
          const rows = chunkContent.split(/[\r\n,\t ]+/);
          
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
            // Use setTimeout to avoid blocking the main thread
            setTimeout(processChunk, 0);
          } else {
            // Process the last partial row if any
            if (lastPartialRow) {
              const trimmed = lastPartialRow.trim();
              if (tenDigitNumberRegex.test(trimmed)) {
                numbersArray.push(trimmed);
              }
            }
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
