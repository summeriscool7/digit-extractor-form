
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
    const response = await fetch('/api/search-numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An error occurred');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
};
