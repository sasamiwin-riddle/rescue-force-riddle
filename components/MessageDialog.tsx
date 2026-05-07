"use client";

interface MessageDialogProps {
  sender: '救助システム' | '先輩';
  text: string;
  imageSrc?: string;
  onImageClick?: (src: string) => void;
}

export function MessageDialog({ sender, text, imageSrc, onImageClick }: MessageDialogProps) {
  return (
    <div className={`flex flex-col mb-4 ${sender === '救助システム' ? 'items-start' : 'items-end'}`}>
      <span className={`text-[10px] mb-1 tracking-widest ${sender === '救助システム' ? 'text-cyan-600' : 'text-orange-500'}`}>
        {sender === '救助システム' ? '救助システム' : '先輩'}
      </span>
      <div
        className={`px-3 py-2 rounded max-w-[90%] break-words flex flex-col gap-2 ${sender === '救助システム'
          ? 'bg-neutral-900 border-l-2 border-cyan-500 text-cyan-100 font-mono text-sm'
          : 'bg-neutral-800 border border-orange-900/50 text-orange-50 text-sm rounded-br-none shadow-[0_2px_10px_rgba(249,115,22,0.05)]'
          }`}
      >
        <div className="whitespace-pre-wrap">
          {text}
        </div>
        {imageSrc && (
          <div 
            className="mt-2 border border-cyan-900 rounded overflow-hidden max-w-[200px] cursor-zoom-in hover:border-cyan-400 transition-colors"
            onClick={() => onImageClick?.(imageSrc)}
          >
            <img src={imageSrc} alt="Message attachment" className="w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
