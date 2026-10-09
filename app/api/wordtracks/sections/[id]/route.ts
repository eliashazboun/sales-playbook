import { NextResponse } from "next/server";
import { deleteSection, updateSection } from "@/app/lib/wordtracks.repo";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const hotkey = String(body?.hotkey ?? "").trim();

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  updateSection({ id, title, hotkey });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  deleteSection(id);
  return NextResponse.json({ ok: true });
}