"use client";

import { useState, useEffect } from 'react';

interface HintDialogProps {
  hints: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function HintDialog({ hints, isOpen, onClose }: HintDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when hints change or dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || hints.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < hints.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border-2 border-cyan-500 rounded-lg p-6 max-w-xs w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transform transition-all animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center border border-cyan-400">
              <span className="text-cyan-400 font-bold">先</span>
            </div>
            <div className="text-cyan-400 font-bold tracking-widest text-sm">先輩からのヒント</div>
          </div>
          <div className="text-neutral-500 text-xs font-mono">
            {currentIndex + 1} / {hints.length}
          </div>
        </div>

        <div className="min-h-[100px] flex items-center justify-center mb-6">
          <p className="text-neutral-100 text-lg leading-relaxed font-sans text-center">
            {hints[currentIndex]}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-bold py-2 rounded transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={onClose}
            className="flex-[2] bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 border border-cyan-700 font-bold py-2 rounded transition-colors uppercase tracking-widest text-xs"
          >
            閉じる
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === hints.length - 1}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-bold py-2 rounded transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
