import { NextResponse } from "next/server";
import { getMasters } from "@/lib/store/mock-store";

export async function GET() {
  const masters = getMasters();
  return NextResponse.json({ projects: masters.projects });
}
