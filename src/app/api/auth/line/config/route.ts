import { NextResponse } from "next/server";
import { getLineConfig } from "@/lib/line/config";

export async function GET() {
  const { enabled, channelId } = getLineConfig();
  return NextResponse.json({
    enabled,
    channelId: channelId ?? null,
  });
}
