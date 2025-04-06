"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, PresentationControls, Stage } from "@react-three/drei"
import { ArrowLeft, ArrowRight, MousePointer, MoveHorizontal, ZoomIn, ZoomOut, MoreHorizontal } from "lucide-react"

// Default model path fallback
const DEFAULT_MODEL_PATH = "/assets/3d/duck.glb"

// Ensure we preload the default model
useGLTF.preload(DEFAULT_MODEL_PATH)

// This function forces the Three.js cache to invalidate a specific model
function forceInvalidateModelCache(modelPath: string) {
  if (modelPath !== DEFAULT_MODEL_PATH) {
    console.log(`Forcibly clearing cache for: ${modelPath}`);
    useGLTF.clear(modelPath);
  }
}

function Model({ modelPath, onError }: { modelPath: string; onError: (error: string) => void }) {
  // State to track loading attempts
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Force clear any cached version each time
  useEffect(() => {
    if (modelPath !== DEFAULT_MODEL_PATH) {
      console.log(`Clearing cache for: ${modelPath}`);
      useGLTF.clear(modelPath);
      
      // Reset load attempts when model path changes
      setLoadAttempts(0);
    }
  }, [modelPath]);
  
  // Attempt to load model with a slight delay
  useEffect(() => {
    // Only retry loading a few times to prevent infinite loops
    if (loadAttempts < 3) {
      const timer = setTimeout(() => {
        console.log(`Attempt ${loadAttempts + 1} to load model: ${modelPath}`);
        setLoadAttempts(prev => prev + 1);
      }, 1000); // 1 second delay between attempts
      
      return () => clearTimeout(timer);
    }
  }, [loadAttempts, modelPath]);

  // Don't try to load until we've had at least one attempt
  if (loadAttempts === 0) {
    return null;
  }

  try {
    // Add a console log to track loading
    console.log(`Loading model: ${modelPath}`);
    const { scene } = useGLTF(modelPath);
    console.log(`Successfully loaded model: ${modelPath}`);
    return <primitive object={scene} />;
  } catch (error) {
    console.error(`Error loading model: ${modelPath}`, error);
    
    // If we've tried multiple times and still failed, fall back to default
    if (loadAttempts >= 3) {
      try {
        console.log(`Falling back to default model after ${loadAttempts} attempts`);
        const { scene } = useGLTF(DEFAULT_MODEL_PATH);
        return <primitive object={scene} />;
      } catch (fallbackError) {
        console.error("Error loading default model", fallbackError);
        onError(`Failed to load model: ${modelPath}`);
        return null;
      }
    }
    
    // If still attempting, show nothing while we wait for next attempt
    return null;
  }
}

export function ModelViewer({ modelPath = DEFAULT_MODEL_PATH }: { modelPath?: string }) {
  const [key, setKey] = useState(Date.now());
  
  // Force reset when model path changes
  useEffect(() => {
    setKey(Date.now());
  }, [modelPath]);
  
  return (
    <div className="relative w-full h-full">
      <Canvas key={key} shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="studio" intensity={0.5} adjustCamera={false}>
            <PresentationControls
              global
              zoom={1}
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              <Model modelPath={modelPath} onError={() => {}} />
            </PresentationControls>
          </Stage>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>

      {/* 3D Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-md shadow-md flex items-center p-1">
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Previous view">
            <ArrowLeft size={18} />
          </button>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Next view">
            <ArrowRight size={18} />
          </button>
          <div className="h-5 mx-1 border-r border-[#e5e7eb]"></div>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Select">
            <MousePointer size={18} />
          </button>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Pan">
            <MoveHorizontal size={18} />
          </button>
          <div className="h-5 mx-1 border-r border-[#e5e7eb]"></div>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <div className="h-5 mx-1 border-r border-[#e5e7eb]"></div>
          <button className="p-2 hover:bg-[#f5f5f5] rounded" title="Reset view">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}