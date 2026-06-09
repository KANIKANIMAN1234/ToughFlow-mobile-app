/** Supabase / PostgREST の英語エラーを利用者向けメッセージに変換 */
export function formatDbError(message: string): string {
  if (message.includes("schema cache") && message.includes("m_tenant")) {
    return [
      "データベースに m_tenant テーブルが見つかりません。",
      "① Supabase Dashboard → Table Editor で m_tenant があるか確認",
      "② 無ければ SQL 001〜008 を順に実行",
      "③ Vercel の NEXT_PUBLIC_SUPABASE_URL が SQL を実行したプロジェクトと一致するか確認",
      "④ SQL Editor で 009_api_grants_and_reload.sql を実行",
    ].join(" ");
  }

  if (message.includes("schema cache")) {
    return [
      "データベースのスキーマキャッシュが古い可能性があります。",
      "Supabase SQL Editor で NOTIFY pgrst, 'reload schema'; を実行してください。",
    ].join(" ");
  }

  if (message.includes("Supabase が未設定")) {
    return message;
  }

  if (
    message.includes("t_site_survey") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  ) {
    return [
      "データベースに t_site_survey テーブルが見つかりません。",
      "Supabase SQL Editor で 003 トランザクションテーブル作成 SQL を実行してください。",
    ].join(" ");
  }

  if (message.includes("row-level security") || message.includes("RLS")) {
    return [
      "データベースの権限設定により保存が拒否されました。",
      "管理者に Supabase RLS ポリシー（t_site_survey INSERT/SELECT）の確認を依頼してください。",
      `詳細: ${message}`,
    ].join(" ");
  }

  return message;
}
