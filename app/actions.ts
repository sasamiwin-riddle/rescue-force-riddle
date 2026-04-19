"use server";

export type Step = 'intro' | 'step1' | 'step2' | 'step3' | 'step4' | 'cooling' | 'final' | 'clear';

export interface ActionResponse {
  success: boolean;
  message: string;
  nextStep?: Step;
  errorType?: 'fridge_1door' | 'dryer_t' | 'temperature' | 'wrong';
}

// 簡単な表記揺れ吸収
function normalizeString(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .trim()
    .toLowerCase();
}

export async function validateAnswer(text: string, currentStep: Step, context?: { isFridgeOpen?: boolean, hasTriedFridge?: boolean }): Promise<ActionResponse> {
  const normalized = normalizeString(text);

  switch (currentStep) {
    case 'step1':
      if (normalized.match(/^(ドライヤー|ヘアドライヤー|hair dryer|dryer)$/)) {
        return { success: true, message: '「L」の入力確認。転送装置の設置が完了しました。', nextStep: 'step2' };
      }
      break;

    case 'step2':
      if (normalized.match(/^(いす|イス|椅子|isu|chair)$/)) {
        return { success: true, message: '「h」の入力確認。', nextStep: 'step3' };
      }
      break;

    case 'step3':
      if (normalized.match(/^(s字フック|sじフック|エス字フック|フック|hook|s hook)$/)) {
        return { success: true, message: '「s」の入力確認。', nextStep: 'step4' };
      }
      break;

    case 'step4':
      // Step 4 の進行
      // まず冷蔵庫を入力
      if (normalized.match(/^(冷蔵庫|れいぞうこ|refrigerator|fridge)$/)) {
        if (context?.isFridgeOpen) {
          return { success: true, message: '「L」の入力確認。すべてのパスワードが揃いました。', nextStep: 'cooling' };
        } else {
          return { success: false, message: 'エラー：対象アイテムは1段式であり、小文字の「l」と判定されました。', errorType: 'fridge_1door' };
        }
      }
      // 冷蔵庫失敗後にドライヤーを再提出した場合
      if (context?.hasTriedFridge && normalized.match(/^(ドライヤー|ヘアドライヤー|hair dryer|dryer)$/)) {
         return { success: false, message: 'エラー：対象アイテムはT字型です。「L」として判定できません。', errorType: 'dryer_t' };
      }
      break;

    case 'cooling':
      // 仮の冷却パズル (TODO: 要件確定後に変更)
      if (normalized === 'cool' || normalized === 'クール' || normalized === '冷却') {
        return { success: true, message: '冷却機能のロックが解除されました。温度が正常値に低下しました。', nextStep: 'final' };
      }
      break;

    case 'final':
      // 座椅子 (場所、アイテムの組み合わせ等)
      // 要件「旅館の部屋」の「下（または畳の上）」の「座椅子」
      // プレイヤーからの入力は一つにまとまって送られてくる想定
      if (normalized.match(/座椅子|ざいす/)) {
        return { success: true, message: '対象を完全にロックしました。転送を開始します...救出完了！', nextStep: 'clear' };
      } else if (normalized.match(/^(いす|イス|椅子|isu|chair)$/)) {
        return { success: false, message: 'エラー：完全な「L」の形状ではありません。', errorType: 'wrong' };
      }
      break;
  }

  return { success: false, message: 'エラー：対象が一致しません。', errorType: 'wrong' };
}
