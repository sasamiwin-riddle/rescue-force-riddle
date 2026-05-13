"use client";

import { Step } from "../app/actions";

interface ImageViewerProps {
  step: Step;
  onImageClick?: (src: string) => void;
}

export function ImageViewer({ step, onImageClick }: ImageViewerProps) {
  let imageSrc = "";

  switch (step) {
    case 'step0':
      imageSrc = "/assets/riddle_step0.png";
      break;
    case 'step1_1':
      imageSrc = "/assets/riddle_step1.png";
      break;
    case 'step2_1':
      imageSrc = "/assets/riddle_step2.png";
      break;
    case 'step3_1':
      imageSrc = "/assets/riddle_step3.png";
      break;
    case 'step4_1':
      imageSrc = "/assets/riddle_step4.png";
      break;
    case 'last_2':
      imageSrc = "/assets/riddle_steplast.png";
      break;
    default:
      imageSrc = "/assets/placeholder.jpg";
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Placeholder display if images not yet generated, otherwise Next Image */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <div className="w-full h-full relative border border-cyan-800/50 rounded flex items-center justify-center text-cyan-800 bg-neutral-900">
          <img
            src={imageSrc}
            alt={`Riddle image for ${step}`}
            className="object-contain w-full h-full z-0 opacity-90 cursor-zoom-in"
            onClick={() => onImageClick?.(imageSrc)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

        </div>
      </div>
    </div>
  );
}
