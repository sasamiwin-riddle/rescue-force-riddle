"use client";

import { useState, useRef, useEffect } from 'react';
import { Step, validateRiddle, validateItemSelection, ActionResponse } from './actions';
import { MessageDialog } from '../components/MessageDialog';
import { ImageViewer } from '../components/ImageViewer';
import { InputField } from '../components/InputField';

const ALL_STEPS: Step[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'last', 'clear'];

interface StepState {
  messages: { sender: '救助システム' | '先輩'; text: string; image?: string }[];
  phase1Complete: boolean;
  isCleared: boolean;
  errorType?: string;
  hasUsedHelp?: boolean;
  nextStep?: Step;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Step>('intro');
  const [unlockedTabs, setUnlockedTabs] = useState<Step[]>(['intro']);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const [stepStates, setStepStates] = useState<Record<Step, StepState>>({
    intro: {
      messages: [
        { sender: '救助システム', text: '【救助システムログ】\n空間の異常を検知。救助対象者の生体信号を確認しました。' },
        { sender: '先輩', text: 'やあ新人くん。早速だがこれら現場研修だ。私は君のサポートを担当する先見悟（さきみさとる）だ。' },
        { sender: '先輩', text: '君も知っての通り、私たちの仕事は閉鎖空間に閉じ込められた人物の救出だ。本来はマニュアルから見せるところだが、探し中なのでまずは謎を解いてもらおう。' },
        { sender: '先輩', text: '心配ない。新人内で謎解き力トップの君なら大丈夫だ。私の指示に従って、操作を進めてくれ。' }
      ], phase1Complete: true, isCleared: false
    },
    step1: { messages: [{ sender: '先輩', text: 'よし、まずは救助システムの基本の流れを一通り実践だ。救助システムが出力する謎を解いてくれ。もしも謎が解けなかったり、行き詰まったら先輩HELPボタンを押してくれ。' }], phase1Complete: false, isCleared: false },
    manual: { messages: [{ sender: '先輩', text: '救助システムマニュアルを見つけたので、一通り目を通しておいてくれ。' }], phase1Complete: true, isCleared: false },
    step1_2: { messages: [{ sender: '先輩', text: 'マニュアルの確認は済んだか？では「s」のシルエットに最も近いアイテムをイラストの中から選んで送信してくれ。' }], phase1Complete: true, isCleared: false },
    step2: { messages: [{ sender: '先輩', text: 'お見事！この流れの繰り返しだ。' }], phase1Complete: false, isCleared: false },
    step3: { messages: [{ sender: '先輩', text: '重いアイテムでも運べる機能が解放された。マニュアルにも追加されているから確認しておいてくれ！' }], phase1Complete: false, isCleared: false },
    step4: { messages: [{ sender: '先輩', text: 'いよいよ最後のパスワードだ。さっきのドライヤーはもう使えないので、追加機能の「一旦転送」を使うしかないかもしれない。' }], phase1Complete: true, isCleared: false }, // Step4は謎解きフェーズなしでいきなり選択
    last: { messages: [{ sender: '先輩', text: '私の推測だと答えではないと思うが、念のため可能性を潰しておきたい。「ドライヤー」を再度選択してくれ。' }], phase1Complete: false, isCleared: false },
    clear: { messages: [{ sender: '救助システム', text: 'MISSION COMPLETE. 対象者の救出に成功しました。' }], phase1Complete: true, isCleared: true },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stepStates[activeTab]?.messages]);

