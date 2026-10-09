"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CARRIERS } from "./agencies";

type Agency = {
  name: string;
  address: string;
  city: string;
  phone: string;
};

type Carrier = {
  name: string;
  address: string;
  phone: string;
  agencies: Agency[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function InsurancePage() {
  const [activeCarrier, setActiveCarrier] = useState<Carrier | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");

  const filteredAgencies = useMemo(() => {
    if (!activeCarrier) return [];

    const q = query.trim().toLowerCase();

    if (!q) return activeCarrier.agencies;

    return activeCarrier.agencies.filter((agency) => {
      const searchable = [
        agency.name,
        agency.address,
        agency.city,
        agency.phone,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [activeCarrier, query]);

  async function copyText(text: string, label = "Copied") {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      setCopied("Copy failed");
      setTimeout(() => setCopied(""), 1200);
    }
  }

  function copyAgencyBlock(agency: Agency) {
    return [
      agency.name,
      agency.address,
      agency.city,
      agency.phone,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function copyCarrierBlock(carrier: Carrier) {
    return [
      carrier.name,
      carrier.address,
      carrier.phone,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          

          {activeCarrier && (
            <button
              type="button"
              onClick={() => {
                setActiveCarrier(null);
                setQuery("");
              }}
              className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
            >
              All Carriers
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <section className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            Personal insurance lookup
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
            Insurance Quick Copy
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Tap a carrier, search local agencies, and copy the exact line you need.
          </p>
        </section>

        {!activeCarrier ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CARRIERS.map((carrier: Carrier) => (
              <button
                key={carrier.name}
                type="button"
                onClick={() => setActiveCarrier(carrier)}
                className="min-h-[150px] rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-blue-600">
                  {initials(carrier.name)}
                </div>

                <div className="text-lg font-black">{carrier.name}</div>
                <div className="mt-2 text-sm text-slate-500">
                  {carrier.agencies.length} local agencies
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border bg-white/80 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Selected carrier
                </p>
                <h2 className="mt-1 text-3xl font-black">{activeCarrier.name}</h2>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                {activeCarrier.agencies.length} agencies
              </span>
            </div>

            <div className="mb-4 rounded-2xl border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Headquarters</h3>

                <button
                  type="button"
                  onClick={() =>
                    copyText(copyCarrierBlock(activeCarrier), "Carrier copied")
                  }
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  Copy Carrier Block
                </button>
              </div>

              <div className="grid gap-2">
                <CopyLine
                  label="Carrier"
                  value={activeCarrier.name}
                  onCopy={copyText}
                />
                <CopyLine
                  label="HQ Address"
                  value={activeCarrier.address}
                  onCopy={copyText}
                />
                <CopyLine
                  label="Main Phone"
                  value={activeCarrier.phone}
                  onCopy={copyText}
                />
              </div>
            </div>

            <div className="mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search local agencies by name, city, address, or phone..."
                className="w-full rounded-full border px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-3">
              {filteredAgencies.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
                  No matching local agencies for this carrier yet.
                </div>
              ) : (
                filteredAgencies.map((agency, index) => (
                  <article
                    key={`${agency.name}-${agency.phone}-${index}`}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{agency.name}</h3>
                        <p className="text-sm text-slate-500">
                          {agency.city || "City not listed"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(copyAgencyBlock(agency), "Agency copied")
                        }
                        className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        Copy Card
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <CopyLine
                        label="Agent Name"
                        value={agency.name}
                        onCopy={copyText}
                      />
                      <CopyLine
                        label="Address"
                        value={agency.address}
                        onCopy={copyText}
                      />
                      <CopyLine
                        label="City"
                        value={agency.city}
                        onCopy={copyText}
                      />
                      <CopyLine
                        label="Phone"
                        value={agency.phone}
                        onCopy={copyText}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {copied}
        </div>
      )}
    </div>
  );
}

function CopyLine({
  label,
  value,
  onCopy,
}: {
  label: string;
  value?: string;
  onCopy: (text: string, label?: string) => void;
}) {
  const displayValue = value || "Not listed";

  return (
    <div className="grid gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-[130px_1fr_auto] sm:items-center">
      <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>

      <div className="break-words text-sm">{displayValue}</div>

      <button
        type="button"
        onClick={() => value && onCopy(value, "Copied")}
        disabled={!value}
        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Copy
      </button>
    </div>
  );
}