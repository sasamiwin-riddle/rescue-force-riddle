"use client";

import { useState, useRef, useEffect } from 'react';
import { Step, validateAnswer } from './actions';
import { MessageDialog } from '../components/MessageDialog';
import { ImageViewer } from '../components/ImageViewer';
import { InputField } from '../components/InputField';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [messages, setMessages] = useState<{ sender: 'system' | 'senior'; text: string }[]>([
    { sender: 'system', text: 'S.R.F. 空間救助ミッションを開始します。' },
    { sender: 'senior', text: 'やあ新人くん！今日からよろしくね。まずは転送装置のセットアップから始めようか。' },
    { sender: 'senior', text: 'マニュアルによると...「最初のパスワードは大文字のL」らしい。画像からLの形をしたアイテムを見つけて入力してみて！' }
  ]);
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);
  const [hasTriedFridge, setHasTriedFridge] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: 'system' | 'senior', text: string) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const handleStart = () => {
    setCurrentStep('step1');
  };

  const handleAnswerSubmit = async (answer: string) => {
    addMessage('system', `> 送信: ${answer}`);
    
    try {
      const res = await validateAnswer(answer, currentStep, { isFridgeOpen, hasTriedFridge });
      
      if (res.success) {
        addMessage('system', `SUCCESS: ${res.message}`);
        setErrorType(null);
        if (res.nextStep) {
          handleStepTransition(res.nextStep);
        }
      } else {
        addMessage('system', `ERROR: ${res.message}`);
        setErrorType(res.errorType || null);
        handleErrorResponse(res.errorType);
      }
    } catch (e) {
      addMessage('system', 'ERROR: サーバー通信エラー');
    }
  };

  const handleStepTransition = (nextStep: Step) => {
    setCurrentStep(nextStep);
    switch (nextStep) {
      case 'step2':
        setTimeout(() => {
          addMessage('senior', 'お見事！次は「小文字のh」だね。別の部屋をスキャンしてみるよ。');
        }, 1000);
        break;
      case 'step3':
        setTimeout(() => {
          addMessage('senior', '順調だね！次は「小文字のs」だって。s字型のアイテム...何かあるかな？');
        }, 1000);
        break;
      case 'step4':
        setTimeout(() => {
          addMessage('senior', 'いよいよ最後のパスワードだよ。もう一回「大文字のL」だ。慎重にいこう！');
        }, 1000);
        break;
      case 'cooling':
        setTimeout(() => {
          addMessage('system', 'WARNING: 対象エリアの温度が38度を超過。転送OUT判定。');
          addMessage('senior', 'えっ！？あはは、マニュアルのそのページ、お弁当の汁でくっついてて読んでなかったよ！温度を下げないと！');
          addMessage('system', '冷却機能解放の小謎を出題します。（※プレースホルダー：coolと入力してください）');
        }, 1000);
        break;
      case 'final':
        setTimeout(() => {
          addMessage('senior', 'ふう、焦った〜。さあ、本当に完璧な「L」を見つけて指定しよう！場所とアイテムを正確にね。');
        }, 1000);
        break;
      case 'clear':
        setTimeout(() => {
          addMessage('system', 'MISSION COMPLETE. 対象者の救出に成功しました。');
          addMessage('senior', 'やったね！初日から大活躍じゃないか。お疲れ様！');
        }, 1000);
        break;
    }
  };

  const handleErrorResponse = (type?: string) => {
    if (currentStep === 'step4' && type === 'fridge_1door') {
      setHasTriedFridge(true);
      setTimeout(() => {
        addMessage('system', 'ヒント: 一度送信したアイテムの再提出が可能です。');
        addMessage('senior', '1段式だったか...そうだ、さっきのアイテムをもう一回送ってみるのはどう？');
      }, 1000);
    } else if (currentStep === 'step4' && type === 'dryer_t') {
      setTimeout(() => {
        addMessage('senior', 'あれっ、なんでT字型になってるの！？...あ、待って、さっきの冷蔵庫の画像が拡大表示されてる。何かできるかも...？');
      }, 1000);
    }
  };

  const handleFridgeTap = () => {
    if (currentStep === 'step4' && hasTriedFridge && !isFridgeOpen) {
      setIsFridgeOpen(true);
      addMessage('system', 'アクション検知: 冷蔵庫の下段扉を開きました。アイテムの形状が変化しました。');
    }
  };

  return (
    <main className="flex h-screen flex-col items-center justify-between p-4 md:p-8 max-w-5xl mx-auto w-full font-mono">
      <h1 className="text-2xl font-bold text-cyan-400 mb-4 tracking-widest uppercase">S.R.F. Spatial Rescue Force</h1>
      
      <div className="flex flex-col md:flex-row gap-6 w-full h-full min-h-0">
        
        {/* Left Column: Image Viewer */}
        <div className="flex-1 bg-neutral-900 border border-cyan-800 rounded-lg overflow-hidden flex flex-col relative shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <div className="bg-cyan-900/50 p-2 text-xs text-cyan-200 border-b border-cyan-800">SCAN_VIEWER_v1.0</div>
          <div className="flex-1 relative overflow-hidden">
             {currentStep !== 'intro' && (
               <ImageViewer 
                 step={currentStep} 
                 errorType={errorType} 
                 isFridgeOpen={isFridgeOpen}
                 onFridgeTap={handleFridgeTap}
               />
             )}
             {currentStep === 'intro' && (
               <div className="absolute inset-0 flex items-center justify-center text-cyan-500/50">
                 <button 
                   onClick={handleStart}
                   className="px-6 py-3 border border-cyan-500 hover:bg-cyan-900 hover:text-cyan-300 transition-colors rounded uppercase tracking-widest"
                 >
                   Initialize Link
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: Terminal / Dialog / Input */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 w-full md:w-1/2">
          
          <div className="flex-1 bg-black border border-neutral-800 rounded-lg overflow-y-auto p-4 flex flex-col gap-2 shadow-inner font-sans">
            {messages.map((msg, idx) => (
              <MessageDialog key={idx} sender={msg.sender} text={msg.text} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <InputField 
              onSubmit={handleAnswerSubmit} 
              disabled={currentStep === 'intro' || currentStep === 'clear'}
            />
          </div>

        </div>

      </div>
    </main>
  );
}
