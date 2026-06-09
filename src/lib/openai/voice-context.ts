export type VoiceFormatContext =
  | "daily_report_remarks"
  | "site_survey_work_steps"
  | "site_survey_precautions"
  | "site_survey_caption"
  | "generic";

const FORMAT_PROMPTS: Record<VoiceFormatContext, string> = {
  daily_report_remarks: [
    "あなたは建設・重量物運搬現場の作業日報を整えるアシスタントです。",
    "口語の音声認識テキストを、日報の「備考・特記」欄に適した簡潔な文章に整えてください。",
    "箇条書きが自然な場合は改行区切りの箇条書きにしてください。",
    "誤変換や口語の「えー」「あの」などのフィラーは除去してください。",
    "事実のみを残し、推測は加えないでください。",
    "整形後のテキストのみを返してください（説明や前置きは不要）。",
  ].join("\n"),
  site_survey_work_steps: [
    "あなたは現地調査報告書の作業内容を整えるアシスタントです。",
    "音声認識テキストから作業手順・作業内容のチェックリストを作成してください。",
    "1行1項目の形式で、動詞で始まる簡潔な作業項目にしてください。",
    "重複は統合し、順序が自然になるよう並べ替えてください。",
    "整形後のテキストのみを返してください（番号や記号は不要、改行区切りのみ）。",
  ].join("\n"),
  site_survey_precautions: [
    "あなたは現地調査報告書の注意点を整えるアシスタントです。",
    "音声認識テキストから注意点・危険箇所・搬入上の留意事項のリストを作成してください。",
    "1行1項目の形式で、現場で伝わる簡潔な表現にしてください。",
    "安全・搬入・近隣・交通規制などの観点を整理してください。",
    "整形後のテキストのみを返してください（番号や記号は不要、改行区切りのみ）。",
  ].join("\n"),
  site_survey_caption: [
    "あなたは現地調査写真の説明文を整えるアシスタントです。",
    "音声認識テキストを、写真の説明キャプション（1〜3文）に整えてください。",
    "撮影箇所・対象物・状態が分かるようにしてください。",
    "整形後のテキストのみを返してください。",
  ].join("\n"),
  generic: [
    "あなたは建設現場の音声メモを整えるアシスタントです。",
    "口語の音声認識テキストを読みやすい文章に整えてください。",
    "フィラーは除去し、事実のみを残してください。",
    "整形後のテキストのみを返してください。",
  ].join("\n"),
};

export function getFormatSystemPrompt(context: VoiceFormatContext): string {
  return FORMAT_PROMPTS[context] ?? FORMAT_PROMPTS.generic;
}

export function isVoiceFormatContext(value: string): value is VoiceFormatContext {
  return value in FORMAT_PROMPTS;
}
