"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ModelViewer } from "@/components/model-viewer"
import { apiService } from "@/lib/api-service"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { DesignChat } from "@/components/design-chat"

export default function TShirtCustomizer() {
  // For input field
  const [inputText, setInputText] = useState("")
  // For status and display
  const [currentModelPath, setCurrentModelPath] = useState<string>("/assets/3d/duck.glb")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)

  // Add new state for chat interface
  const [activeTab, setActiveTab] = useState<"input" | "chat">("input")

  // Add this new state for the model viewer key - simplified
  const [modelViewerKey, setModelViewerKey] = useState<number>(Date.now())

  // Simplified model path update function
  const updateModelPath = useCallback((newPath: string) => {
    console.log(`Setting new model path: ${newPath}`);
    
    // Force a new key to ensure the component remounts
    const newKey = Date.now();
    setModelViewerKey(newKey);
    
    // Set the model path directly without cache busting parameters
    setCurrentModelPath(newPath);
    
    setStatusMessage("Model loaded successfully!");
  }, []);

  // Poll for status updates when a job is active
  useEffect(() => {
    if (!activeJobId || !isGenerating) return

    console.log(`Starting status polling for job: ${activeJobId}`);
    const statusInterval = setInterval(async () => {
      try {
        const status = await apiService.checkJobStatus(activeJobId)
        setGenerationProgress(status.progress)
        
        // Update status message based on progress phase
        if (status.progress <= 50) {
          setStatusMessage(`Generating preview model: ${Math.round(status.progress)}%`);
        } else {
          setStatusMessage(`Refining model: ${Math.round(status.progress)}%`);
        }

        // Log complete status object for debugging
        if (status.status === 'COMPLETED') {
          console.log('Job completed. Full status:', status);
        }

        // When job is complete:
        if (status.status === 'COMPLETED' && status.model_urls && status.model_urls.refined) {
          // Mark generation as complete
          setIsGenerating(false);
          clearInterval(statusInterval);
          
          console.log("Model generation completed. Full status:", status);
          
          // IMPORTANT: Set the path with absolute URL to ensure Next.js can find it
          const modelPath = `/generated_models/${activeJobId}_refined.glb`;
          console.log(`Setting model path to: ${modelPath}`);
          
          // Small delay to ensure file is ready
          setTimeout(() => {
            updateModelPath(modelPath);
          }, 2000);
        }
        
        // Even if status is "COMPLETED" but refined model isn't available yet,
        // keep waiting unless there's an error
        
        if (status.status === 'FAILED') {
          console.error('Job failed:', status.error);
          setIsGenerating(false);
          setStatusMessage(`Error: ${status.error || 'Unknown error'}`);
          setModelLoadError(`Job failed: ${status.error || 'Unknown error'}`);
          clearInterval(statusInterval);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        setStatusMessage("Error checking job status");
        
        // We'll continue polling despite errors, as they might be temporary
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      console.log(`Clearing status interval for job: ${activeJobId}`);
      clearInterval(statusInterval);
    }
  }, [activeJobId, isGenerating, updateModelPath]);

  // Function to start model generation with error handling
  const startModelGeneration = async (prompt: string) => {
    if (!prompt.trim()) {
      setStatusMessage("Please enter a description");
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setStatusMessage("Starting model generation...");
      setModelLoadError(null);
      
      // Call the API to generate the model
      const response = await apiService.generateModel({ prompt });
      setActiveJobId(response.job_id);
      setStatusMessage(`Job started: ${response.job_id}`);
      console.log(`New job started: ${response.job_id}`);
    } catch (error) {
      console.error("Error generating model:", error);
      setIsGenerating(false);
      setStatusMessage("Error starting model generation");
      setModelLoadError("Failed to start model generation");
    }
  };

  const handleGenerateModel = async (event: React.FormEvent) => {
    event.preventDefault();
    await startModelGeneration(inputText);
  }

  // Handler for implementing designs
  const handleImplementDesign = async (designSummary: string) => {
    console.log("Implementing design with summary:", designSummary);
    await startModelGeneration(designSummary);
  }

  // Function to retry loading the current model
  const retryLoadModel = () => {
    console.log("Retrying model load...");
    // Reset error state
    setModelLoadError(null);
    // Re-trigger model load with cache busting
    updateModelPath(currentModelPath); // Simplified
  };

  return (
    <div className="flex h-screen w-full overflow-hidden border border-black">
      {/* Left section */}
      <div className="flex w-[480px] border-r border-[#e5e7eb]">
        <Sidebar />
        <div className="w-[420px] flex flex-col">
          {/* Tabs for switching between input form and chat */}
          <div className="flex border-b border-[#e5e7eb]">
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "input" ? "border-b-2 border-[#558eff] text-[#558eff]" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("input")}
            >
              Direct Input
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "chat" ? "border-b-2 border-[#558eff] text-[#558eff]" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              Design Chat
            </button>
          </div>
          
          {/* Direct input form */}
          {activeTab === "input" && (
            <div className="p-4 flex-1 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">3D Model Generator</h2>
              
              <form onSubmit={handleGenerateModel} className="mb-4">
                <div className="mb-4">
                  <label htmlFor="prompt" className="block text-sm font-medium mb-1">
                    Describe what you want to generate
                  </label>
                  <textarea
                    id="prompt"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="e.g., A red t-shirt with a mountain logo"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`w-full py-2 rounded-md text-white ${
                    isGenerating ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isGenerating ? 'Generating...' : 'Generate 3D Model'}
                </button>
              </form>
              
              {/* Status display */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <p className="mb-2">{statusMessage}</p>
                
                {isGenerating && (
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300" 
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {modelLoadError && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-red-800 text-sm">{modelLoadError}</p>
                    <button 
                      onClick={retryLoadModel}
                      className="mt-2 text-xs bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Retry Loading Model
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat interface */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <DesignChat onImplementDesign={handleImplementDesign} />
            </div>
          )}
        </div>
      </div>

      {/* Right section - 3D Viewer */}
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 bg-[#e8e8e8] relative">
          {/* Use a simpler approach like in the working example */}
          <ModelViewer key={modelViewerKey} modelPath={currentModelPath} />
          
          {/* Show current model path for debugging */}
          <div className="absolute top-2 right-2 text-xs text-gray-600 bg-white bg-opacity-70 p-1 rounded">
            Model: {currentModelPath}
          </div>
          
          {/* Loading overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
              <div className="text-xl font-bold mb-2">Generating 3D Model</div>
              <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <div className="mt-2">{Math.round(generationProgress)}%</div>
              <div className="mt-2 text-sm">{statusMessage}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}