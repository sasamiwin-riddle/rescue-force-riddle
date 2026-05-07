"use client";

import { useState, useRef, useEffect } from "react";

interface InputFieldProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function InputField({ onSubmit, disabled, placeholder, maxLength }: InputFieldProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <span className="text-cyan-500 font-bold">{'>'}</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || (disabled ? "リンク待機中..." : "パスワード / アイテム名を入力")}
        maxLength={maxLength}
        className="flex-1 bg-black/50 border border-neutral-700 text-cyan-50 placeholder-neutral-500 rounded-md py-2 pl-8 pr-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-4 py-2 bg-cyan-900/40 text-cyan-400 border border-cyan-800 rounded-md hover:bg-cyan-800 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm font-bold tracking-wider"
      >
        送信
      </button>
    </form>
  );
}
