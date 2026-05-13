"use server";

export type Step = 'intro' | 'step0' | 'step1_1' | 'manual' | 'step1_2' | 'step2_1' | 'step2_2' | 'step3_1' | 'step3_2' | 'step4_1' | 'step4_2' | 'last_1' | 'last_2' | 'situation_review' | 'clear';

export interface ActionResponse {
  success: boolean;
  message: string;
  isPhase1Complete?: boolean;
  nextStep?: Step;
  errorType?: 'wrong' | 'fridge_1door' | 'dryer_t';
  answerChar?: string;
}

// 簡単な表記揺れ吸収
function normalizeString(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .trim()
    .toLowerCase();
}

// Riddle parts: stepX_1
const RIDDLE_ANSWERS: Record<string, RegExp> = {
  'step0': /^(フレッシュ|ふれっしゅ)$/,
  'step1_1': /^(s|S|ｓ|Ｓ|えす|エス)$/,
  'step2_1': /^(12|１２|える|エル)$/,
  'step3_1': /^(h|H|ｈ|Ｈ|えいち|エイチ)$/,
  'step4_1': /^(l|L|ｌ|Ｌ|える|エル)$/,
  'last_2': /^(温泉饅頭|おんせんまんじゅう|オンセンマンジュウ)$/,
};

export async function validateRiddle(answer: string, currentStep: Step): Promise<ActionResponse> {
  const normalized = normalizeString(answer);
  const pattern = RIDDLE_ANSWERS[currentStep];

  if (pattern && pattern.test(normalized)) {
    // Determine the next choice step
    let nextStep: Step | undefined;
    if (currentStep === 'step0') nextStep = 'manual';
    else if (currentStep === 'step1_1') nextStep = 'step1_2';
    else if (currentStep === 'step2_1') nextStep = 'step2_2';
    else if (currentStep === 'step3_1') nextStep = 'step3_2';
    else if (currentStep === 'step4_1') nextStep = 'step4_2';
    else if (currentStep === 'last_2') {
      return {
        success: true,
        message: '残り誤答回数は0回です。「L」のシルエットに最も近いアイテムを回答してください',
        isPhase1Complete: true,
      };
    }

    return {
      success: true,
      message: currentStep === 'step0' ? '閉鎖空間内にハッキング液が用意できました' : '正解です。該当するアイテムを選択してください。',
      isPhase1Complete: true,
      nextStep
    };
  }

  // デバッグ用に "test" で必ず通るようにしておく（後で消す）
  if (normalized === 'test') {
    return { success: true, message: '[DEBUG] 正解です。', isPhase1Complete: true };
  }

  return { success: false, message: '不正解です。もう一度画像を確認してください。', errorType: 'wrong' };
}

export async function validateItemSelection(selection: string | any, currentStep: Step): Promise<ActionResponse> {
  switch (currentStep) {
    case 'step1_2':
      if (selection === 'S字フック') {
        return { success: true, message: '「s」の入力確認。次のステップへ移行します。', nextStep: 'step2_1', answerChar: 'S' };
      }
      break;

    case 'step2_2':
      if (selection === 'ドライヤー') {
        return { success: true, message: '「L」の入力確認。', nextStep: 'step3_1', answerChar: 'L' };
      }
      break;

    case 'step3_2':
      if (selection === 'イス') {
        return { success: true, message: '「h」の入力確認。', nextStep: 'step4_1', answerChar: 'h' };
      }
      break;

    case 'step4_2':
      // selection is expected to be an object: { item: string, position: string, action: string, view: string }
      if (typeof selection === 'object' && selection !== null) {
        if (
          selection.item === '冷蔵庫' &&
          (selection.position === '下' || selection.position === '上') &&
          selection.action === '開く' &&
          selection.view === '横'
        ) {
          return {
            success: true,
            message: '「冷蔵庫」よりも「L」に近いアイテムがあります。残り誤答回数は1回です。',
            nextStep: 'last_1',
            errorType: 'fridge_1door',
            answerChar: 'L'
          };
        }
      }
      break;

    case 'last_1':
      // フェーズ1: 強制ドライヤー選択
      if (selection === 'ドライヤー_forced') {
        return {
          success: false,
          message: '「ドライヤー」が「T」と判定されました。残り誤答回数0回です。',
          errorType: 'dryer_t',
          nextStep: 'manual',
          answerChar: 'T'
        };
      }
      break;

    case 'last_2':
      // フェーズ2: アイテム選択 + テキスト入力
      if (typeof selection === 'object' && selection !== null) {
        const { item, text } = selection;
        if (!item || !text) break;

        const normalizedText = normalizeString(text);
        const isTextCorrect = /^(座椅子|ざいす|ザイス)$/.test(normalizedText);
        const isItemCorrect = item === 'イス';

        if (isTextCorrect && isItemCorrect) {
          return { success: true, message: '全ての謎が解明され、閉鎖空間を掌握しました。救助対象者の転送を開始します...救出完了！', nextStep: 'clear', answerChar: 'L' };
        }
      }
      break;
  }

  return { success: false, message: 'エラー：対象が一致しません。', errorType: 'wrong' };
}
