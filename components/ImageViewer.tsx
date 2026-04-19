"use client";

import Image from "next/image";
import { Step } from "../app/actions";

interface ImageViewerProps {
  step: Step;
  errorType?: string | null;
  isFridgeOpen?: boolean;
  onFridgeTap?: () => void;
}

export function ImageViewer({ step, errorType, isFridgeOpen, onFridgeTap }: ImageViewerProps) {
  let imageSrc = "";
  let isInteractive = false;
  let overlayEffects = "";

  switch (step) {
    case 'step1':
      imageSrc = "/assets/step1.jpg";
      break;
    case 'step2':
      imageSrc = "/assets/step2.jpg";
      break;
    case 'step3':
      imageSrc = "/assets/step3.jpg";
      break;
    case 'step4':
      if (errorType === 'fridge_1door') {
        imageSrc = "/assets/step4_error_1door.jpg";
        overlayEffects = "animate-pulse bg-red-500/20";
      } else if (errorType === 'dryer_t') {
        // T-shaped dryer error shows the fridge closed to let player tap it
        imageSrc = isFridgeOpen ? "/assets/step4_fridge_open.jpg" : "/assets/step4_fridge_closed.jpg";
        isInteractive = !isFridgeOpen;
      } else {
        // initial step4 image
        imageSrc = "/assets/step4_init.jpg";
      }
      break;
    case 'cooling':
      imageSrc = "/assets/cooling.jpg";
      overlayEffects = "bg-red-900/40 mix-blend-color-burn animate-pulse";
      break;
    case 'final':
      imageSrc = "/assets/final.jpg";
      break;
    case 'clear':
      imageSrc = "/assets/clear.jpg";
      break;
    default:
      imageSrc = "/assets/placeholder.jpg";
  }

  // Fallback styling if image is missing (before generation)
  const isImageReady = false; // Toggle when images are generated

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black">
      {isInteractive && !isFridgeOpen && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 z-20 cursor-pointer hover:bg-cyan-500/10 transition-colors"
          onClick={onFridgeTap}
          title="タップして下段の扉を開く"
        />
      )}
      
      {overlayEffects && (
        <div className={`absolute inset-0 z-10 pointer-events-none ${overlayEffects}`} />
      )}

      {/* Placeholder display if images not yet generated, otherwise Next Image */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
         <div className="w-full h-full relative border border-cyan-800/50 rounded flex items-center justify-center text-cyan-800 bg-neutral-900">
             {/* When images are generated, replace this div with actual img/Image tag */}
             <img 
               src={imageSrc} 
               alt={`Scanner view for ${step}`}
               className="object-contain w-full h-full z-0 opacity-80"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
             <span className="absolute text-sm font-mono opacity-50">IMAGE_DATA_MISSING: {imageSrc}</span>
         </div>
      </div>

      {isInteractive && !isFridgeOpen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-900/80 text-cyan-300 text-xs rounded-full border border-cyan-500 animate-bounce z-30 pointer-events-none uppercase tracking-widest">
          TAP LOWER DOOR
        </div>
      )}
    </div>
  );
}
