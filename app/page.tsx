"use client";

import { useState, useRef, useEffect } from 'react';
import { Step, validateRiddle, validateItemSelection, ActionResponse } from './actions';
import { MessageDialog } from '../components/MessageDialog';
import { ImageViewer } from '../components/ImageViewer';
import { InputField } from '../components/InputField';
import { HintDialog } from '../components/HintDialog';
import { HINTS } from './hints';

const ALL_STEPS: Step[] = ['intro', 'step1_1', 'manual', 'step1_2', 'step2_1', 'step2_2', 'step3_1', 'step3_2', 'step4_1', 'step4_2', 'last_1', 'last_2', 'clear'];

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
  const [gameStarted, setGameStarted] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [manual2Unlocked, setManual2Unlocked] = useState(false);
  const [lastRiddleRevealed, setLastRiddleRevealed] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({
    who: '',
    where: '',
    miss: '',
    item: '',
    q5: ''
  });
  const [showQ5, setShowQ5] = useState(false);

  const [stepStates, setStepStates] = useState<Record<Step, StepState>>({
    intro: {
      messages: [
        { sender: '救助システム', text: '【救助システムログ】\n空間の異常を検知。救助対象者の生体信号を確認しました。' },
        { sender: '先輩', text: 'やあ新人くん。早速だがこれから現場研修だ。私は君のサポートを担当する先見悟（さきみさとる）だ。' },
        { sender: '先輩', text: '君も知っての通り、私たちの仕事は閉鎖空間に閉じ込められた人物の救出だ。本来はマニュアルから見せるところだが、ファイルを捜索中なのでまずは謎を解いてもらおう。' },
        { sender: '先輩', text: '救助対象者の安全を考慮して、180分以内に救出するぞ！' },
        { sender: '先輩', text: '心配ない。新人内で謎解き力トップの君なら大丈夫だ。私の指示に従って、操作を進めてくれ。' }
      ], phase1Complete: true, isCleared: false
    },
    step1_1: { messages: [{ sender: '先輩', text: 'よし、まずは救助システムの基本の流れを一通り実践だ。救助システムが出力する謎を解いてくれ。もしも謎が解けなかったり、行き詰まったら先輩HELPボタンを押してくれ。' }], phase1Complete: false, isCleared: false },
    manual: { messages: [{ sender: '先輩', text: '今の28分間で救助システムマニュアルを見つけた。一通り目を通しておいてくれ。' }], phase1Complete: true, isCleared: false },
    step1_2: { messages: [{ sender: '先輩', text: 'マニュアルの確認は済んだか？では「s」のシルエットに最も近いアイテムを登場したイラストの中から選んで送信してくれ。' }], phase1Complete: true, isCleared: false },
    step2_1: { messages: [{ sender: '先輩', text: 'お見事！この流れの繰り返しだ。' }, { sender: '先輩', text: 'ここまで60分、順調だな。' }], phase1Complete: false, isCleared: false },
    step2_2: { messages: [{ sender: '先輩', text: 'よし、正解だ！「L」のシルエットに最も近いアイテムを登場したイラストの中から選んで送信してくれ。' }], phase1Complete: true, isCleared: false },
    step3_1: { messages: [{ sender: '先輩', text: 'ドライヤーの提出も無事完了したようだ。それによって、重いアイテムでも運べる機能が解放された。マニュアルにも追加されているから確認しておいてくれ！' }, { sender: '先輩', text: 'ここまで100分、順調だな。' }], phase1Complete: false, isCleared: false },
    step3_2: { messages: [{ sender: '先輩', text: '冴えてるね！さあ、「h」のシルエットに最も近いアイテムを登場したイラストの中から選ぼう。' }], phase1Complete: true, isCleared: false },
    step4_1: { messages: [{ sender: '先輩', text: '無事にイスが提出された。' }, { sender: '先輩', text: 'ここまで140分。いよいよ最後の謎だ。' }], phase1Complete: false, isCleared: false },
    step4_2: { messages: [{ sender: '先輩', text: 'また「L」か。二つもドライヤーがあるか分からない。今追加された機能の「一旦転送」を使う方が良さげだな。マニュアルを確認して、最後のアイテムはどうすれば良いか考えてくれ。' }], phase1Complete: true, isCleared: false },
    last_1: { messages: [{ sender: '先輩', text: 'ここまで160分。いよいよ最後の山場だ。' }, { sender: '先輩', text: '私の推測だと答えではないと思うが、念のため可能性を潰しておきたい。「ドライヤー」を再度選択してくれ。' }], phase1Complete: true, isCleared: false },
    last_2: {
      messages: [{ sender: '先輩', text: 'マニュアルの2ページ目は確認できたか？' },
      { sender: '先輩', text: '何のアイテムが良いか、私はすでに検討がついているが、まだ時間はある。この謎は救助システムから出力された謎に少し書き加えたものだ。私のこの謎を解けば、私の考えが伝わるだろう。' },
      { sender: '先輩', text: '今すぐこの謎を見ても良いし、自力で考えてから確認のために解いても良い。君の好きなやり方で考えてくれ' },
      { sender: '先輩', text: 'もし状況の整理がしたい場合は「状況整理を行う」と言ってくれ。' }], phase1Complete: false, isCleared: false
    },
    situation_review: { messages: [], phase1Complete: false, isCleared: false },
    clear: { messages: [{ sender: '救助システム', text: 'MISSION COMPLETE. 対象者の救出に成功しました。' }], phase1Complete: true, isCleared: true },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveTab = useRef<Step>(activeTab);

  useEffect(() => {
    if (lastActiveTab.current !== activeTab) {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      lastActiveTab.current = activeTab;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, stepStates[activeTab]?.messages]);

  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const container = tabsContainerRef.current;
    const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement;

    if (activeBtn) {
      const containerWidth = container.offsetWidth;
      const tabLeft = activeBtn.offsetLeft;
      const tabWidth = activeBtn.offsetWidth;

      // 画面の左から60%程度の位置（中心より少し右）にタブの真ん中が来るようにスクロール
      const targetScroll = tabLeft + (tabWidth / 2) - (containerWidth * 0.6);

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);


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
    setShowHints(true);
    if (!stepStates[activeTab].hasUsedHelp) {
      updateStepState(activeTab, { hasUsedHelp: true });
    }
  };

  const handleRiddleSubmit = async (answer: string) => {
    try {
      const res = await validateRiddle(answer, activeTab);
      if (res.success) {
        // 正解時のみエコーと成功メッセージを表示
        addMessage(activeTab, '救助システム', `> 謎の回答: ${answer}`);
        addMessage(activeTab, '救助システム', `SUCCESS: ${res.message}`);
        
        if (activeTab === 'last_2') {
          addMessage(activeTab, '先輩', 'これまで出たイラストのアイテムが答えだが、複数あったり形が違う場合もある。聞いた時に一発でこれと分かる単語で回答するんだ');
        }

        const updates: Partial<StepState> = { errorType: undefined };
        if (res.isPhase1Complete) updates.phase1Complete = true;
        if (res.nextStep) {
          updates.isCleared = true;
          updates.nextStep = res.nextStep;
          if (!unlockedTabs.includes(res.nextStep)) {
            setUnlockedTabs(prev => [...prev, res.nextStep!]);
          }
        }

        // Step 1_1 特殊処理: Manual と Step 1_2 も同時にアンロック
        if (activeTab === 'step1_1' && res.success) {
          setUnlockedTabs(prev => {
            const next = [...prev];
            if (!next.includes('manual')) next.push('manual');
            if (!next.includes('step1_2')) next.push('step1_2');
            return next;
          });
        }

        updateStepState(activeTab, updates);
      } else {
        // 不正解時はチャットに残さず、先輩からのポップアップを表示
        setPopupMessage('先輩：もう一度よく考えて');
      }
    } catch (e) {
      // 通信エラーなどの場合も、過剰なメッセージを避ける
    }
  };

  // Step 1-3 のアイテム選択用
  const handleItemSelect = async (item: string) => {
    try {
      const res = await validateItemSelection(item, activeTab);
      if (res.success) {
        addMessage(activeTab, '救助システム', `> アイテム選択: ${item}`);
      }
      handleActionResponse(res);
    } catch (e) {
      // 通信エラー
    }
  };

  // Step 4の特殊選択用
  const handleStep4Select = async (item: string, position: string, action: string, view: string) => {
    try {
      const res = await validateItemSelection({ item, position, action, view }, activeTab);
      if (res.success) {
        addMessage(activeTab, '救助システム', `アクション：一旦転送`);
      }
      handleActionResponse(res);
    } catch (e) {
      // 通信エラー
    }
  };

  const handleActionResponse = (res: ActionResponse) => {
    if (res.success) {
      if (res.errorType === 'fridge_1door') {
        addMessage(activeTab, '救助システム', `アイテム選択: 冷蔵庫`);
      } else {
        addMessage(activeTab, '救助システム', `SUCCESS: ${res.message}`);
      }
      updateStepState(activeTab, { isCleared: true, errorType: undefined, nextStep: res.nextStep });

      if (res.errorType === 'fridge_1door') {
        // 画像付きメッセージ
        addMessage(activeTab, '先輩', '一旦こちらに転送されてきたが、冷蔵庫が1段しかない...。なるほど、そういうことか...。', '/assets/step4_error_1door.png');
      }

      if (res.nextStep && !unlockedTabs.includes(res.nextStep)) {
        setUnlockedTabs(prev => [...prev, res.nextStep!]);

        // ストーリー演出: Step 1-2 クリア時に女子高生であることに言及
        if (activeTab === 'step1_2' && res.nextStep === 'step2_1') {
          addMessage('step2_1', '先輩', '救助対象者が一つ目の提出を完了してくれた！追加されたスキャン機能によると、救助対象者は女子高生一人らしい。現状だと重いものは持てなさそうだ。');
        }
      }
    } else {
      if (res.errorType === 'dryer_t') {
        addMessage(activeTab, '救助システム', `アイテム選択: ドライヤー`);
        addMessage(activeTab, '救助システム', 'ERROR: 対象アイテムは「T」として判定されました。', '/assets/step4_dryer_t.png');
        addMessage(activeTab, '先輩', 'LというよりかT字型ドライヤーだな。だが、これで確率は高まった。');
        addMessage(activeTab, '先輩', '2回失敗したことで、自由入力機能が解放された。ん？おっとすまない、マニュアルの2ページ目の連携が漏れていた。マニュアルを再度確認してみてくれ');
        setManual2Unlocked(true);
        if (res.nextStep && !unlockedTabs.includes(res.nextStep)) {
          setUnlockedTabs(prev => [...prev, res.nextStep!]);
        }
        // Last Step的フェーズ1完了扱いにしてフェーズ2(テキスト入力)へ進める
        updateStepState(activeTab, { phase1Complete: true, isCleared: true, nextStep: res.nextStep });
      } else {
        // 通常の不正解時はポップアップ
        setPopupMessage('先輩：もう一度よく考えて');
      }
    }
  };

  const renderTabNavigation = () => (
    <div
      ref={tabsContainerRef}
      className="flex w-full overflow-x-auto border-b border-neutral-700 bg-neutral-900 sticky top-0 z-10 no-scrollbar"
    >
      {['intro', 'step1_1', 'manual', 'step1_2', 'step2_1', 'step2_2', 'step3_1', 'step3_2', 'step4_1', 'step4_2', 'last_1', 'last_2', 'situation_review']
        .filter(step => unlockedTabs.includes(step as Step))
        .map((stepStr, idx) => {
          const step = stepStr as Step;
          const isActive = activeTab === step;
          return (
            <button
              key={step}
              onClick={() => setActiveTab(step)}
              data-active={isActive}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${isActive
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/20'
                : 'text-neutral-400 hover:text-cyan-200 hover:bg-neutral-800'
                }`}
            >
              {step === 'intro' ? 'INTRO' :
                step === 'manual' ? 'MANUAL' :
                  step === 'step1_1' ? 'STEP 1-1' :
                    step === 'step1_2' ? 'STEP 1-2' :
                      step === 'step2_1' ? 'STEP 2-1' :
                        step === 'step2_2' ? 'STEP 2-2' :
                          step === 'step3_1' ? 'STEP 3-1' :
                            step === 'step3_2' ? 'STEP 3-2' :
                              step === 'step4_1' ? 'STEP 4-1' :
                                step === 'step4_2' ? 'STEP 4-2' :
                                  step === 'last_1' ? 'LAST 1' :
                                    step === 'last_2' ? 'LAST 2' :
                                      step === 'situation_review' ? '状況整理' : 'UNKNOWN'}
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
        {(activeTab.endsWith('_1') || activeTab === 'last_2') && activeTab !== 'last_1' && (
          <div className="p-4 bg-neutral-950 flex justify-center border-b border-neutral-800">
            <div className="w-full max-w-sm aspect-video bg-neutral-800 rounded flex items-center justify-center relative overflow-hidden">
              {activeTab === 'last_2' && !lastRiddleRevealed ? (
                <button
                  onClick={() => setLastRiddleRevealed(true)}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors group"
                >
                  <span className="text-cyan-400 font-bold tracking-widest text-sm group-hover:scale-110 transition-transform font-mono">表示する</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-sans">タップして最後の謎を表示</span>
                </button>
              ) : (
                <ImageViewer step={activeTab} onImageClick={setExpandedImage} />
              )}
            </div>
          </div>
        )}

        {activeTab !== 'manual' && activeTab !== 'situation_review' ? (
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-black flex flex-col gap-2 relative">
            {state.messages.map((msg, idx) => (
              <MessageDialog key={idx} sender={msg.sender} text={msg.text} imageSrc={msg.image} onImageClick={setExpandedImage} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : activeTab === 'manual' ? (
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
              </div>

              <div className="p-4 bg-neutral-900 border border-cyan-900/50 rounded-lg text-cyan-100 text-sm leading-relaxed font-sans">
                <h3 className="text-cyan-400 font-bold mb-3 border-b border-cyan-900 pb-1 uppercase tracking-widest">解放された機能</h3>
                <div className="space-y-4">
                  <div className="animate-in fade-in duration-700">
                    <p className="text-cyan-400 font-bold underline mb-1">■ アイテムの自動防水加工</p>
                    <p className="text-xs text-neutral-400">自動でアイテムに防水加工を施し、水を吸って変形しないようにできる</p>
                  </div>

                  {stepStates['step1_2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ 救助対象者をリアルタイムスキャン (情報取得)</p>
                      <p className="text-xs text-neutral-400">異常空間内の人物と空気の状態を常に取得します。</p>
                      <p className="text-xs text-neutral-400">最新スキャン結果：女性一人、高校生。体温正常。気温8℃。湿度40%</p>
                    </div>
                  )}

                  {stepStates['step2_2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ ムキムキパワー</p>
                      <p className="text-xs text-neutral-400">救助対象者が重い物も一人で運べるようになりました。</p>
                    </div>
                  )}

                  {stepStates['step3_2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ 一旦転送</p>
                      <p className="text-xs text-neutral-400">一度こちらの空間へ転送し、状態を整えてから再送します。（1度誤答扱いとはなります）</p>
                    </div>
                  )}

                  {manual2Unlocked && (
                    <div className="animate-in fade-in duration-700 border-t border-cyan-900/30 pt-2">
                      <p className="text-pink-400 font-bold underline mb-1">■ 自由入力モード</p>
                      <p className="text-xs text-neutral-400">4文字以内の自由なテキストで対象者へアナウンスできます。</p>
                    </div>
                  )}
                </div>

                {manual2Unlocked && (
                  <div className="mt-6 animate-in slide-in-from-bottom-4 duration-1000">
                    <p className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                      追加マニュアル：2ページ目
                    </p>
                    <div
                      className="relative group cursor-zoom-in"
                      onClick={() => setExpandedImage('/assets/manual2.png')}
                    >
                      <img
                        src="/assets/manual2.png"
                        alt="Manual Page 2"
                        className="w-full rounded border border-cyan-800 group-hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                      />
                      <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors flex items-center justify-center">
                        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-black/60 px-3 py-1 rounded text-xs">
                          拡大表示
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
        ) : (
          /* 状況整理タブ専用のUI */
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 font-sans">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-cyan-400 font-bold text-lg tracking-tighter uppercase italic">状況整理シート</h3>
              </div>

              <div className="space-y-8 bg-neutral-900/50 p-6 rounded-lg border border-cyan-900/30">
                {/* 質問1 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">1. マニュアル2ページ目に記載の救助対象者以上の温度とは、だいたい何℃以上だろうか？</p>
                  <select
                    value={reviewAnswers.who}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, who: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.who === '37' ? 'border-green-500 text-green-400' : reviewAnswers.who ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="35">35℃以上</option>
                    <option value="36">36℃以上</option>
                    <option value="37">37℃以上</option>
                  </select>
                </div>

                {/* 質問2 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">2. なぜ最初からハッキング液の温度が高くなっているのか？</p>
                  <select
                    value={reviewAnswers.where}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, where: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.where === 'お風呂' ? 'border-green-500 text-green-400' : reviewAnswers.where ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="お風呂">お風呂だったから</option>
                    <option value="ポット">ポットだったから</option>
                    <option value="マグマ">マグマだったから</option>
                  </select>
                </div>

                {/* 質問3 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">3. 外気温は何℃か？</p>
                  <select
                    value={reviewAnswers.miss}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, miss: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.miss === '8' ? 'border-green-500 text-green-400' : reviewAnswers.miss ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="8">8℃</option>
                    <option value="15">15℃</option>
                    <option value="25">25℃</option>
                  </select>
                </div>

                {/* 質問4 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">4. なぜお湯が冷めないのか？</p>
                  <select
                    value={reviewAnswers.item}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, item: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.item === '元々' ? 'border-green-500 text-green-400' : reviewAnswers.item ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="蓋">蓋を一度も取っていないから</option>
                    <option value="追い炊き">追い炊きボタンを押し続けているから</option>
                    <option value="元々">元々温度を保つ設備になっているから</option>
                  </select>
                </div>

                {!showQ5 ? (
                  <button
                    onClick={() => setShowQ5(true)}
                    className="w-full bg-neutral-800 border border-cyan-900 text-cyan-400 py-3 rounded font-bold hover:bg-neutral-700 transition-colors uppercase tracking-widest text-xs"
                  >
                    革新的な問いを表示する
                  </button>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-500">
                    <p className="text-sm text-neutral-300">5. ハッキング液は何に溶けていますか？</p>
                    <select
                      value={reviewAnswers.q5}
                      onChange={(e) => setReviewAnswers(prev => ({ ...prev, q5: e.target.value }))}
                      className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.q5 === '温泉' ? 'border-green-500 text-green-400' : reviewAnswers.q5 ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                    >
                      <option value="">選択してください</option>
                      <option value="温泉">温泉</option>
                      <option value="温泉">温泉</option>
                      <option value="温泉">温泉</option>
                    </select>
                  </div>
                )}
              </div>

              {reviewAnswers.who === '37' && reviewAnswers.where === 'お風呂' && reviewAnswers.miss === '8' && reviewAnswers.item === '元々' && reviewAnswers.q5 === '温泉' && (
                <div className="animate-in zoom-in duration-500 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-center space-y-3">
                  <p className="text-green-400 font-bold tracking-widest text-sm">状況整理完了</p>
                  <p className="text-xs text-neutral-300">LAST 2に戻り、答えを導いてください。</p>
                  <button
                    onClick={() => setActiveTab('last_2')}
                    className="w-full bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-500 transition-colors"
                  >
                    LAST 2に戻る
                  </button>
                </div>
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
                    disabled={!HINTS[activeTab] || HINTS[activeTab].length === 0}
                    className="text-xs bg-neutral-800 border border-neutral-600 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
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
                        if (!unlockedTabs.includes('step1_1')) {
                          setUnlockedTabs(prev => [...prev, 'step1_1']);
                          setTimeout(() => setActiveTab('step1_1'), 500);
                        }
                      }}
                      className="w-full bg-cyan-900/40 text-cyan-400 border border-cyan-800 rounded-md py-3 font-bold hover:bg-cyan-800 hover:text-cyan-100 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                    >
                      がんばります！
                    </button>
                  </div>
                )}

                {/* フェーズ1: 謎解き入力 (stepX_1) */}
                {!state.phase1Complete && activeTab.endsWith('_1') && (
                  <InputField onSubmit={handleRiddleSubmit} placeholder="謎の答えを入力..." />
                )}

                {/* フェーズ2: アイテム選択 (stepX_2) */}
                {activeTab.endsWith('_2') && activeTab !== 'last_2' && (
                  <div className="flex gap-2">
                    <select id={`select-${activeTab}`} className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-cyan-400">
                      <option value="">アイテムを選択</option>
                      {/* Step 1-2以降: S字フック, 制服 */}
                      {['step1_2', 'step2_2', 'step3_2', 'step4_2'].includes(activeTab) && (
                        <>
                          <option value="S字フック">S字フック</option>
                          <option value="制服">制服</option>
                        </>
                      )}
                      {/* Step 2-2以降: ドライヤー, ハブラシ, 浴衣, トイレ */}
                      {['step2_2', 'step3_2', 'step4_2'].includes(activeTab) && (
                        <>
                          <option value="ドライヤー">ドライヤー</option>
                          <option value="ハブラシ">ハブラシ</option>
                          <option value="浴衣">浴衣</option>
                          <option value="トイレ">トイレ</option>
                        </>
                      )}
                      {/* Step 3-2以降: 墨汁, 饅頭, 扇子, イス, 茎, 木, 盆, 缶, 蜘蛛 */}
                      {['step3_2', 'step4_2'].includes(activeTab) && (
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
                      {/* Step 4-2: 水, 冷蔵庫 */}
                      {activeTab === 'step4_2' && (
                        <>
                          <option value="水">水</option>
                          <option value="冷蔵庫">冷蔵庫</option>
                        </>
                      )}
                    </select>
                    {activeTab !== 'step4_2' && (
                      <button
                        onClick={() => {
                          const val = (document.getElementById(`select-${activeTab}`) as HTMLSelectElement).value;
                          if (val) handleItemSelect(val);
                        }}
                        className="bg-cyan-900 text-cyan-100 px-4 py-2 rounded font-bold hover:bg-cyan-800"
                      >
                        送信
                      </button>
                    )}
                  </div>
                )}

                {/* Step 4-2: 3パーツ選択 */}
                {activeTab === 'step4_2' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <span className="text-neutral-500 flex items-center">の</span>
                      <select id="s4-pos" className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-2 py-2 text-sm">
                        <option value="上">上</option>
                        <option value="中">真ん中</option>
                        <option value="横">横</option>
                        <option value="下">下</option>
                      </select>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-neutral-500">を</span>
                      <select id="s4-act" className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-2 py-2 text-sm">
                        <option value="蓋を取る">蓋を取る</option>
                        <option value="半分食べる">半分食べる</option>
                        <option value="全部食べる">全部食べる</option>
                        <option value="半分飲む">半分飲む</option>
                        <option value="全部飲む">全部飲む</option>
                        <option value="開く">開く</option>
                        <option value="閉じる">閉じる</option>
                        <option value="折る">折る</option>
                        <option value="畳む">畳む</option>
                      </select>
                      <span className="text-neutral-500">。それを</span>
                      <select id="s4-view" className="flex-1 bg-black text-cyan-300 border border-cyan-800 rounded px-2 py-2 text-sm">
                        <option value="上">上</option>
                        <option value="中">真ん中</option>
                        <option value="横">横</option>
                        <option value="斜め">斜め</option>
                        <option value="下">下</option>
                      </select>
                      <span className="text-neutral-500">から見る</span>
                      <button
                        onClick={() => {
                          const i = (document.getElementById(`select-${activeTab}`) as HTMLSelectElement).value;
                          const p = (document.getElementById('s4-pos') as HTMLSelectElement).value;
                          const a = (document.getElementById('s4-act') as HTMLSelectElement).value;
                          const v = (document.getElementById('s4-view') as HTMLSelectElement).value;
                          handleStep4Select(i, p, a, v);
                        }}
                        className="bg-cyan-900 text-cyan-100 px-6 py-2 rounded font-bold hover:bg-cyan-800"
                      >
                        実行
                      </button>
                    </div>
                  </div>
                )}

                {/* Last Step 1: ドライヤー強制選択 */}
                {activeTab === 'last_1' && (
                  <div className="flex gap-2">
                    <select disabled className="flex-1 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded px-3 py-2 text-sm">
                      <option>ドライヤー</option>
                    </select>
                    <button onClick={() => handleItemSelect('ドライヤー_forced')} className="bg-red-900 text-red-100 px-4 py-2 rounded font-bold hover:bg-red-800">
                      送信
                    </button>
                  </div>
                )}

                {/* Last Step 2: 謎解き -> 自由入力 */}
                {activeTab === 'last_2' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (!unlockedTabs.includes('situation_review')) {
                            setUnlockedTabs(prev => [...prev, 'situation_review']);
                          }
                          setActiveTab('situation_review');
                        }}
                        className="text-[10px] bg-cyan-900/40 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-full hover:bg-cyan-800 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(8,145,178,0.2)] font-sans"
                      >
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                        状況整理を行う
                      </button>
                    </div>
                    {!state.phase1Complete ? (
                      <InputField onSubmit={handleRiddleSubmit} placeholder="LAST 2の謎の赤枠内に入るものを答えよ" />
                    ) : (
                      <div className="flex flex-col gap-2 p-2 border border-pink-900/30 bg-pink-900/5 rounded">
                        <p className="text-[10px] text-pink-400 font-bold uppercase tracking-tighter mb-1 font-sans">自由入力モード起動中</p>
                        <InputField
                          onSubmit={(val) => handleItemSelect(val)}
                          placeholder="アナウンスしたい単語を入力 (4文字以内)..."
                          maxLength={4}
                        />
                      </div>
                    )}
                  </div>
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

  if (!gameStarted) {
    return (
      <main className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30">
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950 flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold text-cyan-400 tracking-tighter italic animate-in zoom-in duration-1000">
              S.R.F.
              <br />
              <span className="text-2xl">SPATIAL RESCUE FORCE</span>
            </h2>
            <p className="text-neutral-500 text-xs tracking-widest uppercase">閉鎖空間救助隊：現場研修システム</p>
          </div>

          <div className="w-full max-w-sm space-y-4 bg-neutral-900/50 p-6 rounded-lg border border-cyan-900/30 font-sans">
            <h3 className="text-cyan-400 font-bold text-sm border-b border-cyan-900 pb-2 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              注意事項
            </h3>
            <ul className="text-xs text-neutral-300 space-y-3 leading-relaxed list-disc pl-4">
              <li>本システムは閉鎖空間内に閉じ込められた対象者の救出を目的としています。</li>
              <li>救助には高い推察力と論理的思考が必要とされます。</li>
              <li>システム内の情報は常に最新のものを確認してください。</li>
              <li>想定救助時間は180分以内です。</li>
            </ul>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full max-w-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-[0.2em] text-sm"
          >
            研修を開始する
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 max-w-2xl mx-auto border-x border-neutral-800">
      {/* Header */}
      <h1 className="text-xl font-bold text-cyan-400 p-3 text-center tracking-widest border-b border-cyan-900 w-full bg-black shrink-0">
        ライクアルファベット
      </h1>

      {/* Navigation */}
      {renderTabNavigation()}

      {/* Main Content Area */}
      {activeTab === 'clear' ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-8 animate-in fade-in duration-1000">
          <div className="space-y-4">
            <h2 className="text-4xl text-cyan-400 font-bold tracking-tighter italic animate-pulse">MISSION COMPLETE</h2>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            <p className="text-neutral-300 font-sans">対象者の救出に成功しました。</p>
          </div>
          
          <a
            href="https://twitter.com/intent/tweet?text=%E6%95%91%E5%87%BA%E3%81%AB%E6%88%90%E5%8A%9F%E3%81%97%E3%81%9F%EF%BC%81%0A%0A%5B%E3%81%93%E3%81%93%E3%81%AB%E3%83%AA%E3%83%B3%E3%82%AF%5D%0A&openExternalBrowser=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neutral-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            結果をポストする
          </a>
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

      {/* Popup Message Overlay */}
      {popupMessage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-300"
          onClick={() => setPopupMessage(null)}
        >
          <div
            className="bg-neutral-900 border-2 border-cyan-500 rounded-lg p-6 max-w-xs w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transform transition-all animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center border border-cyan-400">
                <span className="text-cyan-400 font-bold">先</span>
              </div>
              <div className="text-cyan-400 font-bold tracking-widest text-sm">先輩からの助言</div>
            </div>
            <p className="text-neutral-100 text-lg mb-6 leading-relaxed font-sans">{popupMessage.replace('先輩：', '')}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition-colors uppercase tracking-widest text-sm"
            >
              了解
            </button>
          </div>
        </div>
      )}

      {/* Popup Message Overlay */}
      {popupMessage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-300"
          onClick={() => setPopupMessage(null)}
        >
          <div
            className="bg-neutral-900 border-2 border-cyan-500 rounded-lg p-6 max-w-xs w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transform transition-all animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center border border-cyan-400">
                <span className="text-cyan-400 font-bold">先</span>
              </div>
              <div className="text-cyan-400 font-bold tracking-widest text-sm">先輩からの助言</div>
            </div>
            <p className="text-neutral-100 text-lg mb-6 leading-relaxed font-sans">{popupMessage.replace('先輩：', '')}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition-colors uppercase tracking-widest text-sm"
            >
              了解
            </button>
          </div>
        </div>
      )}

      {/* Hint Dialog */}
      <HintDialog
        hints={(() => {
          const allHints = HINTS[activeTab] || [];
          if (activeTab === 'last_2' && !unlockedTabs.includes('situation_review')) {
            // "ここから先は情報整理ボタンを押してから解放される" is at index 4
            return allHints.slice(0, 5);
          }
          return allHints;
        })()}
        isOpen={showHints}
        onClose={() => setShowHints(false)}
      />
    </main>
  );
}
