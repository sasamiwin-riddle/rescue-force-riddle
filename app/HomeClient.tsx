"use client";

import { useState, useRef, useEffect } from 'react';
import { Step, validateRiddle, validateItemSelection, ActionResponse } from './actions';
import { MessageDialog } from '../components/MessageDialog';
import { ImageViewer } from '../components/ImageViewer';
import { InputField } from '../components/InputField';
import { HintDialog } from '../components/HintDialog';
import { CustomSelect } from '../components/CustomSelect';
import { HINTS } from './hints';

const ALL_STEPS: Step[] = ['intro', 'step0', 'step0_2', 'manual', 'step1_1', 'step1_2', 'step2_1', 'step2_2', 'step3_1', 'step3_2', 'step4_1', 'step4_2', 'last_1', 'last_2', 'last_3', 'last_4', 'situation_review', 'clear'];

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
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({
    who: '',
    where: '',
    miss: '',
    item: '',
    q5: '',
    q6: '',
    timing: ''
  });
  const [showQ5, setShowQ5] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [s4Pos, setS4Pos] = useState("");
  const [s4Act, setS4Act] = useState("");
  const [s4View, setS4View] = useState("");
  const [last2Text, setLast2Text] = useState("");
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  const [stepStates, setStepStates] = useState<Record<Step, StepState>>({
    intro: {
      messages: [
        { sender: '救助システム', text: '【救助システムログ】\n空間の異常を検知。救助対象者の生体信号を確認しました。' },
        { sender: '先輩', text: 'やあ新人くん。早速だがこれから現場研修だ。私は君のサポートを担当する先見悟（さきみさとる）だ。' },
        { sender: '先輩', text: '君も知っての通り、私たちの仕事は閉鎖空間に閉じ込められた人物の救出だ。マニュアルを見せる前に、まずは1つ謎を解いてもらおう' },
        { sender: '先輩', text: '救助対象者の安全を考慮して、180分以内に救出するぞ！' },
        { sender: '先輩', text: '心配ない。新人内で謎解き力トップの君なら大丈夫だ。私の指示に従って、操作を進めてくれ。' }
      ], phase1Complete: true, isCleared: false
    },
    step0: {
      messages: [
        { sender: '先輩', text: 'まずは閉鎖空間のハッキングを進めるための準備だ。救助システムが生成した謎に回答してくれ。もしも謎が解けなかったり、行き詰まったら先輩HELPボタンを押してくれ。' },
      ], phase1Complete: false, isCleared: false
    },
    step0_2: {
      messages: [
        { sender: '救助システム', text: '次はサーチした場所に、ハッキング液を作成する。どうやら水は最初からあったようだ。この問題を解けば準備完了だ。' },
      ], phase1Complete: false, isCleared: false
    },
    manual: { messages: [{ sender: '先輩', text: '' }], phase1Complete: true, isCleared: false },
    step1_1: { messages: [{ sender: '先輩', text: 'ここまで30分。ここからは繰り返しの手順でハッキングを進めていく。まずは救助システムが出力する謎を解いてくれ。' }], phase1Complete: false, isCleared: false },
    step1_2: { messages: [{ sender: '先輩', text: 'マニュアルの確認は済んだか？では「s」のシルエットに最も近いアイテムを登場したイラストの中から選んで送信してくれ。' }], phase1Complete: true, isCleared: false },
    step2_1: { messages: [{ sender: '先輩', text: 'お見事！この流れの繰り返しだ。' }, { sender: '先輩', text: 'ここまで54分、順調だな。' }], phase1Complete: false, isCleared: false },
    step2_2: { messages: [{ sender: '先輩', text: 'よし、正解だ！マニュアルの通り、指示がない場合は大文字アルファベットに変換する。アルファベットの12番目「L」のシルエットに最も近いアイテムを登場したイラストの中から選んで送信してくれ。' }], phase1Complete: true, isCleared: false },
    step3_1: { messages: [{ sender: '先輩', text: '重いアイテムでも運べる機能が解放された。マニュアルにも追加されているから確認しておいてくれ！' }, { sender: '先輩', text: 'ここまで90分、順調だな。' }], phase1Complete: false, isCleared: false },
    step3_2: { messages: [{ sender: '先輩', text: '冴えてるね！さあ、「h」のシルエットに最も近いアイテムを登場したイラストの中から選ぼう。' }], phase1Complete: true, isCleared: false },
    step4_1: { messages: [{ sender: '先輩', text: 'ここまで120分。いよいよ最後の謎だ。' }], phase1Complete: false, isCleared: false },
    step4_2: {
      messages: [{ sender: '先輩', text: 'また「L」か。投入したアイテムは消滅する。二つも同じドライヤーがあるか分からない。今追加された機能の「一旦転送」を使う方が良さげだな。マニュアルとイラストを確認して、最後のアイテムはどうすれば良いか考えてくれ' },
      { sender: '先輩', text: '壊したり分解したりするとアイテムは判定されないから気をつけるんだ' },
      ], phase1Complete: true, isCleared: false
    },
    last_1: { messages: [{ sender: '先輩', text: 'ここまで144分か。いよいよ最後の山場だ。' }, { sender: '先輩', text: '私の推測だと答えではないと思うが、念のため可能性を潰しておきたい。「ドライヤー」を再度選択してくれ' }], phase1Complete: true, isCleared: false },
    last_2: {
      messages: [{ sender: '先輩', text: 'マニュアルの2ページ目は確認できたか？申し訳ない、この救助システムのバージョンだと、イラストと実物が異なることを失念していた' },
      { sender: '先輩', text: 'だが、何のアイテムが良いか私はすでに検討がついた。この謎は救助システムから出力された謎に少し書き加えたものだ。私のこの謎を解いて、まずは状況を整理してみてくれ' },
      { sender: '先輩', text: 'もしもイラスト数最大10個が適用されていなかった場合、こうだったかもしれないと予測したものだ。謎の緑色の部分が書き加えた部分だ。変化を加えたことで、1つだけより具体的になったイラストの名称を答えてくれ' },
      { sender: '先輩', text: 'ヒントを聞いても謎が解けなかったり、謎が解けても理由が分からない場合、「状況整理を行う」と言ってくれ' }], phase1Complete: false, isCleared: false
    },
    last_3: {
      messages: [{ sender: '先輩', text: 'その通りだ。その根拠がこの資料だ。一度誤答した際に解放されたスキャン機能だ' },
      { sender: '先輩', text: '5分間で、登場済みイラストのアイテムに触れた順に記録されている。2行目の記録を見ると、アナウンスを受けてハッキング液にアイテムを提出しに行く際、明らかに外に出ていそうだ' },
      { sender: '先輩', text: 'そしてマニュアル液の違和感を振り返ると、閉鎖空間の場所について一つの結論に辿り着いた' },
      { sender: '先輩', text: '閉鎖空間の場所や救助対象者のスキャン結果に着目して、最後のアイテムを選択肢から選び、詳細な名称まで答えてくれ。' }], phase1Complete: false, isCleared: false
    },
    last_4: {
      messages: [{ sender: '先輩', text: 'ああ、おそらく座椅子だ。だが、写真撮影機能は名称を指定しても発動できない。撮りたいアイテムに触れているものを指定することで該当するのが一つのみにする必要がある' },
      { sender: '先輩', text: 'ふすまを開けて露天風呂から部屋へ入ったと考えると、畳の上にイスが存在しているだろう。もう一つだけ自由入力で指定ができる' },
      { sender: '先輩', text: '座椅子にしか触れていないであろうものを自由入力で答えてくれ。イラストに登場している必要はない' }
      ], phase1Complete: false, isCleared: false
    },
    situation_review: { messages: [], phase1Complete: false, isCleared: false },
    clear: { messages: [{ sender: '救助システム', text: 'MISSION COMPLETE. 対象者の救出に成功しました' }], phase1Complete: true, isCleared: true },
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
    if (activeTab === 'last_4') {
      setSelectedItem("畳");
    } else {
      setSelectedItem("");
    }
  }, [activeTab]);

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

  // Persistence logic
  const [isInitialized, setIsInitialized] = useState(false);

  // 簡易的な難読化関数 (XOR + Base64)
  const obfuscate = (data: any) => {
    const json = JSON.stringify(data);
    const key = "SRF_SECRET_KEY_2026";
    const xored = json.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return btoa(unescape(encodeURIComponent(xored)));
  };

  const deobfuscate = (encoded: string) => {
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const key = "SRF_SECRET_KEY_2026";
      const xored = decoded.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      return JSON.parse(xored);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('rescue-force-progress-v2');
    if (saved) {
      const data = deobfuscate(saved);
      if (data) {
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.unlockedTabs) setUnlockedTabs(data.unlockedTabs);
        if (data.gameStarted) setGameStarted(data.gameStarted);
        if (data.stepStates) setStepStates(data.stepStates);
        if (data.manual2Unlocked) setManual2Unlocked(data.manual2Unlocked);
        if (data.reviewAnswers) setReviewAnswers(data.reviewAnswers);
        if (data.showQ5) setShowQ5(data.showQ5);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const data = {
      activeTab,
      unlockedTabs,
      gameStarted,
      stepStates,
      manual2Unlocked,
      reviewAnswers,
      showQ5
    };
    localStorage.setItem('rescue-force-progress-v2', obfuscate(data));
  }, [isInitialized, activeTab, unlockedTabs, gameStarted, stepStates, manual2Unlocked, reviewAnswers, showQ5]);


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
        if (activeTab === 'last_2') {
          addMessage(activeTab, '先輩', `> 謎の回答: ${answer}`);
          addMessage(activeTab, '先輩', '正解だ。');
        } else {
          addMessage(activeTab, '救助システム', `> 謎の回答: ${answer}`);
        }
        addMessage(activeTab, '救助システム', res.message);

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

        // Step 0 特殊処理: 先輩からのメッセージ
        if (activeTab === 'step0' && res.success) {
          addMessage('step0', '救助システム', 'サーチ完了。上蓋無し。水充填完了済み');
          addMessage('step0', '先輩', '救助システムが空間内の液体を溜めることができる場所を自動で探してくれた。まあ大抵バスタブだな。');
        }

        // Step 0-2 特殊処理: 救助システムからのメッセージ
        if (activeTab === 'step0_2' && res.success) {
          addMessage('step0_2', '救助システム', 'ハッキング液作成完了');
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
  const handleItemSelect = async (selection: any) => {
    try {
      const res = await validateItemSelection(selection, activeTab);
      if (res.success) {
        let displayItem = selection;
        if (typeof selection === 'object' && selection !== null && 'text' in selection) {
          displayItem = selection.text;
        } else if (selection === 'ドライヤー_forced') {
          displayItem = 'ドライヤー';
        }
        addMessage(activeTab, '救助システム', `> アナウンス: ${displayItem}`);
      }

      let itemName = selection;
      if (typeof selection === 'object' && selection !== null && 'item' in selection) {
        itemName = selection.item;
      } else if (selection === 'ドライヤー_forced') {
        itemName = 'ドライヤー';
      }
      handleActionResponse(res, typeof itemName === 'string' ? itemName : undefined);
    } catch (e) {
      // 通信エラー
    }
  };

  // Step 4の特殊選択用
  const handleStep4Select = async (item: string, position: string, action: string, view: string) => {
    try {
      const res = await validateItemSelection({ item, position, action, view }, activeTab);
      if (res.success) {
        addMessage(activeTab, '救助システム', `アクション：一旦転送、残り誤答回数は2回です`);
      }
      handleActionResponse(res, item);
    } catch (e) {
      // 通信エラー
    }
  };

  const handleActionResponse = (res: ActionResponse, itemName?: string) => {
    if (res.success) {
      if (['step1_2', 'step2_2', 'step3_2', 'last_2'].includes(activeTab)) {
        addMessage(activeTab, '救助システム', 'アイテム投入待機...');
        addMessage(activeTab, '救助システム', `「${itemName}」が「${res.answerChar}」と判定されました。`);
      } else if (activeTab === 'step4_2') {
        addMessage(activeTab, '救助システム', 'アイテム投入待機...');
      } else {
        addMessage(activeTab, '救助システム', `SUCCESS: ${res.message}`);
      }
      updateStepState(activeTab, { isCleared: true, errorType: undefined, nextStep: res.nextStep });

      if (res.errorType === 'fridge_1door') {
        // 画像付きメッセージ
        addMessage(activeTab, '先輩', '一旦こちらに転送されてきたが、冷蔵庫が1段しかない...。なるほど、そういうことか...。', '/assets/step4_error_1door.png');
        addMessage(activeTab, '先輩', 'これでもLと言えなくもない、念のため提出してみよう');
        addMessage(activeTab, '救助システム', res.message);
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
        addMessage(activeTab, '救助システム', `アナウンス: ドライヤー`);
        addMessage(activeTab, '救助システム', 'アイテム投入待機...');
        addMessage(activeTab, '救助システム', `「ドライヤー」が「${res.answerChar}」と判定されました。残り誤答回数0回です。`, '/assets/step4_dryer_t.png');
        addMessage(activeTab, '先輩', 'LというよりかT字型ドライヤーだな。だが、これで確率は高まった。');
        addMessage(activeTab, '先輩', '3回失敗したことで、自由入力機能が解放された。ん？おっとすまない、マニュアルの2ページ目の連携が漏れていた。マニュアルを再度確認してみてくれ');
        setManual2Unlocked(true);
        updateStepState('manual', { isCleared: false });
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

  const renderTabNavigation = () => {
    const baseTabs: Step[] = ['intro', 'step0', 'step0_2', 'manual', 'step1_1', 'step1_2', 'step2_1', 'step2_2', 'step3_1', 'step3_2', 'step4_1', 'step4_2', 'last_1', 'last_2', 'last_3', 'last_4', 'situation_review'];
    let displayTabs = [...baseTabs];
    if (manual2Unlocked) {
      displayTabs = displayTabs.filter(t => t !== 'manual');
      const last1Index = displayTabs.indexOf('last_1');
      if (last1Index !== -1) {
        displayTabs.splice(last1Index + 1, 0, 'manual');
      }
    }

    return (
      <div
        ref={tabsContainerRef}
        className="flex w-full min-w-0 overflow-x-auto border-b border-neutral-700 bg-neutral-900 sticky top-0 z-10 no-scrollbar shrink-0"
      >
        {displayTabs
          .filter(step => unlockedTabs.includes(step as Step))
          .map((stepStr, idx) => {
            const step = stepStr as Step;
            const isActive = activeTab === step;
            return (
              <button
                key={step}
                onClick={() => setActiveTab(step)}
                data-active={isActive}
                className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-sm font-bold whitespace-nowrap transition-colors ${isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/20'
                  : 'text-neutral-400 hover:text-cyan-200 hover:bg-neutral-800'
                  }`}
              >
                {step === 'intro' ? 'INTRO' :
                  step === 'step0' ? 'STEP 0-1' :
                    step === 'step0_2' ? 'STEP 0-2' :
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
                                            step === 'last_3' ? 'LAST 3' :
                                              step === 'last_4' ? 'LAST 4' :
                                                step === 'situation_review' ? '状況整理' : 'UNKNOWN'}
              </button>
            );
          })}
      </div>
    );
  };

  const renderActiveStepContent = () => {
    const state = stepStates[activeTab];

    return (
      <div className="flex-1 flex flex-col w-full min-h-0">

        {/* Riddle Image Section */}
        {((activeTab === 'step0' || activeTab === 'step0_2' || activeTab.endsWith('_1') || activeTab === 'last_2' || activeTab === 'last_3') && activeTab !== 'last_1' && activeTab !== 'last_4') || (activeTab === 'last_4' && state.isCleared) ? (
          <div className="p-4 bg-neutral-950 flex justify-center border-b border-neutral-800 shrink-0">
            <div className="w-full max-w-sm aspect-video bg-neutral-800 rounded flex items-center justify-center relative overflow-hidden">
              <ImageViewer step={activeTab} onImageClick={setExpandedImage} />
            </div>
          </div>
        ) : null}

        {activeTab !== 'manual' && activeTab !== 'situation_review' ? (
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-black flex flex-col gap-2 relative">
            {state.messages.map((msg, idx) => (
              <MessageDialog key={idx} sender={msg.sender} text={msg.text} imageSrc={msg.image} onImageClick={setExpandedImage} />
            ))}

            {activeTab === 'last_4' && !state.isCleared && (
              <div className="mt-8 p-6 bg-neutral-900/80 border-2 border-dashed border-cyan-900 rounded-xl flex flex-col gap-6 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-2">
                  <h4 className="text-cyan-400 font-bold text-xs tracking-[0.3em] uppercase">Final Identification</h4>
                  <p className="text-neutral-400 text-[10px]">状況を整理し、空欄を埋めてください</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-lg sm:text-xl font-bold text-neutral-100 font-sans tracking-wider">
                  <div className="w-[140px] border-b-2 border-cyan-400 pb-1">
                    <CustomSelect
                      value={selectedItem}
                      onChange={setSelectedItem}
                      placeholder="アイテム"
                      className="!bg-transparent !border-none !text-cyan-400 !text-center !p-0 !h-auto !shadow-none"
                      options={[
                        { value: "灰皿", label: "灰皿" },
                        { value: "茶碗", label: "茶碗" },
                        { value: "茶筅", label: "茶筅" },
                        { value: "S字フック", label: "S字フック" },
                        { value: "制服", label: "制服" },
                        { value: "靴", label: "靴" },
                        { value: "机", label: "机" },
                        { value: "掛け軸", label: "掛け軸" },
                        { value: "ふすま", label: "ふすま" },
                        { value: "ドライヤー", label: "ドライヤー" },
                        { value: "ハブラシ", label: "ハブラシ" },
                        { value: "浴衣", label: "浴衣" },
                        { value: "畳", label: "畳" },
                        { value: "カミソリ", label: "カミソリ" },
                        { value: "墨汁", label: "墨汁" },
                        { value: "饅頭", label: "饅頭" },
                        { value: "扇子", label: "扇子" },
                        { value: "イス", label: "イス" },
                        { value: "茎", label: "茎" },
                        { value: "木", label: "木" },
                        { value: "盆", label: "盆" },
                        { value: "缶", label: "缶" },
                        { value: "蜘蛛", label: "蜘蛛" },
                        { value: "水", label: "水" },
                        { value: "冷蔵庫", label: "冷蔵庫" },
                      ]}
                    />
                  </div>
                  <span>に触れている</span>
                  <div className="w-[100px] border-b-2 border-cyan-400 pb-1">
                    <input
                      type="text"
                      maxLength={4}
                      value={last2Text}
                      onChange={(e) => setLast2Text(e.target.value)}
                      placeholder="？"
                      className="w-full bg-transparent border-none text-center text-cyan-400 focus:outline-none placeholder:text-neutral-700"
                    />
                  </div>
                  <span>座椅子</span>
                </div>

                <button
                  onClick={() => handleItemSelect({ item: selectedItem, text: last2Text })}
                  className="mx-auto px-10 py-3 bg-cyan-900/40 border border-cyan-500 text-cyan-100 rounded-full font-bold hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm tracking-widest uppercase"
                >
                  転送実行
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : activeTab === 'manual' ? (
          /* MANUAL タブ専用のメインコンテンツ */
          <div key="manual" className="flex-1 overflow-y-auto p-4 bg-neutral-950">
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
                    <p className="text-xs text-neutral-400">自動でアイテムに防水加工を施し、水の影響を受けなくなる</p>
                  </div>

                  {stepStates['step1_2'].isCleared && (
                    <div className="animate-in fade-in duration-700">
                      <p className="text-cyan-400 font-bold underline mb-1">■ 救助対象者をリアルタイムスキャン (情報取得)</p>
                      <p className="text-xs text-neutral-400">異常空間内の人物と空気の状態を常に取得します。</p>
                      <p className="text-xs text-neutral-400">最新スキャン結果：女性一人、高校生。体温正常。気温8℃。湿度40%<br />現在触れているもの：浴衣、畳</p>
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
                    const next = manual2Unlocked ? 'last_2' : 'step1_1';
                    if (!unlockedTabs.includes(next)) {
                      setUnlockedTabs(prev => [...prev, next]);
                    }
                    setTimeout(() => setActiveTab(next), 500);
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
          <div key="situation_review" className="flex-1 overflow-y-auto p-4 bg-neutral-950 font-sans">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-cyan-400 font-bold text-lg tracking-tighter uppercase italic">状況整理シート</h3>
              </div>

              <div className="space-y-6 sm:space-y-8 bg-neutral-900/50 p-4 sm:p-6 rounded-lg border border-cyan-900/30">
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
                  <p className="text-sm text-neutral-300">2. イラスト数最大10個までが適用されたのはどのタイミングからか？</p>
                  <select
                    value={reviewAnswers.timing}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, timing: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.timing === '最初' ? 'border-green-500 text-green-400' : reviewAnswers.timing ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="最初">ハッキング液作成直後（最初から）</option>
                    <option value="STEP2">S字フック提出後（STEP2から）</option>
                    <option value="STEP4">イス提出後（STEP4から）</option>
                  </select>
                </div>

                {/* 質問3 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">3. なぜハッキング液の温度が最初から高くなっていたのか？</p>
                  <select
                    value={reviewAnswers.where}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, where: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.where === 'お風呂' ? 'border-green-500 text-green-400' : reviewAnswers.where ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="ポット">おそらくポットで最初から沸いていたから</option>
                    <option value="マグマ">おそらくマグマだったから</option>
                    <option value="お風呂">おそらくお風呂に最初からお湯が張られていたから</option>
                  </select>
                </div>

                {/* 質問4 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">4. ところで、外気温は何℃か？</p>
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

                {/* 質問5 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">5. この気温の中、2時間30分経ってもハッキング液が冷めないのはなぜか？</p>
                  <select
                    value={reviewAnswers.item}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, item: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.item === '元々' ? 'border-green-500 text-green-400' : reviewAnswers.item ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="蓋">蓋を一度も取っていないから</option>
                    <option value="追い炊き">追い炊きボタンを押し続けているから</option>
                    <option value="元々">おそらく元々温度を保つ設備になっているから</option>
                  </select>
                </div>

                {/* 質問6 */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-300">6. ハッキング液は何に溶けていますか？</p>
                  <select
                    value={reviewAnswers.q5}
                    onChange={(e) => setReviewAnswers(prev => ({ ...prev, q5: e.target.value }))}
                    className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.q5 === '温泉' ? 'border-green-500 text-green-400' : reviewAnswers.q5 ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                  >
                    <option value="">選択してください</option>
                    <option value="温泉">温泉</option>
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
                    <p className="text-sm text-neutral-300">7. 温泉と温泉饅頭。歯ブラシ、カミソリ、1段の小さい冷蔵庫、浴衣、畳、灰皿...。ここはどういう場所の可能性が高い？</p>
                    <select
                      value={reviewAnswers.q6}
                      onChange={(e) => setReviewAnswers(prev => ({ ...prev, q6: e.target.value }))}
                      className={`w-full bg-black border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${reviewAnswers.q6 === '旅館' ? 'border-green-500 text-green-400' : reviewAnswers.q6 ? 'border-red-500 text-red-400' : 'border-neutral-700 text-neutral-400'}`}
                    >
                      <option value="">選択してください</option>
                      <option value="自宅">自宅</option>
                      <option value="学校">学校</option>
                      <option value="旅館">旅館</option>
                    </select>
                  </div>
                )}
              </div>

              {reviewAnswers.who === '37' && reviewAnswers.timing === 'STEP2' && reviewAnswers.where === 'お風呂' && reviewAnswers.miss === '8' && reviewAnswers.item === '元々' && reviewAnswers.q5 === '温泉' && reviewAnswers.q6 === '旅館' && (
                <div className="animate-in zoom-in duration-500 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-center">
                  <p className="text-green-400 font-bold tracking-widest text-sm">状況整理完了</p>
                  <p className="text-xs text-neutral-300 mt-2">LAST 2に戻り、答えを導いてください。</p>
                </div>
              )}
              <button
                onClick={() => setActiveTab('last_2')}
                className="w-full bg-cyan-900/30 text-cyan-400 py-3 rounded font-bold border border-cyan-800 hover:bg-cyan-800/50 hover:text-cyan-100 transition-all text-xs uppercase tracking-[0.2em] mt-10 shadow-[0_0_15px_rgba(8,145,178,0.1)] flex items-center justify-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                LAST 2に戻る
              </button>
            </div>
          </div>
        )}

        {/* Input / Action Area */}
        {activeTab !== 'manual' && activeTab !== 'situation_review' && (
          <div className={`bg-neutral-900 border-t border-neutral-700 p-1.5 shrink-0 transition-all duration-300 relative ${isInputCollapsed ? 'h-[36px]' : ''}`}>
            {/* Collapse Toggle Button */}
            {!state.isCleared && (
              <button
                onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                className="absolute -top-10 right-4 bg-neutral-900/80 border border-neutral-700 text-neutral-400 text-[10px] px-3 py-1.5 rounded-t-md hover:text-cyan-400 transition-colors flex items-center gap-2 backdrop-blur-sm shadow-[-5px_-5px_10px_rgba(0,0,0,0.2)]"
              >
                <span className={`w-2 h-2 rounded-full ${isInputCollapsed ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
                {isInputCollapsed ? '回答欄: OPEN' : '回答欄: CLOSE'}
              </button>
            )}

            {!state.isCleared && !isInputCollapsed && (
              <>
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  {activeTab === 'last_2' && (
                    <button
                      onClick={() => {
                        if (!unlockedTabs.includes('situation_review')) {
                          setUnlockedTabs(prev => [...prev, 'situation_review']);
                        }
                        setActiveTab('situation_review');
                      }}
                      className="text-[10px] bg-cyan-900/40 border border-cyan-800 text-cyan-300 px-3 py-1 rounded-full hover:bg-cyan-800 transition-all flex items-center gap-1.5 font-sans"
                    >
                      <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></span>
                      状況整理
                    </button>
                  )}
                  <button
                    onClick={handleHelp}
                    disabled={!HINTS[activeTab] || HINTS[activeTab].length === 0 || (activeTab === 'last_2' && state.phase1Complete)}
                    className="text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-300 px-2.5 py-1 rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-auto"
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
                        if (!unlockedTabs.includes('step0')) {
                          setUnlockedTabs(prev => [...prev, 'step0']);
                          setTimeout(() => setActiveTab('step0'), 500);
                        }
                      }}
                      className="w-full bg-cyan-900/40 text-cyan-400 border border-cyan-800 rounded-md py-3 font-bold hover:bg-cyan-800 hover:text-cyan-100 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                    >
                      がんばります！
                    </button>
                  </div>
                )}

                {/* フェーズ1: 謎解き入力 (step0, step0_2, stepX_1, last_2) */}
                {!state.phase1Complete && (activeTab === 'step0' || activeTab === 'step0_2' || activeTab.endsWith('_1') || activeTab === 'last_2') && (
                  <InputField onSubmit={handleRiddleSubmit} placeholder="謎の答えを入力..." />
                )}

                {/* フェーズ2: アイテム選択 (stepX_2) */}
                {activeTab.endsWith('_2') && activeTab !== 'last_2' && (
                  <div className="flex gap-2">
                    <CustomSelect
                      value={selectedItem}
                      onChange={setSelectedItem}
                      placeholder="アイテムを選択"
                      className="flex-1"
                      options={[
                        { value: "灰皿", label: "灰皿" },
                        { value: "茶碗", label: "茶碗" },
                        { value: "茶筅", label: "茶筅" },
                        { value: "S字フック", label: "S字フック" },
                        { value: "制服", label: "制服" },
                        { value: "靴", label: "靴" },
                        { value: "机", label: "机" },
                        { value: "掛け軸", label: "掛け軸" },
                        { value: "ふすま", label: "ふすま" },
                        ...((['step2_2', 'step3_2', 'step4_2'].includes(activeTab)) ? [
                          { value: "ドライヤー", label: "ドライヤー" },
                          { value: "ハブラシ", label: "ハブラシ" },
                          { value: "浴衣", label: "浴衣" },
                          { value: "畳", label: "畳" },
                          { value: "カミソリ", label: "カミソリ" },
                        ] : []),
                        ...((['step3_2', 'step4_2'].includes(activeTab)) ? [
                          { value: "墨汁", label: "墨汁" },
                          { value: "饅頭", label: "饅頭" },
                          { value: "扇子", label: "扇子" },
                          { value: "イス", label: "イス" },
                          { value: "茎", label: "茎" },
                          { value: "木", label: "木" },
                          { value: "盆", label: "盆" },
                          { value: "缶", label: "缶" },
                          { value: "蜘蛛", label: "蜘蛛" },
                        ] : []),
                        ...((activeTab === 'step4_2') ? [
                          { value: "水", label: "水" },
                          { value: "冷蔵庫", label: "冷蔵庫" },
                        ] : []),
                      ]}
                    />
                    {activeTab !== 'step4_2' && (
                      <button
                        onClick={() => {
                          if (selectedItem) handleItemSelect(selectedItem);
                        }}
                        className="bg-cyan-900 text-cyan-100 px-4 py-2 rounded font-bold hover:bg-cyan-800 transition-colors h-[40px]"
                      >
                        送信
                      </button>
                    )}
                  </div>
                )}

                {/* Step 4-2: 3パーツ選択 */}
                {activeTab === 'step4_2' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-neutral-500 text-xs shrink-0">の</span>
                      <CustomSelect
                        value={s4Pos}
                        onChange={setS4Pos}
                        className="flex-1"
                        placeholder="場所"
                        options={[
                          { value: "上", label: "上" },
                          { value: "中", label: "真ん中" },
                          { value: "横", label: "横" },
                          { value: "下", label: "下" },
                        ]}
                      />
                      <span className="text-neutral-500 text-xs shrink-0">を</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <CustomSelect
                        value={s4Act}
                        onChange={setS4Act}
                        className="flex-1 min-w-[120px]"
                        placeholder="アクション"
                        options={[
                          { value: "蓋を取る", label: "蓋を取る" },
                          { value: "半分食べる", label: "半分食べる" },
                          { value: "全部食べる", label: "全部食べる" },
                          { value: "半分飲む", label: "半分飲む" },
                          { value: "全部飲む", label: "全部飲む" },
                          { value: "開く", label: "開く" },
                          { value: "閉じる", label: "閉じる" },
                          { value: "折る", label: "折る" },
                          { value: "畳む", label: "畳む" },
                        ]}
                      />
                      <span className="text-neutral-500 text-xs shrink-0">。それを</span>
                      <CustomSelect
                        value={s4View}
                        onChange={setS4View}
                        className="flex-1 min-w-[80px]"
                        placeholder="視点"
                        options={[
                          { value: "上", label: "上" },
                          { value: "中", label: "真ん中" },
                          { value: "横", label: "横" },
                          { value: "斜め", label: "斜め" },
                          { value: "下", label: "下" },
                        ]}
                      />
                      <span className="text-neutral-500 text-xs shrink-0">から見る</span>
                      <button
                        onClick={() => {
                          if (!selectedItem || !s4Pos || !s4Act || !s4View) {
                            setPopupMessage('先輩：全ての項目を選択してくれ');
                            return;
                          }
                          handleStep4Select(selectedItem, s4Pos, s4Act, s4View);
                        }}
                        className="w-full sm:w-auto bg-cyan-900 text-cyan-100 px-6 py-2 rounded font-bold hover:bg-cyan-800 transition-colors h-[40px]"
                      >
                        実行
                      </button>
                    </div>
                  </div>
                )}

                {/* Last Step 1: ドライヤー強制選択 */}
                {activeTab === 'last_1' && (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded px-3 py-2 text-sm h-[40px] flex items-center">
                      ドライヤー
                    </div>
                    <button onClick={() => handleItemSelect('ドライヤー_forced')} className="bg-red-900 text-red-100 px-4 py-2 rounded font-bold hover:bg-red-800 h-[40px]">
                      送信
                    </button>
                  </div>
                )}

                {/* Last Step 3: アイテム選択 + 自由入力 */}
                {activeTab === 'last_3' && (
                  <div className="flex flex-col gap-4 p-4 border border-pink-900/30 bg-pink-900/5 rounded">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-pink-400 font-bold uppercase tracking-tighter mb-1.5 font-sans">1. アイテムを選択</p>
                        <CustomSelect
                          value={selectedItem}
                          onChange={setSelectedItem}
                          placeholder="選択..."
                          className="w-full"
                          options={[
                            { value: "灰皿", label: "灰皿" },
                            { value: "茶碗", label: "茶碗" },
                            { value: "茶筅", label: "茶筅" },
                            { value: "靴", label: "靴" },
                            { value: "机", label: "机" },
                            { value: "掛け軸", label: "掛け軸" },
                            { value: "ふすま", label: "ふすま" },
                            { value: "S字フック", label: "S字フック" },
                            { value: "制服", label: "制服" },
                            { value: "ドライヤー", label: "ドライヤー" },
                            { value: "ハブラシ", label: "ハブラシ" },
                            { value: "浴衣", label: "浴衣" },
                            { value: "畳", label: "畳" },
                            { value: "カミソリ", label: "カミソリ" },
                            { value: "墨汁", label: "墨汁" },
                            { value: "饅頭", label: "饅頭" },
                            { value: "扇子", label: "扇子" },
                            { value: "イス", label: "イス" },
                            { value: "茎", label: "茎" },
                            { value: "木", label: "木" },
                            { value: "盆", label: "盆" },
                            { value: "缶", label: "缶" },
                            { value: "蜘蛛", label: "蜘蛛" },
                            { value: "水", label: "水" },
                            { value: "冷蔵庫", label: "冷蔵庫" },
                          ]}
                        />
                      </div>

                      <div>
                        <p className="text-[10px] text-pink-400 font-bold uppercase tracking-tighter mb-1.5 font-sans">2. 詳細名称を入力 (4文字以内)</p>
                        <div className="relative">
                          <span className="absolute left-3 inset-y-0 flex items-center text-cyan-500 font-bold pointer-events-none">{'>'}</span>
                          <input
                            type="text"
                            value={last2Text}
                            onChange={(e) => setLast2Text(e.target.value.slice(0, 4))}
                            placeholder="単語を入力..."
                            className="w-full bg-black/50 border border-neutral-700 text-cyan-50 placeholder-neutral-500 rounded-md py-2 pl-8 pr-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedItem && last2Text.trim()) {
                            handleItemSelect({ item: selectedItem, text: last2Text.trim() } as any);
                          } else {
                            setPopupMessage('先輩：アイテム選択と詳細名称、両方必要だ');
                          }
                        }}
                        disabled={!selectedItem || !last2Text.trim()}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded transition-all transform hover:scale-[1.01] shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                      >
                        決定を送信
                      </button>
                    </div>
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
      <main className="flex h-screen w-full flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 overflow-y-auto">
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950 flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-tighter italic animate-in zoom-in duration-1000">
              LIKE ALPHABET
              <br />
              <span className="text-xl sm:text-2xl">謎解きゲーム</span>
            </h2>
          </div>

          <div className="w-full max-w-sm space-y-4 bg-neutral-900/50 p-4 sm:p-6 rounded-lg border border-cyan-900/30 font-sans">
            <h3 className="text-cyan-400 font-bold text-sm border-b border-cyan-900 pb-2 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              注意事項
            </h3>
            <ul className="text-xs text-neutral-300 space-y-3 leading-relaxed list-disc pl-4">
              <li>LineやX等のアプリ内ブラウザからアクセスすると正常に動作しない可能性がございます。</li>
              <li>特別な知識は不要ですが、インターネット検索をしていただいても構いません。</li>
              <li>スマホを想定していますが、PCでもプレイ可能です</li>
              <li>ヒント（先輩HELP）や手助けを利用しなくても最後まで解くことが可能です。</li>
              <li>ヒントは段階的に用意されています。ペナルティやクリアランク、エクストラなどもございません。</li>
              <li>ゲーム全体で60分を想定時間として設定していますが、諸々の作業や救出のリアリティを鑑みて3倍の時間が作中で流れます。タイムアタックをする場合は1/3にしてお考えください。</li>
            </ul>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full max-w-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-[0.2em] text-sm"
          >
            ゲームスタート
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full max-w-2xl flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 mx-auto border-x border-neutral-800 overflow-hidden">
      {/* Header */}
      <h1 className="text-xl font-bold text-cyan-400 p-3 text-center tracking-widest border-b border-cyan-900 w-full bg-black shrink-0">
        Like Alphabet
      </h1>

      {/* Navigation */}
      {renderTabNavigation()}

      {/* Main Content Area */}
      {activeTab === 'clear' ? (
        <div className="flex-1 overflow-y-auto p-8 text-center flex flex-col items-center gap-8 animate-in fade-in duration-1000">
          <div className="w-full flex flex-col items-center justify-start gap-8 min-h-min pb-32">
            <div className="max-w-sm w-full animate-in zoom-in duration-1000 delay-300">
              <img
                src="/assets/clear_item.png"
                alt="Clear Item"
                className="w-full rounded-lg border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] cursor-zoom-in hover:scale-[1.02] transition-transform"
                onClick={() => setExpandedImage('/assets/clear_item.png')}
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl text-cyan-400 font-bold tracking-tighter italic animate-pulse">MISSION COMPLETE</h2>
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
              <p className="text-neutral-300 font-sans">対象者の救出に成功しました。</p>
              <div className="max-w-sm w-full animate-in zoom-in duration-1000 delay-500 pt-4">
                <img
                  src="/assets/clear.png"
                  alt="Clear Graphic"
                  className="w-full rounded-lg border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] cursor-zoom-in hover:scale-[1.02] transition-transform"
                  onClick={() => setExpandedImage('/assets/clear.png')}
                />
              </div>
            </div>

            <a
              href="https://twitter.com/intent/tweet?text=%23LikeA%E8%AC%8E%0ALike%20Alphabet%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81%EF%BC%81%EF%BC%81%0A%0Ahttps%3A%2F%2Flike-alphabet-riddle.vercel.app%2F%3Fclear%3Dtrue"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neutral-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              結果をポストする
            </a>

            <div className="mt-16 pt-10 border-t border-cyan-900/30 w-full max-w-sm space-y-8 text-neutral-500 font-sans tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
              <div className="flex flex-col items-center gap-2">
                <span className="text-cyan-800 font-bold uppercase tracking-[0.3em] text-[11px]">Created by</span>
                <span className="text-neutral-200 font-medium text-lg">ささみカツ</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-cyan-800 font-bold uppercase tracking-[0.3em] text-[11px]">Special Thanks</span>
                <div className="flex flex-col items-center gap-1.5 text-neutral-300 text-sm">
                  <span>まいたけ@三度の飯と謎解きが好き</span>
                  <span>カク</span>
                  <span>Lexer</span>
                </div>
              </div>
            </div>
          </div>
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
