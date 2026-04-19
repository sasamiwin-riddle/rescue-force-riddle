"use client";

import { useEffect, useState } from "react";

interface MessageDialogProps {
  sender: 'system' | 'senior';
  text: string;
}

export function MessageDialog({ sender, text }: MessageDialogProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    const speed = sender === 'system' ? 10 : 30; // System is fast, Senior is natural typing speed
    setDisplayedText("");
    setIsTyping(true);

    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, sender]);

  return (
    <div className={`flex flex-col mb-2 ${sender === 'system' ? 'items-start' : 'items-end'}`}>
      <span className={`text-[10px] mb-1 tracking-widest ${sender === 'system' ? 'text-cyan-600' : 'text-orange-500'}`}>
        {sender === 'system' ? 'SYS_LOG' : 'SENIOR_STAFF'}
      </span>
      <div 
        className={`px-3 py-2 rounded max-w-[85%] break-words ${
          sender === 'system' 
            ? 'bg-neutral-900 border-l-2 border-cyan-500 text-cyan-100 font-mono text-sm' 
            : 'bg-neutral-800 border border-orange-900/50 text-orange-50 text-base rounded-br-none shadow-[0_2px_10px_rgba(249,115,22,0.05)]'
        }`}
      >
        {displayedText}
        {isTyping && <span className={`inline-block w-2 h-4 ml-1 align-middle ${sender === 'system' ? 'bg-cyan-500' : 'bg-orange-500'} animate-pulse`} />}
      </div>
    </div>
  );
}
