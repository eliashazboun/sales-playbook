import { NextResponse } from "next/server";
import { createSection } from "@/app/lib/wordtracks.repo";

export async function POST(req: Request) {
  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const hotkey = String(body?.hotkey ?? "").trim();

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const id = createSection({ title, hotkey });
  return NextResponse.json({ id });
}