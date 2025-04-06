/**
 * Service for communicating with the Flask backend for 3D model generation
 */

// Base URL for the API
const API_BASE_URL = 'http://localhost:4000/api';

// Types
export interface ModelGenerationRequest {
  prompt: string;
  webhook_url?: string;
  negative_prompt?: string;
  art_style?: string;
}

export interface ModelGenerationResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  prompt: string;
  model_urls: {
    preview?: {
      remote: string;
      local: string;
      url: string;
    },
    refined?: {
      remote: string;
      local: string;
      url: string;
    }
  } | null;
  error: string | null;
}

// Helper function to handle fetch errors
const handleFetchResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
};

// Service functions
export const apiService = {
  /**
   * Generate a 3D model based on a text prompt
   */
  async generateModel(request: ModelGenerationRequest): Promise<ModelGenerationResponse> {
    try {
      console.log('Generating model with prompt:', request.prompt);
      
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error generating model:', error);
      throw error;
    }
  },

  /**
   * Check the status of a model generation job
   */
  async checkJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
      const data = await handleFetchResponse(response);
      
      // Validate and log model URLs when available
      if (data.status === 'COMPLETED' && data.model_urls) {
        console.log('Model URLs received:', data.model_urls);
        
        // Add validation for model URLs
        if (data.model_urls.refined && !data.model_urls.refined.url) {
          console.error('Invalid refined model URL in response');
          throw new Error('Invalid model URL received from server');
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  },

  /**
   * Clean up old model files to save space
   */
  async cleanupOldModels(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanup`, {
        method: 'POST',
      });

      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error cleaning up models:', error);
      throw error;
    }
  },

  /**
   * Send a message to the AI chat assistant
   */
  async sendChatMessage(messages: { role: string; content: string }[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },

  /**
   * Generate a design summary from conversation history
   */
  async generateDesignSummary(conversation: { role: string; content: string }[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation }),
      });

      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error generating design summary:', error);
      throw error;
    }
  }
};