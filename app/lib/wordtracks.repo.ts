import { randomUUID } from "crypto";
import { getDb } from "./wordtracks.db";

export type DbSection = {
  id: string;
  title: string;
  hotkey: string;
  sort_order: number;
};

export type DbScript = {
  id: string;
  section_id: string;
  title: string;
  label: string;
  content: string;
  sort_order: number;
};

export function listSectionsWithScripts() {
  const db = getDb();
  const sections = db
    .prepare(`SELECT id, title, hotkey, sort_order FROM sections ORDER BY sort_order ASC, title ASC`)
    .all() as DbSection[];

  const scripts = db
    .prepare(`SELECT id, section_id, title, label, content, sort_order FROM scripts ORDER BY sort_order ASC, title ASC`)
    .all() as DbScript[];

  const bySection = new Map<string, DbScript[]>();
  for (const s of scripts) {
    const arr = bySection.get(s.section_id) ?? [];
    arr.push(s);
    bySection.set(s.section_id, arr);
  }

  return sections.map((sec) => ({
    ...sec,
    items: bySection.get(sec.id) ?? [],
  }));
}

export function createSection(input: { title: string; hotkey?: string }) {
  const db = getDb();
  const id = randomUUID();
  const maxSort = db.prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM sections`).get() as any;
  const sort_order = Number(maxSort?.m ?? 0) + 1;

  db.prepare(
    `INSERT INTO sections (id, title, hotkey, sort_order) VALUES (@id, @title, @hotkey, @sort_order)`
  ).run({ id, title: input.title.trim(), hotkey: (input.hotkey ?? "").trim(), sort_order });

  return id;
}

export function updateSection(input: { id: string; title: string; hotkey?: string }) {
  const db = getDb();
  db.prepare(
    `UPDATE sections SET title=@title, hotkey=@hotkey, updated_at=datetime('now') WHERE id=@id`
  ).run({ id: input.id, title: input.title.trim(), hotkey: (input.hotkey ?? "").trim() });
}

export function deleteSection(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM sections WHERE id=?`).run(id);
}

export function createScript(input: {
  section_id: string;
  title: string;
  label: string;
  content: string;
}) {
  const db = getDb();
  const id = randomUUID();
  const maxSort = db
    .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM scripts WHERE section_id=?`)
    .get(input.section_id) as any;
  const sort_order = Number(maxSort?.m ?? 0) + 1;

  db.prepare(
    `INSERT INTO scripts (id, section_id, title, label, content, sort_order)
     VALUES (@id, @section_id, @title, @label, @content, @sort_order)`
  ).run({
    id,
    section_id: input.section_id,
    title: input.title.trim(),
    label: input.label.trim(),
    content: input.content,
    sort_order,
  });

  return id;
}

export function updateScript(input: {
  id: string;
  section_id: string;
  title: string;
  label: string;
  content: string;
}) {
  const db = getDb();
  db.prepare(
    `UPDATE scripts
     SET section_id=@section_id, title=@title, label=@label, content=@content, updated_at=datetime('now')
     WHERE id=@id`
  ).run({
    id: input.id,
    section_id: input.section_id,
    title: input.title.trim(),
    label: input.label.trim(),
    content: input.content,
  });
}

export function deleteScript(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM scripts WHERE id=?`).run(id);
}