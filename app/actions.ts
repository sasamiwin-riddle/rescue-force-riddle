"use server";

export type Step = 'intro' | 'step1' | 'manual' | 'step1_2' | 'step2' | 'step3' | 'step4' | 'last' | 'clear';

export interface ActionResponse {
  success: boolean;
  message: string;
  isPhase1Complete?: boolean;
  nextStep?: Step;
  errorType?: 'wrong' | 'fridge_1door' | 'dryer_t';
}

// 簡単な表記揺れ吸収
function normalizeString(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .trim()
    .toLowerCase();
}

// Step 1-3: 小謎の答え（現状はプレースホルダーとして各ステップ固定の答えを設定）
const RIDDLE_ANSWERS: Record<string, RegExp> = {
  'step1': /^(s|S|ｓ|Ｓ)$/, // TODO: 実際の小謎の答えに差し替え
  'step2': /^(12|１２)$/,
  'step3': /^(h|H|ｈ|Ｈ)$/,
  'step4': /^(l|L|ｌ|Ｌ|える|エル)$/,
};

export async function validateRiddle(answer: string, currentStep: Step): Promise<ActionResponse> {
  const normalized = normalizeString(answer);
  const pattern = RIDDLE_ANSWERS[currentStep];

  if (pattern && pattern.test(normalized)) {
    return { success: true, message: '正解です。該当するアイテムを選択してください。', isPhase1Complete: true };
  }

  // デバッグ用に "test" で必ず通るようにしておく（後で消す）
  if (normalized === 'test') {
    return { success: true, message: '[DEBUG] 正解です。該当するアイテムを選択してください。', isPhase1Complete: true };
  }

  return { success: false, message: '不正解です。もう一度画像を確認してください。', errorType: 'wrong' };
}

export async function validateItemSelection(selection: string | any, currentStep: Step): Promise<ActionResponse> {
  switch (currentStep) {
    case 'step1_2':
      if (selection === 'S字フック') {
        return { success: true, message: '「s」の入力確認。次のステップへ移行します。', nextStep: 'step2' };
      }
      break;

    case 'step2':
      if (selection === 'ドライヤー') {
        return { success: true, message: '「L」の入力確認。', nextStep: 'step3' };
      }
      break;

    case 'step3':
      if (selection === 'イス') {
        return { success: true, message: '「h」の入力確認。', nextStep: 'step4' };
      }
      break;

    case 'step4':
      // selection is expected to be an object: { item: string, position: string, action: string }
      if (typeof selection === 'object' && selection !== null) {
        if (selection.item === '冷蔵庫' && selection.position === '下' && selection.action === '開く') {
          return {
            success: true,
            message: '実物の1段式の冷蔵庫が確認されました。次のステップへ移行します。',
            nextStep: 'last',
            errorType: 'fridge_1door' // UI側で1段式冷蔵庫の画像を表示するためのフラグとして利用
          };
        }
      }
      break;

    case 'last':
      // Last Stepは2つのフェーズがある
      // フェーズ1: 強制ドライヤー選択
      if (selection === 'ドライヤー_forced') {
        return {
          success: false,
          message: 'エラー：対象アイテムはT字型です。「L」として判定できません。',
          errorType: 'dryer_t'
        };
      }

      // フェーズ2: テキスト入力 (4文字以内)
      if (typeof selection === 'string') {
        const normalized = normalizeString(selection);
        if (normalized.length <= 4 && /^(座椅子|ざいす|ザイス)$/.test(normalized)) {
          return { success: true, message: '対象を完全にロックしました。転送を開始します...救出完了！', nextStep: 'clear' };
        }
      }
      break;
  }

  return { success: false, message: 'エラー：対象が一致しません。', errorType: 'wrong' };
}
