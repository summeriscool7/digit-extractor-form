
interface SearchNumbersRequest {
  pincode: string;
  mobileNumber: string;
  numsArray: string[];
  category: string;
}

interface SearchNumbersResponse {
  status: string;
  message: string;
}

/**
 * Sends a request to the backend to search for numbers
 * @param data - The request data containing pincode, mobileNumber, numsArray, and category
 * @returns Promise resolving to the response from the server
 */
export const searchNumbers = async (data: SearchNumbersRequest): Promise<SearchNumbersResponse> => {
  try {
    // For very large arrays, consider sending in batches if needed
    // But for now we'll just send the whole array as JSON
    
    // Use a more efficient fetch with proper error handling
    const response = await fetch('/api/search-numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
};