  const addMessage = (step: Step, sender: '救助システム' | '先輩', text: string, image?: string) => {
    setStepStates(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        messages: [...prev[step].messages, { sender, text, image }]
      }
    }));
  };

  const updateStepState = (step: Step, updates: Partial<StepState>) => {
    setStepStates(prev => ({
      ...prev,
      [step]: { ...prev[step], ...updates }
    }));
  };

  const handleHelp = () => {
    if (stepStates[activeTab].hasUsedHelp) return;

    let helpText = "ちょっと待ってね、情報を整理するよ。";
    if (activeTab === 'step1') helpText = "赤色と青色の四角が突然出てきたな";
    else if (activeTab === 'step2') helpText = "S字フックってそのままSだよね。";
    else if (activeTab === 'step3') helpText = "横から見た椅子がhに見えるかも。";

    addMessage(activeTab, '先輩', helpText);
    updateStepState(activeTab, { hasUsedHelp: true });
  };

  const handleRiddleSubmit = async (answer: string) => {
    addMessage(activeTab, '救助システム', `> 謎の回答: ${answer}`);
    try {
      const res = await validateRiddle(answer, activeTab);
      if (res.success) {
        addMessage(activeTab, '救助システム', `SUCCESS: ${res.message}`);
        updateStepState(activeTab, { phase1Complete: true, errorType: undefined });

        if (activeTab === 'step1') {
          // Step 1 正解時は即座に完了状態とし、Manual と Step 1-2 をアンロック
          updateStepState('step1', { isCleared: true, nextStep: 'manual' });
          setUnlockedTabs(prev => {
            const next = [...prev];
            if (!next.includes('manual')) next.push('manual');
            if (!next.includes('step1_2')) next.push('step1_2');
            return next;
          });
        } else {
          // それ以外のステップは誘導メッセージを表示
          let nextInstruction = "よし、正解だ！次は救助対象者に提出してもらうアイテムを下のリストから選んでくれ。";
          if (activeTab === 'step2') nextInstruction = "その通り！12ということは、アルファベットだとLだ。指定がない場合は大文字で回答する必要がある。大文字の「L」に最も近いアイテムの選択をしてくれ。";
          if (activeTab === 'step3') nextInstruction = "冴えてるね！さあ、回答するアイテムを選ぼう。";
          addMessage(activeTab, '先輩', nextInstruction);
        }
      } else {
        addMessage(activeTab, '救助システム', `ERROR: ${res.message}`);
      }
    } catch (e) {
      addMessage(activeTab, '救助システム', 'ERROR: 通信エラー');
    }
  };

  // Step 1-3 のアイテム選択用
  const handleItemSelect = async (item: string) => {
    addMessage(activeTab, '救助システム', `> アイテム選択: ${item}`);
    try {
      const res = await validateItemSelection(item, activeTab);
      handleActionResponse(res);
    } catch (e) {
      addMessage(activeTab, '救助システム', 'ERROR: 通信エラー');
    }
  };

  // Step 4の特殊選択用
  const handleStep4Select = async (item: string, position: string, action: string) => {
    addMessage(activeTab, '救助システム', `> アクション: ${item} の ${position} を ${action}`);
    try {
      const res = await validateItemSelection({ item, position, action }, activeTab);
      handleActionResponse(res);
    } catch (e) {
      addMessage(activeTab, '救助システム', 'ERROR: 通信エラー');
    }
  };

  const handleActionResponse = (res: ActionResponse) => {
    if (res.success) {
      addMessage(activeTab, '救助システム', `SUCCESS: ${res.message}`);
      updateStepState(activeTab, { isCleared: true, errorType: undefined, nextStep: res.nextStep });

      if (res.errorType === 'fridge_1door') {
        // 画像付きメッセージ
        addMessage(activeTab, '先輩', '冷蔵庫が1段しかない...。なるほど、そういうことか...。', '/assets/step4_error_1door.png');
        addMessage(activeTab, '先輩', 'ん？おっとすまない、マニュアルの2ページ目の連携が漏れていた。');
      }

      if (res.nextStep && !unlockedTabs.includes(res.nextStep)) {
        setUnlockedTabs(prev => [...prev, res.nextStep!]);

        // ストーリー演出: Step 1-2 クリア時に女子高生であることに言及
        if (activeTab === 'step1_2' && res.nextStep === 'step2') {
          addMessage('step2', '先輩', '救助対象者が一つ目の提出を完了してくれた！追加されたスキャン機能によると、救助対象者は女子高生一人らしい。現状だと重いものは持てなさそうだ。');
        }
      }
    } else {
      addMessage(activeTab, '救助システム', `ERROR: ${res.message}`);
      if (res.errorType === 'dryer_t') {
        addMessage(activeTab, '先輩', 'LというよりかT字型ドライヤーだな。だが、これで確率は高まった。', '/assets/step4_dryer_t.png');
        // Last Stepのフェーズ1完了扱いにしてフェーズ2(テキスト入力)へ進める
        updateStepState(activeTab, { phase1Complete: true });
      }
    }
  };

  const renderTabNavigation = () => (
    <div className="flex w-full overflow-x-auto border-b border-neutral-700 bg-neutral-900 sticky top-0 z-10">
      {['intro', 'step1', 'manual', 'step1_2', 'step2', 'step3', 'step4', 'last']
        .filter(step => unlockedTabs.includes(step as Step))
        .map((stepStr, idx) => {
          const step = stepStr as Step;
          const isActive = activeTab === step;
          return (
            <button
              key={step}
              onClick={() => setActiveTab(step)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${isActive
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/20'
                : 'text-neutral-400 hover:text-cyan-200 hover:bg-neutral-800'
                }`}
            >
              {step === 'intro' ? 'INTRO' :
                step === 'manual' ? 'MANUAL' :
                  step === 'step1_2' ? 'STEP 1-2' :
                    step === 'step1' ? 'STEP 1' :
                      step === 'step2' ? 'STEP 2' :
                        step === 'step3' ? 'STEP 3' :
                          step === 'step4' ? 'STEP 4' :
                            step === 'last' ? 'LAST STEP' : 'UNKNOWN'}
            </button>
          );
        })}
    </div>
  );

  const renderActiveStepContent = () => {
    const state = stepStates[activeTab];

    return (
      <div className="flex-1 flex flex-col w-full min-h-0">

        {/* Riddle Image Section */}
        {activeTab !== 'intro' && activeTab !== 'manual' && activeTab !== 'step4' && activeTab !== 'last' && activeTab !== 'clear' && activeTab !== 'step1_2' && (
          <div className="p-4 bg-neutral-950 flex justify-center border-b border-neutral-800">
            <div className="w-full max-w-sm aspect-video bg-neutral-800 rounded flex items-center justify-center relative overflow-hidden">
              <ImageViewer step={activeTab} onImageClick={setExpandedImage} />
            </div>
          </div>
        )}

        {/* Chat / Terminal Area */}
        {activeTab !== 'manual' ? (
          <div className="flex-1 overflow-y-auto p-4 bg-black flex flex-col gap-2 relative">
            {state.messages.map((msg, idx) => (
              <MessageDialog key={idx} sender={msg.sender} text={msg.text} imageSrc={msg.image} onImageClick={setExpandedImage} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* MANUAL タブ専用のメインコンテンツ */
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-950">
            <div className="flex flex-col gap-4 pb-8 max-w-md mx-auto">
              {/* 画像表示セクション */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <img
                  src="/assets/manual.png"
                  alt="manual"
                  className="border border-cyan-900 rounded bg-black object-contain aspect-square cursor-zoom-in hover:border-cyan-400 transition-colors w-full"
                  onClick={() => setExpandedImage('/assets/manual.png')}
                />
                <img
                  src="/assets/chart.png"
                  alt="chart"
                  className="border border-cyan-900 rounded bg-black object-contain aspect-square cursor-zoom-in hover:border-cyan-400 transition-colors w-full"
                  onClick={() => setExpandedImage('/assets/chart.png')}
                />
                {unlockedTabs.includes('last') && (
                  <img
                    src="/assets/manual2.png"
                    alt="manual2"
                    className="border border-cyan-900 rounded bg-black object-contain aspect-square col-span-2 cursor-zoom-in hover:border-cyan-400 transition-colors w-full"
                    onClick={() => setExpandedImage('/assets/manual2.png')}
                  />
                )}
              </div>

              <div className="p-4 bg-neutral-900 border border-cyan-900/50 rounded-lg text-cyan-100 text-sm leading-relaxed font-sans">
                <h3 className="text-cyan-400 font-bold mb-3 border-b border-cyan-900 pb-1 uppercase tracking-widest">Operation Manual</h3>
                <div className="space-y-4">
                  {stepStates['step1_2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ 救助対象者をスキャン (情報取得)</p>
                      <p className="text-xs text-neutral-400">異常空間内の人物の状態を取得します。</p>
                      <p className="text-xs text-neutral-400">スキャン結果：女性一人、高校生。体調異常なし。</p>
                    </div>
                  )}

                  {stepStates['step2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ ムキムキパワー</p>
                      <p className="text-xs text-neutral-400">救助対象者が重い物も一人で運べるようになりました。</p>
                    </div>
                  )}

                  {stepStates['step3'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ 一旦転送</p>
                      <p className="text-xs text-neutral-400">一度こちらの空間へ転送し、状態を整えてから再送します。（1度誤答扱いとはなります）</p>
                    </div>
                  )}

                  {unlockedTabs.includes('last') && (
                    <div className="animate-in fade-in duration-700 border-t border-cyan-900/30 pt-2">
                      <p className="text-pink-400 font-bold underline mb-1">■ 自由入力モード</p>
                      <p className="text-xs text-neutral-400">4文字以内の自由なテキストで対象者へアナウンスできます。</p>
                    </div>
                  )}
                </div>
              </div>

              {!state.isCleared && (
                <button
                  onClick={() => {
                    updateStepState('manual', { isCleared: true });
                    setTimeout(() => setActiveTab('step1_2'), 500);
                  }}
                  className="w-full bg-cyan-900/60 text-cyan-100 py-3 rounded font-bold border border-cyan-700 hover:bg-cyan-800 transition-colors animate-pulse"
                >
                  マニュアルの内容を理解しました
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input / Action Area */}
        {activeTab !== 'manual' && (
          <div className="bg-neutral-900 border-t border-neutral-700 p-4 shrink-0">
            {!state.isCleared && (
              <>
                <div className="flex justify-end items-end mb-2">
                  <button
                    onClick={handleHelp}
                    disabled={state.hasUsedHelp}
                    className="text-xs bg-neutral-800 border border-neutral-600 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50"
                  >
                    先輩HELP
                  </button>
                </div>

                {/* Intro: 専用の選択肢ボタン */}
                {activeTab === 'intro' && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        addMessage('intro', '救助システム', '> がんばります！');
                        updateStepState('intro', { isCleared: true });
                        if (!unlockedTabs.includes('step1')) {
                          setUnlockedTabs(prev => [...prev, 'step1']);
                          setTimeout(() => setActiveTab('step1'), 500);
                        }
                      }}
                      className="w-full bg-cyan-900/40 text-cyan-400 border border-cyan-800 rounded-md py-3 font-bold hover:bg-cyan-800 hover:text-cyan-100 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                    >
                      がんばります！
                    </button>
                  </div>
                )}

                {/* フェーズ1: 謎解き入力 (Step1-3) */}
                {!state.phase1Complete && ['step1', 'step2', 'step3'].includes(activeTab) && (
                  <InputField onSubmit={handleRiddleSubmit} placeholder="謎の答えを入力..." />
                )}

                {/* フェーズ2: アイテム選択 (Step1-4, Step1_2) */}
                {(state.phase1Complete || activeTab === 'step1_2') && ['step1_2', 'step2', 'step3', 'step4'].includes(activeTab) && (
                  <div className="flex gap-2">
                    <select id={`select-${activeTab}`} className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-cyan-400">
                      <option value="">アイテムを選択</option>
                      {/* Step 1-2以降: S字フック, 制服 */}
                      {['step1_2', 'step2', 'step3', 'step4'].includes(activeTab) && (
                        <>
                          <option value="S字フック">S字フック</option>
                          <option value="制服">制服</option>
                        </>
                      )}
                      {/* Step 2以降: ドライヤー, ハブラシ, 浴衣, トイレ */}
                      {['step2', 'step3', 'step4'].includes(activeTab) && (
                        <>
                          <option value="ドライヤー">ドライヤー</option>
                          <option value="ハブラシ">ハブラシ</option>
                          <option value="浴衣">浴衣</option>
                          <option value="トイレ">トイレ</option>
                        </>
                      )}
                      {/* Step 3以降: 墨汁, 饅頭, 扇子, イス, 茎, 木, 盆, 缶, 蜘蛛 */}
                      {['step3', 'step4'].includes(activeTab) && (
                        <>
                          <option value="墨汁">墨汁</option>
                          <option value="饅頭">饅頭</option>
                          <option value="扇子">扇子</option>
                          <option value="イス">イス</option>
                          <option value="茎">茎</option>
                          <option value="木">木</option>
                          <option value="盆">盆</option>
                          <option value="缶">缶</option>
                          <option value="蜘蛛">蜘蛛</option>
                        </>
                      )}
                      {/* Step 4以降: 水, 冷蔵庫 */}
                      {activeTab === 'step4' && (
                        <>
                          <option value="水">水</option>
                          <option value="冷蔵庫">冷蔵庫</option>
                        </>
                      )}
                    </select>
                    <button
                      onClick={() => {
                        const val = (document.getElementById(`select-${activeTab}`) as HTMLSelectElement).value;
                        if (val) handleItemSelect(val);
                      }}
                      className="bg-cyan-900 text-cyan-100 px-4 py-2 rounded font-bold hover:bg-cyan-800"
                    >
                      送信
                    </button>
                  </div>
                )}

                {/* Step 4: 3パーツ選択 */}
                {activeTab === 'step4' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <span className="text-neutral-500 flex items-center">の</span>
                      <select id="s4-pos" className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-2 py-2 text-sm">
                        <option value="上">上</option>
                        <option value="中">中</option>
                        <option value="下">下</option>
                      </select>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-neutral-500">を</span>
                      <select id="s4-act" className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-2 py-2 text-sm">
                        <option value="開く">開く</option>
                        <option value="閉じる">閉じる</option>
                      </select>
                      <button
                        onClick={() => {
                          const i = (document.getElementById('s4-item') as HTMLSelectElement).value;
                          const p = (document.getElementById('s4-pos') as HTMLSelectElement).value;
                          const a = (document.getElementById('s4-act') as HTMLSelectElement).value;
                          handleStep4Select(i, p, a);
                        }}
                        className="bg-cyan-900 text-cyan-100 px-6 py-2 rounded font-bold hover:bg-cyan-800"
                      >
                        実行
                      </button>
                    </div>
                  </div>
                )}

                {/* Last Step: フェーズ1 強制選択 -> フェーズ2 自由入力 */}
                {activeTab === 'last' && !state.phase1Complete && (
                  <div className="flex gap-2">
                    <select disabled className="flex-1 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded px-3 py-2 text-sm">
                      <option>ドライヤー</option>
                    </select>
                    <button onClick={() => handleItemSelect('ドライヤー_forced')} className="bg-red-900 text-red-100 px-4 py-2 rounded font-bold hover:bg-red-800">
                      強制送信
                    </button>
                  </div>
                )}
                {activeTab === 'last' && state.phase1Complete && (
                  <InputField onSubmit={handleItemSelect} placeholder="対象者に送るメッセージを入力 (4文字以内)..." maxLength={4} />
                )}
              </>
            )}
            {state.isCleared && activeTab !== 'intro' && (
              <div className="flex flex-col items-center gap-2">
                {state.nextStep ? (
                  <button
                    onClick={() => setActiveTab(state.nextStep!)}
                    className="w-full bg-cyan-600/40 text-cyan-100 py-3 rounded font-bold border border-cyan-500 hover:bg-cyan-500 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)] animate-in fade-in zoom-in"
                  >
                    次へ進む
                  </button>
                ) : (
                  <div className="w-full text-center text-cyan-500 py-2 border border-cyan-800 bg-cyan-900/20 rounded">
                    このステップは完了しました
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="flex h-screen sm:h-svh flex-col items-center justify-between mx-auto w-full max-w-lg font-mono bg-neutral-950">
      {/* Header */}
      <h1 className="text-xl font-bold text-cyan-400 p-3 text-center tracking-widest border-b border-cyan-900 w-full bg-black shrink-0">
        ライクアルファベット
      </h1>

      {/* Navigation */}
      {renderTabNavigation()}

      {/* Main Content Area */}
      {activeTab === 'clear' ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-4">
          <h2 className="text-3xl text-cyan-400 font-bold">MISSION COMPLETE</h2>
          <p className="text-neutral-300">対象者の救出に成功しました。<br />最初のステップクリア時に判明した通り、対象者は女子高生でした。彼女は2ndステップで力を得て自力で脱出ポートまで辿り着きました。</p>
        </div>
      ) : (
        renderActiveStepContent()
      )}

      {/* Image Expansion Overlay */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in zoom-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain border border-cyan-900/50 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
            <button
              className="absolute -top-12 right-0 text-cyan-400 font-bold text-lg hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setExpandedImage(null); }}
            >
              [ CLOSE ]
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
