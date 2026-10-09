"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Script Console (DB-backed)
 * - Loads sections + scripts from SQLite via /api/wordtracks
 * - CRUD for Sections + Scripts
 * - Modal-based editing
 * - Seed import (one-time) using the hardcoded seed data below
 *
 * Hotkeys:
 * - Ctrl+K: focus search
 * - Alt+1..9: jump to section index
 * - Ctrl+ArrowRight / Ctrl+ArrowLeft: next/prev script (within filtered list)
 * - ?: help
 * - Esc: close help or clear search
 */

type Leaf = { id: string; title: string; label: string; content: string };
type Section = { id: string; title: string; hotkey: string; items: Leaf[] };

type ModalMode =
  | null
  | { kind: "create-section" }
  | { kind: "edit-section"; section: Section }
  | { kind: "create-script"; section: Section }
  | { kind: "edit-script"; section: Section; script: Leaf };

function useHotkeys(handlers: Record<string, (e: KeyboardEvent) => void>) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      const k = e.key === " " ? "Space" : e.key;
      parts.push(k.length === 1 ? k.toUpperCase() : k);
      const combo = parts.join("+");
      const fn = handlers[combo];
      if (fn) fn(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ========== SEED DATA (your current sheet) ========== */
type SeedLeaf = { title: string; label: string; content: string };
type SeedSection = { title: string; hotkey: string; items: SeedLeaf[] };

const SEED_SECTIONS: SeedSection[] = [
  {
    title: "Adoption Text",
    hotkey: "Alt+1",
    items: [
      {
        title: "Adoption Text",
        label: "adoption",
        content: `This is Elias Hazboun at Barbour Hendrick Honda. Thanks again for taking my call! Below is my contact information:
Desk: 252-751-9804
 Cell: 252-813-5020
If you need anything at all, whether it’s sales-related or getting service scheduled, or need someone to back you up, feel free to reach out to me directly. I’m usually easier to get a hold of than service and am happy to help however I can. Thanks!`,
      },
    ],
  },
  {
    title: "Voicemails",
    hotkey: "Alt+2",
    items: [
      {
        title: '1. The “Quick Question”',
        label: "quick q",
        content: `Hi Mr. West, this is Elias. I just had a quick question for you regarding the Altima you looked at. Give me a call back when you get a moment. My number is 252-_-__. I’ll be here today.`,
      },
      {
        title: '2. The “Update” Voicemail',
        label: "update",
        content: `Hi Mr. West, this is Elias. I wanted to give you a quick update regarding the 2014 Altima. When you get a chance, give me a call at 252-_-__. I’ll be here most of the day.`,
      },
      {
        title: '3. The “You Reached Out” Frame',
        label: "request",
        content: `Hi Mr. West, this is Elias at Honda. I’m calling regarding the request you sent in about the Altima. Whenever you have a moment, give me a call at 252-_-__.`,
      },
      {
        title: "4. The Soft + Human One",
        label: "soft",
        content: `Hi Mr. West, this is Elias. I just wanted to personally reach out regarding the vehicle you were considering. No rush at all, but give me a call when you can. My number is`,
      },
    ],
  },
  {
    title: "Service Lane (Equity)",
    hotkey: "Alt+3",
    items: [
      {
        title: "Opening + Reason for the Call (Value-Based)",
        label: "opening",
        content: `“Hi Mr./Mrs. ___, this is Elias over at Barbour Hendrick Honda. You’re here with us today getting your vehicle serviced, correct?”
(pause)
“Perfect. I’ll keep this quick and respectful of your time.”

“The reason I’m calling is we’ve been reaching out to a few service customers because used car values are very strong right now, especially for vehicles like yours, and a lot of people are surprised by what their car is worth.”
OR
“The reason I’m calling is we’ve been reaching out to a few service customers because used car values are very strong right now,and we’ve had high demand for quality pre-owned vehicles like yours. Many of our clients are finding they have more equity than they expected.`,
      },
      {
        title: "Discovery Question + Soft Trade-In Hook",
        label: "discovery",
        content: `Discovery Question
“Out of curiosity, have you given any thought at all to upgrading or changing vehicles sometime in the next year or so?”

Soft Trade-In Hook
“Since your car is already here anyway, we can do a complimentary appraisal and show you what an upgrade would look like, or you can just take the value and think it over later.”`,
      },
      {
        title: "MAYBE / NOT SURE",
        label: "maybe",
        content: `“That’s actually who this helps the most. Even if you’re not ready right now, at least you’ll know where you stand and what options look like.”`,
      },
      {
        title: "NOT REALLY",
        label: "not really",
        content: `“No problem at all. Would it still be helpful just to know what your vehicle is worth today while it’s already here?”`,
      },
      {
        title: "ITS ALMOST PAID OFF",
        label: "almost paid",
        content: `“Nice, you’re almost at the finish line then.Once it is paid off, do you usually like to keep vehicles long-term, or do you sometimes look at upgrading while the value is still strong?”
If they usually keep cars:
“Totally makes sense. A lot of people do the same. The only reason I ask is that sometimes when a vehicle is nearly paid off, the trade value is surprisingly high, so some owners like to at least see what an upgrade would look like for awareness — even if they decide to hold onto it. Is that something you would be curious about?”
If they sometimes upgrade:
“Got it — that timing actually works well then. When you’re this close to payoff, you’re usually in one of the best equity positions, so it can be worth a quick look just to compare options. Some owners like to at least see what an upgrade would look like for awareness, even if they decide to hold onto it. Is that something you would be curious about?”`,
      },
      {
        title: "ITS PAID OFF",
        label: "paid off",
        content: `“That’s awesome !! Congratulations, that’s the best feeling.
 Once a vehicle’s paid off, do you usually like to drive it for quite a while, or do you sometimes look at newer options just to see what’s out there?”
Usually keep cars:
“Totally makes sense — a lot of people do the same.
 The only reason I ask is that when a vehicle is fully paid off, the trade value can be surprisingly strong, so some owners like to at least see what an upgrade would look like for awareness, even if they end up keeping it. Is that something you would be curious about”
Sometimes upgrade:
“Got it — that actually puts you in a really good spot then.
 When a vehicle is paid off, you’re usually in one of the strongest equity positions.Some owners like to at least see what an upgrade would look like for awareness, even if they end up keeping it. Is that something you would be curious about?”`,
      },
    ],
  },
  {
    title: "High-Mileage Word Track",
    hotkey: "Alt+4",
    items: [
      {
        title: "Opening + Reason",
        label: "opening",
        content: `Opening
“Hi Mr./Mrs. ___, this is Elias over at Barbour Hendrick Honda. You’re here with us today getting your vehicle serviced, correct?”
(pause)
“Perfect. I’ll keep this quick and respectful of your time.”
“The reason I’m reaching out is we’re speaking with a few customers whose vehicles are at higher mileage. A lot of people are surprised to learn that upgrading before larger maintenance items come up can sometimes be the more cost-effective option.”
(small pause)`,
      },
      {
        title: "Discovery Question",
        label: "discovery",
        content: `Discovery Question
Out of curiosity, as your vehicle gets closer to the next 20 or 30 thousand miles, have you thought about whether you’d rather keep it through the bigger maintenance stage, or upgrade before that point?`,
      },
      {
        title: `If they say “I don't have a payment”`,
        label: "no payment",
        content: `Even without a car payment, most high-mile vehicles still cost a few hundred a month once you factor in gas and upkeep. Upgrading usually costs a little more monthly, but it replaces uncertainty with predictability.That kind of certainty tends to feel better for most people — wouldn’t you agree?`,
      },
      {
        title: "Maybe / Not Sure",
        label: "maybe",
        content: `“That’s actually who this helps the most. Even if you decide not to do anything now, you’ll know where you stand and what options look like while the vehicle is still running well.”`,
      },
      {
        title: "Not Really",
        label: "not really",
        content: `“No problem at all. Would it still be helpful just to see what upgrading would look like today versus waiting until more maintenance comes up?”`,
      },
      {
        title: "Repairs Mentioned",
        label: "repairs",
        content: `“That’s exactly why we reach out. Sometimes putting money into a vehicle at this mileage makes sense, and sometimes it doesn’t. This just gives you clarity before making that decision.”`,
      },
      {
        title: "Optional Strong Close",
        label: "close",
        content: `Optional Strong Close
“Why don’t we do this? While your car is already here, I’ll have my manager appraise it. Then we can show you what an upgrade would look like. If it makes sense, great. If not, you’re right where you started, just with better information. Does that sound fair?”`,
      },
    ],
  },
  {
    title: "Older Vehicle Word Track",
    hotkey: "Alt+5",
    items: [
      {
        title: "Opening + Reason",
        label: "opening",
        content: `Opening
“Hi Mr./Mrs. ___, this is Elias over at Barbour Hendrick Honda. You’re here with us today getting your vehicle serviced, correct?”
(pause)
“Perfect. I’ll keep this quick and respectful of your time.I’m reaching out because we’ve been touching base with customers who’ve had their vehicles for a while. A lot has changed in safety and technology over the past few years, and most people are surprised when they see what’s new.”`,
      },
      {
        title: "Discovery Question",
        label: "discovery",
        content: `Discovery Question
“Out of curiosity, have you given any thought at all to whether your current vehicle still fits your needs, or if you might consider something newer at some point?”`,
      },
      {
        title: "Maybe / Not Sure",
        label: "maybe",
        content: `Maybe / Not Sure
 “That’s actually who this helps the most. Even if you’re not ready to do anything now, at least you’ll know what options look like and what’s changed since you bought yours.”`,
      },
      {
        title: "Still Running Fine",
        label: "running fine",
        content: `Still Running Fine
 “That’s actually who this helps the most. Even if you decide not to do anything now, you’ll know where you stand and what options look like while the vehicle is still running well.Would it be helpful just to see what newer vehicles offer today compared to what was available when you purchased yours?”`,
      },
      {
        title: "Not Really",
        label: "not really",
        content: `Not Really
 “No problem at all. Would it still be helpful just to see what newer vehicles offer today compared to what was available when you purchased yours?”`,
      },
      {
        title: "Comfort / Safety Mention",
        label: "comfort/safety",
        content: `Comfort / Safety Mention
 “That’s exactly why many people take a look. A lot of the newer safety and driver-assist features weren’t available years ago, and seeing them in person usually helps put things into perspective.”`,
      },
      {
        title: "Soft Next Step",
        label: "next step",
        content: `Soft Next Step
“What we usually do is a simple side-by-side. No pressure. Just a quick look at what you’re driving now versus something newer so you can decide what makes sense for you.”`,
      },
      {
        title: "Optional Strong Close",
        label: "close",
        content: `Optional Strong Close
“Why don’t we do this? While your vehicle’s already here, I’ll line up one option for you to look at. If it makes sense, great. If not, you’re right where you started, just with better information.”`,
      },
    ],
  },
  {
    title: "Scrub Wordtrack",
    hotkey: "Alt+6",
    items: [
      {
        title: "Opening + Reason for the Call",
        label: "opening",
        content: `Opening
“Hi Mr./Mrs. ___, this is Elias over at Barbour Hendrick Honda. I hope you’re doing well today. Did I catch you at an okay time for a quick question?”
(Pause)

Reason for the Call
“Perfect, I’ll keep it brief. The reason I’m reaching out is we’ve been doing a quick review of a few client accounts just to make sure everyone still has a direct point of contact here at the dealership if they ever need anything — sales, service, or even a quick question.”
(Small pause)
“As I was looking over everything, I saw that models like yours are still bringing strong values, and many owners are surprised by how much equity they actually have. Out of curiosity, have you given any thought at all to upgrading sometime in this year, or are you planning to keep it a bit longer?”`,
      },
      {
        title: "Yes, Thinking About It",
        label: "yes",
        content: `Yes, Thinking About It
“Nice — that’s actually perfect timing then.”
 “Have you had a chance to look at anything yet, or are you still in the early stages?”`,
      },
      {
        title: "Already Looking",
        label: "already",
        content: `Already Looking
“Awesome — that’s great you’ve already started looking.
 How about this, we can do a quick appraisal whenever it’s convenient for you. It’s simple and gives you clear numbers to work with so you can see exactly what upgrading would look like before making any decisions. Does that sound fair?”
Would sometime this week or next week be better on your end?`,
      },
      {
        title: "Early Stages",
        label: "early",
        content: `Early Stages
“Got it — that’s actually a good place to be.
 How about this, we can do a quick appraisal whenever it’s convenient for you…”
Would sometime this week or next week be better on your end?`,
      },
      {
        title: "Maybe / Not Sure",
        label: "maybe",
        content: `Maybe / Not Sure
“Got it — that’s actually who this helps the most. Even if you’re not planning to do anything right now, at least you’d know where you stand and what options would look like while values are still strong.”
“Would it be helpful just to see what an upgrade would look like so you have that information for later?”`,
      },
      {
        title: "Almost Paid Off",
        label: "almost paid",
        content: `“Nice, you’re almost at the finish line then.Once it is paid off, do you usually like to keep vehicles long-term, or do you sometimes look at upgrading while the value is still strong?”
If they usually keep cars:
“Totally makes sense. A lot of people do the same. The only reason I ask is that sometimes when a vehicle is nearly paid off, the trade value is surprisingly high, so some owners like to at least see what an upgrade would look like for awareness — even if they decide to hold onto it. Is that something you would be curious about?”
If they sometimes upgrade:
“Got it — that timing actually works well then. When you’re this close to payoff, you’re usually in one of the best equity positions, so it can be worth a quick look just to compare options. Some owners like to at least see what an upgrade would look like for awareness — even if they decide to hold onto it. Is that something you would be curious about?”`,
      },
      {
        title: "Paid Off",
        label: "paid off",
        content: `“That’s awesome !! Congratulations, that’s the best feeling.
 Once a vehicle’s paid off, do you usually like to drive it for quite a while, or do you sometimes look at newer options just to see what’s out there?”
Usually keep cars:
“Totally makes sense — a lot of people do the same.
 The only reason I ask is that when a vehicle is fully paid off, the trade value can be surprisingly strong, so some owners like to at least see what an upgrade would look like for awareness, even if they end up keeping it. Is that something you would be curious about”
Sometimes upgrade:
“Got it — that actually puts you in a really good spot then.
 When a vehicle is paid off, you’re usually in one of the strongest equity positions.Some owners like to at least see what an upgrade would look like for awareness, even if they end up keeping it. Is that something you would be curious about?”`,
      },
      {
        title: "Optional Appointment Bridge",
        label: "bridge",
        content: `Optional Appointment Bridge
“How about this, we can do that quick appraisal and comparison whenever it’s convenient for you…”
Would sometime this week or next week be better on your end?`,
      },
      {
        title: "Adoption / Relationship Close",
        label: "close",
        content: `Adoption / Relationship Close
“Either way, I just wanted to make sure you have my direct contact information. If you ever need anything — sales, service, or even just a quick question — I’m here as your point of contact.”`,
      },
    ],
  },
];

/** ========== UI helpers ========== */
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border bg-white shadow-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b p-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            type="button"
            className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={onClose}
          >
            Close (Esc)
          </button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

export default function ScriptConsolePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [activeItemId, setActiveItemId] = useState<string>("");

  const [sectionFocusIndex, setSectionFocusIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [helpOpen, setHelpOpen] = useState(false);

  const [modal, setModal] = useState<ModalMode>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const sectionListRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    const res = await fetch("/api/wordtracks", { cache: "no-store" });
    const data = await res.json();
    const next: Section[] = data.sections ?? [];
    setSections(next);

    // ensure active selection exists
    if (!next.length) {
      setActiveSectionId("");
      setActiveItemId("");
      return;
    }
    const sec = next.find((s) => s.id === activeSectionId) ?? next[0]!;
    setActiveSectionId(sec.id);

    const item = sec.items.find((i) => i.id === activeItemId) ?? sec.items[0];
    setActiveItemId(item?.id ?? "");
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSection = useMemo(() => {
    if (!sections.length) return null;
    return sections.find((s) => s.id === activeSectionId) ?? sections[0]!;
  }, [sections, activeSectionId]);

  const filteredItems = useMemo(() => {
    if (!activeSection) return [];
    const q = normalize(query);
    if (!q) return activeSection.items;
    return activeSection.items.filter((it) => {
      const hay = normalize([it.title, it.label, it.content].join(" "));
      return hay.includes(q);
    });
  }, [activeSection, query]);

  const activeItem = useMemo(() => {
    if (!activeSection) return null;
    const byId = activeSection.items.find((i) => i.id === activeItemId);
    if (byId) return byId;
    return activeSection.items[0] ?? null;
  }, [activeSection, activeItemId]);

  // When section changes, default to its first item + clear search
  useEffect(() => {
    if (!activeSection) return;
    const first = activeSection.items[0];
    if (first) setActiveItemId(first.id);
    setQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionId]);

  function focusSearch() {
    searchRef.current?.focus();
    searchRef.current?.select();
  }

  function clearSearch() {
    setQuery("");
    setStatus("Search cleared");
    window.setTimeout(() => setStatus("Ready"), 800);
  }

  async function copyActive() {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.content);
      setStatus(`Copied: ${activeItem.label}`);
      window.setTimeout(() => setStatus("Ready"), 1200);
    } catch {
      setStatus("Copy failed");
      window.setTimeout(() => setStatus("Ready"), 1200);
    }
  }

  function jumpSectionByNumber(n: number) {
    const idx = n - 1;
    const target = sections[idx];
    if (!target) return;
    setActiveSectionId(target.id);
    setSectionFocusIndex(idx);
    setStatus(`Section: ${target.title}`);
    window.setTimeout(() => setStatus("Ready"), 800);
  }

  function stepItem(dir: -1 | 1) {
    if (!activeSection) return;
    const list = filteredItems.length ? filteredItems : activeSection.items;
    if (!list.length) return;

    const idx = list.findIndex((x) => x.id === activeItemId);
    const nextIdx = idx === -1 ? 0 : clamp(idx + dir, 0, list.length - 1);
    setActiveItemId(list[nextIdx]!.id);
    setStatus(`Selected: ${list[nextIdx]!.label}`);
    window.setTimeout(() => setStatus("Ready"), 800);
  }

  useHotkeys({
    "Ctrl+K": (e) => {
      e.preventDefault();
      focusSearch();
    },
    "Ctrl+ArrowRight": (e) => {
      e.preventDefault();
      stepItem(1);
    },
    "Ctrl+ArrowLeft": (e) => {
      e.preventDefault();
      stepItem(-1);
    },
    Escape: (e) => {
      if (modal) {
        e.preventDefault();
        setModal(null);
        return;
      }
      if (helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }
      if (query) {
        e.preventDefault();
        clearSearch();
        return;
      }
    },
    "?": (e) => {
      const t = e.target as HTMLElement | null;
      const isTyping =
        t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || (t as any)?.isContentEditable;
      if (isTyping) return;
      e.preventDefault();
      setHelpOpen((p) => !p);
    },
    "Alt+1": (e) => {
      e.preventDefault();
      jumpSectionByNumber(1);
    },
    "Alt+2": (e) => {
      e.preventDefault();
      jumpSectionByNumber(2);
    },
    "Alt+3": (e) => {
      e.preventDefault();
      jumpSectionByNumber(3);
    },
    "Alt+4": (e) => {
      e.preventDefault();
      jumpSectionByNumber(4);
    },
    "Alt+5": (e) => {
      e.preventDefault();
      jumpSectionByNumber(5);
    },
    "Alt+6": (e) => {
      e.preventDefault();
      jumpSectionByNumber(6);
    },
    "Alt+7": (e) => {
      e.preventDefault();
      jumpSectionByNumber(7);
    },
    "Alt+8": (e) => {
      e.preventDefault();
      jumpSectionByNumber(8);
    },
    "Alt+9": (e) => {
      e.preventDefault();
      jumpSectionByNumber(9);
    },
  });

  function onSectionListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSectionFocusIndex((i) => clamp(i + 1, 0, Math.max(0, sections.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSectionFocusIndex((i) => clamp(i - 1, 0, Math.max(0, sections.length - 1)));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setSectionFocusIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setSectionFocusIndex(Math.max(0, sections.length - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const s = sections[sectionFocusIndex];
      if (!s) return;
      setActiveSectionId(s.id);
      return;
    }
  }

  // keep focused section visible
  useEffect(() => {
    const container = sectionListRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-sidx="${sectionFocusIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sectionFocusIndex]);

  async function seedImport() {
    if (!confirm("Import seed into SQLite? (This will ADD sections/scripts; it won't delete anything.)")) return;

    setStatus("Seeding...");
    try {
      // Create sections + scripts
      for (const sec of SEED_SECTIONS) {
        const created = await apiJson("/api/wordtracks/sections", {
          method: "POST",
          body: JSON.stringify({ title: sec.title, hotkey: sec.hotkey }),
        });
        const section_id = created.id as string;

        for (const it of sec.items) {
          await apiJson("/api/wordtracks/scripts", {
            method: "POST",
            body: JSON.stringify({
              section_id,
              title: it.title,
              label: it.label,
              content: it.content,
            }),
          });
        }
      }
      await refresh();
      setStatus("Seed import complete");
      window.setTimeout(() => setStatus("Ready"), 1200);
    } catch (e: any) {
      setStatus(`Seed failed: ${e?.message ?? "error"}`);
      window.setTimeout(() => setStatus("Ready"), 2000);
    }
  }

  async function deleteActiveSection() {
    if (!activeSection) return;
    if (!confirm(`Delete section "${activeSection.title}"? (This deletes its scripts too.)`)) return;
    setStatus("Deleting section...");
    try {
      await apiJson(`/api/wordtracks/sections/${activeSection.id}`, { method: "DELETE" });
      await refresh();
      setStatus("Section deleted");
      window.setTimeout(() => setStatus("Ready"), 1000);
    } catch (e: any) {
      setStatus(e?.message ?? "Delete failed");
      window.setTimeout(() => setStatus("Ready"), 1500);
    }
  }

  async function deleteActiveScript() {
    if (!activeItem) return;
    if (!confirm(`Delete script "${activeItem.label}"?`)) return;
    setStatus("Deleting script...");
    try {
      await apiJson(`/api/wordtracks/scripts/${activeItem.id}`, { method: "DELETE" });
      await refresh();
      setStatus("Script deleted");
      window.setTimeout(() => setStatus("Ready"), 1000);
    } catch (e: any) {
      setStatus(e?.message ?? "Delete failed");
      window.setTimeout(() => setStatus("Ready"), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-wide">Script Console</h1>
            <p className="text-[11px] text-slate-500 truncate">
              Ctrl+K search, Alt+1..9 sections, Ctrl+←/→ next/prev, ? help, Esc clear/close
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={() => alert("Sup")}
              title="Import your existing word tracks into SQLite"
            >
              Import seed
            </button>
            <button
              type="button"
              className="rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={() => setHelpOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={helpOpen}
            >
              Help (?)
            </button>
            <button
              type="button"
              className="rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={copyActive}
              disabled={!activeItem}
            >
              Copy
            </button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          {/* Sections only */}
          <aside className="rounded-lg border bg-white" aria-label="Sections">
            <div className="border-b p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-700">Sections</div>
                <div className="mt-1 text-[11px] text-slate-500">Use Alt+1..9</div>
              </div>
              <button
                type="button"
                className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                onClick={() => setModal({ kind: "create-section" })}
              >
                + Section
              </button>
            </div>

            <div
              className="p-2"
              role="listbox"
              aria-label="Section list"
              tabIndex={0}
              onKeyDown={onSectionListKeyDown}
            >
              <div ref={sectionListRef} className="max-h-[70vh] overflow-auto">
                {sections.length === 0 ? (
                  <div className="p-3 text-sm text-slate-600">
                    No sections yet. Click <span className="font-semibold">Import seed</span> or add a section.
                  </div>
                ) : (
                  sections.map((s, idx) => {
                    const active = s.id === activeSectionId;
                    const focused = idx === sectionFocusIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-sidx={idx}
                        className={[
                          "w-full text-left rounded-md border px-2 py-2 mb-2 last:mb-0",
                          active ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50",
                          focused ? "ring-2 ring-slate-400" : "",
                          "focus:outline-none focus:ring-2 focus:ring-slate-400",
                        ].join(" ")}
                        onClick={() => {
                          setActiveSectionId(s.id);
                          setSectionFocusIndex(idx);
                        }}
                      >
                        <div className="text-sm font-semibold leading-tight">{s.title}</div>
                        <div className="text-[11px] opacity-80">{s.hotkey || ""}</div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 text-[11px] text-slate-500">Keys: ↑ ↓ Home End Enter</div>

              {/* Section actions */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="rounded-md border bg-white px-2 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  onClick={() => activeSection && setModal({ kind: "edit-section", section: activeSection })}
                  disabled={!activeSection}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-md border bg-white px-2 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  onClick={() => activeSection && setModal({ kind: "create-script", section: activeSection })}
                  disabled={!activeSection}
                >
                  + Script
                </button>
                <button
                  type="button"
                  className="rounded-md border bg-white px-2 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  onClick={deleteActiveSection}
                  disabled={!activeSection}
                >
                  Delete
                </button>
              </div>
            </div>
          </aside>

          {/* Script panel */}
          <main className="rounded-lg border bg-white" aria-label="Selected script">
            <div className="border-b p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight">
                  {activeSection ? activeSection.title : "No section"}
                </h2>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeItem ? activeItem.title : "No script selected"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="search">
                  Search within section
                </label>
                <input
                  id="search"
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search (Ctrl+K)"
                  className="w-44 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  disabled={!activeSection}
                />
                <button
                  type="button"
                  className="rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  onClick={() => {
                    if (!activeSection || !activeItem) return;
                    setModal({ kind: "edit-script", section: activeSection, script: activeItem });
                  }}
                  disabled={!activeSection || !activeItem}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  onClick={deleteActiveScript}
                  disabled={!activeItem}
                >
                  Delete
                </button>
              </div>
            </div>

            <section className="p-3">
              <div className="rounded-md border bg-slate-50 p-3">
                <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-slate-900">
                  {activeItem ? activeItem.content : "No script selected."}
                </pre>
              </div>

              {/* Buttons UNDER the script */}
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    Jump to: <span className="ml-2">Ctrl+←/→</span>
                  </div>
                  <div className="text-[11px] text-slate-500" aria-live="polite">
                    {status}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Scripts in section">
                  {(filteredItems.length ? filteredItems : activeSection?.items ?? []).map((it) => {
                    const active = it.id === activeItemId;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        className={[
                          "rounded-md border px-2.5 py-1.5 text-xs",
                          active ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50",
                          "focus:outline-none focus:ring-2 focus:ring-slate-400",
                        ].join(" ")}
                        onClick={() => {
                          setActiveItemId(it.id);
                          setStatus(`Selected: ${it.label}`);
                          window.setTimeout(() => setStatus("Ready"), 800);
                        }}
                        aria-pressed={active}
                        title={it.title}
                      >
                        {it.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Help dialog */}
      {helpOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border bg-white shadow-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b p-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
              <button
                type="button"
                className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                onClick={() => setHelpOpen(false)}
              >
                Close (Esc)
              </button>
            </div>
            <div className="p-3 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-semibold">Alt+1..9</span> jump to sections
                </li>
                <li>
                  <span className="font-semibold">Ctrl+K</span> focus search (filters jump buttons)
                </li>
                <li>
                  <span className="font-semibold">Ctrl+← / Ctrl+→</span> previous / next script (within section)
                </li>
                <li>
                  <span className="font-semibold">Esc</span> close modal/help or clear search
                </li>
                <li>
                  <span className="font-semibold">?</span> toggle this help
                </li>
              </ul>
              <div className="mt-3 rounded-md border bg-slate-50 p-2 text-[12px] text-slate-700">
                Tip: Use the short buttons under the script to jump objections fast.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {modal?.kind === "create-section" ? (
        <CreateOrEditSectionModal
          mode="create"
          initial={{ title: "", hotkey: "" }}
          onClose={() => setModal(null)}
          onSave={async ({ title, hotkey }) => {
            setStatus("Creating section...");
            await apiJson("/api/wordtracks/sections", {
              method: "POST",
              body: JSON.stringify({ title, hotkey }),
            });
            await refresh();
            setStatus("Section created");
            window.setTimeout(() => setStatus("Ready"), 900);
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "edit-section" ? (
        <CreateOrEditSectionModal
          mode="edit"
          initial={{ title: modal.section.title, hotkey: modal.section.hotkey }}
          onClose={() => setModal(null)}
          onSave={async ({ title, hotkey }) => {
            setStatus("Saving section...");
            await apiJson(`/api/wordtracks/sections/${modal.section.id}`, {
              method: "PATCH",
              body: JSON.stringify({ title, hotkey }),
            });
            await refresh();
            setStatus("Section saved");
            window.setTimeout(() => setStatus("Ready"), 900);
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "create-script" ? (
        <CreateOrEditScriptModal
          mode="create"
          sections={sections}
          initial={{
            section_id: modal.section.id,
            title: "",
            label: "",
            content: "",
          }}
          onClose={() => setModal(null)}
          onSave={async (v) => {
            setStatus("Creating script...");
            await apiJson("/api/wordtracks/scripts", {
              method: "POST",
              body: JSON.stringify(v),
            });
            await refresh();
            setStatus("Script created");
            window.setTimeout(() => setStatus("Ready"), 900);
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "edit-script" ? (
        <CreateOrEditScriptModal
          mode="edit"
          sections={sections}
          initial={{
            section_id: modal.section.id,
            title: modal.script.title,
            label: modal.script.label,
            content: modal.script.content,
          }}
          onClose={() => setModal(null)}
          onSave={async (v) => {
            setStatus("Saving script...");
            await apiJson(`/api/wordtracks/scripts/${modal.script.id}`, {
              method: "PATCH",
              body: JSON.stringify(v),
            });
            await refresh();
            setStatus("Script saved");
            window.setTimeout(() => setStatus("Ready"), 900);
            setModal(null);
          }}
        />
      ) : null}
    </div>
  );

  async function apiJson(url: string, init?: RequestInit) {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  }
}

function CreateOrEditSectionModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: { title: string; hotkey: string };
  onClose: () => void;
  onSave: (v: { title: string; hotkey: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [hotkey, setHotkey] = useState(initial.hotkey);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  return (
    <ModalShell title={mode === "create" ? "Create section" : "Edit section"} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          try {
            setSaving(true);
            await onSave({ title: title.trim(), hotkey: hotkey.trim() });
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">Title</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="e.g. Service Lane (Equity)"
            required
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">Hotkey (optional)</span>
          <input
            value={hotkey}
            onChange={(e) => setHotkey(e.target.value)}
            className="h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="e.g. Alt+3"
          />
        </label>

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md border bg-white px-3 py-2 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function CreateOrEditScriptModal({
  mode,
  sections,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  sections: Section[];
  initial: { section_id: string; title: string; label: string; content: string };
  onClose: () => void;
  onSave: (v: { section_id: string; title: string; label: string; content: string }) => Promise<void>;
}) {
  const [section_id, setSectionId] = useState(initial.section_id);
  const [title, setTitle] = useState(initial.title);
  const [label, setLabel] = useState(initial.label);
  const [content, setContent] = useState(initial.content);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  return (
    <ModalShell title={mode === "create" ? "Create script" : "Edit script"} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!section_id) return;
          if (!title.trim()) return;
          if (!label.trim()) return;
          if (!content) return;
          try {
            setSaving(true);
            await onSave({
              section_id,
              title: title.trim(),
              label: label.trim(),
              content,
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-slate-700">Section</span>
            <select
              value={section_id}
              onChange={(e) => setSectionId(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              required
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-slate-700">Label (button)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder='e.g. "maybe"'
              required
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">Title</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder='e.g. "MAYBE / NOT SURE"'
            required
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">Content</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[220px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Paste the script here"
            required
          />
        </label>

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md border bg-white px-3 py-2 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}