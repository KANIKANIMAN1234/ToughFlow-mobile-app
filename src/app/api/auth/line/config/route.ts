import { NextResponse } from "next/server";
import { getLineConfig } from "@/lib/line/config";

export async function GET() {
  const { loginEnabled, channelId } = getLineConfig();
  return NextResponse.json({
    enabled: loginEnabled,
    channelId: channelId ?? null,
  });
}
