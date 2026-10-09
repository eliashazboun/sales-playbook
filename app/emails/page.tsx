"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Copy, Pencil, Check } from "lucide-react";

type TemplateCard = {
  id: string;
  label: string;
  subject: string;
  body: string;
};

type TemplateSection = {
  id: string;
  title: string;
  description: string;
  cards: TemplateCard[];
};

const initialSections: TemplateSection[] = [
  {
    id: "email-1",
    title: "Email 1 - Introduction",
    description: "Intro email variations",
    cards: [
      {
        id: "e1-car",
        label: "Vehicle Lead + Vehicle Attached",
        subject: "Looking forward to connecting, <{CustFirstName}>",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nMy name is Elias, and I will be your point of contact here at Barbour Hendrick Honda regarding the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}> you inquired about.\n\nI am getting a quick video together for you now so you can get a better look at the vehicle before coming in. If there is anything specific you would like me to cover in the video, just let me know.\n\nI look forward to connecting with you and helping in any way I can.\n\nBest regards,\nElias Hazboun\nSales Consultant\nBarbour Hendrick Honda\n252-565-4778",
      },
      {
        id: "e1-no-car",
        label: "Vehicle Lead + No Vehicle",
        subject: "Quick introduction from Elias at Honda",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nMy name is Elias, and I will be your point of contact here at Barbour Hendrick Honda. I wanted to introduce myself and let you know I am here to help with your vehicle search.\n\nI am also putting together a quick video introduction for you. Once I know a little more about what you are looking for, I can help narrow down the best options.\n\nIf you would like, reply with what type of vehicle you are considering and I will point you in the right direction.\n\nBest regards,\nElias Hazboun\nSales Consultant\nBarbour Hendrick Honda\n252-565-4778",
      },
      {
        id: "e1-coupon-car",
        label: "$500 Coupon + Vehicle",
        subject: "Your $500 savings request on the <{VehicleModel}>",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nMy name is Elias, and I will be your point of contact here at Barbour Hendrick Honda regarding your request on the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}>.\n\nI also saw that your lead came through our $500 savings offer, and I will be happy to help you review how that applies as we go over your options.\n\nI am putting together a quick video for you now so you can get a better look at the vehicle before coming in.\n\nI look forward to connecting with you soon.\n\nBest regards,\nElias Hazboun\nSales Consultant\nBarbour Hendrick Honda\n252-565-4778",
      },
      {
        id: "e1-coupon-no-car",
        label: "$500 Coupon + No Vehicle",
        subject: "Thanks for reaching out to Honda",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nMy name is Elias, and I will be your point of contact here at Barbour Hendrick Honda. I saw your request came through our $500 savings offer, and I wanted to introduce myself.\n\nI am here to help make your search easy and narrow down the best options based on what you are looking for.\n\nIf you reply with what type of vehicle you are considering, I can get started for you right away.\n\nBest regards,\nElias Hazboun\nSales Consultant\nBarbour Hendrick Honda\n252-565-4778",
      },
    ],
  },
  {
    id: "email-2",
    title: "Email 2",
    description: "Soft follow up",
    cards: [
      {
        id: "e2-car",
        label: "Vehicle",
        subject: "Still available for you, <{CustFirstName}>",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI just wanted to follow up regarding the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}> you looked at. It is still available as of now, and I wanted to see if you had any questions for me.\n\nIf it would help, I can also send over a few details or set aside a time for you to stop in and take a look.\n\nBest regards,\nElias Hazboun",
      },
      {
        id: "e2-no-car",
        label: "No Vehicle",
        subject: "Are you still looking for a vehicle?",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI just wanted to check in and see if you are still looking for a vehicle. If you are, I would be happy to help narrow down a few options based on what matters most to you.\n\nIf you want, reply with the type of vehicle you are considering and I will send over a few good matches.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "email-3",
    title: "Email 3",
    description: "Vehicle reinforcement",
    cards: [
      {
        id: "e3-car",
        label: "Vehicle",
        subject: "About the <{VehicleMake}> <{VehicleModel}> you viewed",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI wanted to reach back out regarding the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}>. Vehicles like this tend to get a good amount of attention, and I wanted to make sure you had someone here to help if you are still considering it.\n\nIf you would like, I can have it ready for you to see in person.\n\nBest regards,\nElias Hazboun",
      },
      {
        id: "e3-no-car",
        label: "No Vehicle",
        subject: "I can help narrow things down",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI know shopping for a vehicle can feel overwhelming when there are a lot of options. That is where I can help.\n\nIf you tell me what matters most to you, whether that is payment, size, fuel economy, or features, I can narrow things down and make this easier.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "email-4",
    title: "Email 4",
    description: "Trust and social proof",
    cards: [
      {
        id: "e4-car",
        label: "Vehicle",
        subject: "A lot of customers have been looking at this one",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI just wanted to touch base again on the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}>. Models like this have been getting a lot of attention, and I wanted to make sure you still had a chance to take a look if it is on your radar.\n\nIf you would like to come by, I would be happy to have it ready for you.\n\nBest regards,\nElias Hazboun",
      },
      {
        id: "e4-no-car",
        label: "No Vehicle",
        subject: "Happy to help with your search",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI wanted to check in again and let you know I am still here to help with your search. A lot of customers tell me the hardest part is just narrowing down where to start, and I would be happy to make that part simple for you.\n\nReply any time and I can put together a few options for you.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "email-5",
    title: "Email 5",
    description: "Decision help",
    cards: [
      {
        id: "e5-car",
        label: "Vehicle",
        subject: "Would it help to go over numbers?",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nA lot of customers at this point just want help figuring out whether the vehicle makes sense before taking the next step.\n\nIf it would help, I can go over pricing, estimated payments, trade value, or any other details on the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}> so you can make a clear decision.\n\nBest regards,\nElias Hazboun",
      },
      {
        id: "e5-no-car",
        label: "No Vehicle",
        subject: "What can I help narrow down for you?",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI wanted to check in and see what part of the search I can help with most. Some customers need help narrowing down models, and others mainly want to stay within a certain budget or payment range.\n\nIf you point me in the right direction, I will do the legwork for you.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "email-6",
    title: "Email 6",
    description: "Soft urgency",
    cards: [
      {
        id: "e6-car",
        label: "Vehicle",
        subject: "Checking in one more time on the <{VehicleModel}>",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI just wanted to check in one more time regarding the <{VehicleYear}> <{VehicleMake}> <{VehicleModel}>. If you are still considering it, I would be happy to help you take the next step or answer anything that would make things easier.\n\nWould this week or early next week work better if you would like to stop by?\n\nBest regards,\nElias Hazboun",
      },
      {
        id: "e6-no-car",
        label: "No Vehicle",
        subject: "Still searching?",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI wanted to send one more quick check-in to see if you are still in the market for a vehicle. If you are, I would still be glad to help and make the process easy.\n\nIf you want to restart the conversation, just reply here and I will pick it up from there.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "email-7",
    title: "Email 7",
    description: "Final check in",
    cards: [
      {
        id: "e7-general",
        label: "General",
        subject: "Here whenever you are ready",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nI know timing is everything, so I just wanted to leave the door open and let you know I am here whenever you are ready.\n\nIf you are still looking, I would be glad to help. If you already found something, I completely understand and appreciate the opportunity.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
  {
    id: "extra",
    title: "Extra",
    description: "Additional templates",
    cards: [
      {
        id: "call-thank-you",
        label: "Thank You For Taking My Call",
        subject: "Thank you for taking my call",
        body:
          "Hi Mr./Mrs. <{CustLastName}>,\n\nThank you again for taking a moment to speak with me today. I enjoyed the chance to connect and learn a little more about what you are looking for.\n\nIf any questions come up, or if there is anything I can help with in the meantime, please feel free to reach out.\n\nI look forward to helping you.\n\nBest regards,\nElias Hazboun",
      },
    ],
  },
];

export default function EmailPage() {
  const [sections, setSections] = useState<TemplateSection[]>(initialSections);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalTemplates = useMemo(
    () => sections.reduce((count, section) => count + section.cards.length, 0),
    [sections]
  );

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const handleCopy = async (card: TemplateCard) => {
    const textToCopy = `Subject: ${card.subject}\n\n${card.body}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        fallbackCopy(textToCopy);
      }
      setCopiedId(card.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error("Failed to copy template", error);
      fallbackCopy(textToCopy);
      setCopiedId(card.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const updateCard = (
    sectionId: string,
    cardId: string,
    field: keyof Pick<TemplateCard, "label" | "subject" | "body">,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              cards: section.cards.map((card) =>
                card.id !== cardId ? card : { ...card, [field]: value }
              ),
            }
      )
    );
  };

  const addTemplateToSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const newCard: TemplateCard = {
          id: `${sectionId}-${Date.now()}`,
          label: "New Template",
          subject: "New Subject",
          body: "New email body",
        };

        return { ...section, cards: [...section.cards, newCard] };
      })
    );
  };

  const addSection = () => {
    const newIndex = sections.length + 1;
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      title: `New Section ${newIndex}`,
      description: "Custom templates",
      cards: [
        {
          id: `section-${Date.now()}-card`,
          label: "New Template",
          subject: "New Subject",
          body: "New email body",
        },
      ],
    };

    setSections((prev) => [...prev, newSection]);
  };

  const updateSectionMeta = (
    sectionId: string,
    field: keyof Pick<TemplateSection, "title" | "description">,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId ? section : { ...section, [field]: value }
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sales Playbook
              </div>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Email Templates</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Edit templates, add new ones, and save everything into your SQLite-backed template library.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
                {sections.length} sections • {totalTemplates} templates
              </div>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Section
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save to DB"}
              </button>
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-3">
                  <input
                    value={section.title}
                    onChange={(e) => updateSectionMeta(section.id, "title", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-xl font-semibold text-slate-900 outline-none focus:border-slate-500"
                  />
                  <input
                    value={section.description}
                    onChange={(e) => updateSectionMeta(section.id, "description", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addTemplateToSection(section.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {section.cards.map((card) => {
                const isEditing = editingId === card.id;
                const isCopied = copiedId === card.id;

                return (
                  <div
                    key={card.id}
                    className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          value={card.label}
                          onChange={(e) => updateCard(section.id, card.id, "label", e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500"
                        />
                        <input
                          value={card.subject}
                          onChange={(e) => updateCard(section.id, card.id, "subject", e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : card.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={card.body}
                        onChange={(e) => updateCard(section.id, card.id, "body", e.target.value)}
                        className="min-h-[260px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
                      />
                    ) : (
                      <div className="min-h-[260px] whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {card.body}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(card)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        {isCopied ? "Copied" : "Copy Email"}
                      </button>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingId(card.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="rounded-3xl bg-slate-900 p-6 text-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold">SQLite API contract</h3>
          <p className="mt-2 text-sm text-slate-300">
            This page is ready to post template data to <span className="font-semibold text-white">/api/email-templates</span>.
            Your API can save the full section payload or normalize it into sections and templates tables.
          </p>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">
{`Suggested schema:

sections
- id TEXT PRIMARY KEY
- title TEXT NOT NULL
- description TEXT
- sort_order INTEGER NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

templates
- id TEXT PRIMARY KEY
- section_id TEXT NOT NULL
- label TEXT NOT NULL
- subject TEXT NOT NULL
- body TEXT NOT NULL
- sort_order INTEGER NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL`}
          </pre>
        </div>
      </div>
    </div>
  );
}
