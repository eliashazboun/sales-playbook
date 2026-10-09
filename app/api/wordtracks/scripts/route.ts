import { NextResponse } from "next/server";
import { createScript } from "@/app/lib/wordtracks.repo";

export async function POST(req: Request) {
  const body = await req.json();
  const section_id = String(body?.section_id ?? "").trim();
  const title = String(body?.title ?? "").trim();
  const label = String(body?.label ?? "").trim();
  const content = String(body?.content ?? "");

  if (!section_id) return NextResponse.json({ error: "section_id required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  const id = createScript({ section_id, title, label, content });
  return NextResponse.json({ id });
}