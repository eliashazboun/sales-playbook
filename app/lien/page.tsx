"use client";

import { useMemo, useState } from "react";

type Lienholder = {
  name: string;
  address: string;
  cityStateZip: string;
};

const lienholders: Lienholder[] = [
  {
    name: "American Honda Finance Corp",
    address: "3625 West Royal Ln Suite 100",
    cityStateZip: "Irving, TX 75063",
  },
  {
    name: "Ally Financial",
    address: "PO Box 8143",
    cityStateZip: "Cockeysville, MD 21030",
  },
  {
    name: "American Credit Acceptance LLC",
    address: "PO Box 4419",
    cityStateZip: "Wilmington, OH 45177",
  },
  {
    name: "AmeriCredit Financial Services",
    address: "961 E. Main St",
    cityStateZip: "Spartanburg, SC 29302",
  },
  {
    name: "Bank of America NA",
    address: "PO Box 2759",
    cityStateZip: "Jacksonville, FL 32203",
  },
  {
    name: "Capital One Auto Finance",
    address: "PO Box 390907",
    cityStateZip: "Minneapolis, MN 55439",
  },
  {
    name: "Coastal Federal Credit Union",
    address: "PO Box 58429",
    cityStateZip: "Raleigh, NC 27658",
  },
  {
    name: "Consumer Portfolio Services (CPS)",
    address: "PO Box 57071",
    cityStateZip: "Irvine, CA 92619",
  },
  {
    name: "Crescent Bank and Trust",
    address: "PO Box 245",
    cityStateZip: "Addison, TX 75001",
  },
  {
    name: "Exeter Finance LLC",
    address: "PO Box 369",
    cityStateZip: "Carmel, IN 46082",
  },
  {
    name: "Fifth Third Bank",
    address: "PO Box 1266",
    cityStateZip: "Minneapolis, MN 55440",
  },
  {
    name: "First Flight Federal Credit Union",
    address: "1815 Kildaire Farm Rd #A",
    cityStateZip: "Cary, NC 27518",
  },
  {
    name: "First Technology FCU",
    address: "PO Box 779004",
    cityStateZip: "Rocklin, CA 95677",
  },
  {
    name: "Flagship Credit Acceptance",
    address: "PO Box 965",
    cityStateZip: "Chadds Ford, PA 19317",
  },
  {
    name: "Fort Bragg FCU",
    address: "PO Box 70240",
    cityStateZip: "Fort Liberty, NC 28307",
  },
  {
    name: "Global Lending Services",
    address: "PO Box 970",
    cityStateZip: "Wilmington, OH 45177",
  },
  {
    name: "GM Financial",
    address: "PO Box 1617",
    cityStateZip: "Minneapolis, MN 55440",
  },
  {
    name: "JP Morgan Chase Bank NA",
    address: "700 Kansas Lane LA4-4041",
    cityStateZip: "Monroe, LA 71203",
  },
  {
    name: "Local Government FCU (LGFCU)",
    address: "PO Box 27528",
    cityStateZip: "Raleigh, NC 27611",
  },
  {
    name: "Marine Federal Credit Union",
    address: "PO Box 1551",
    cityStateZip: "Jacksonville, NC 28541",
  },
  {
    name: "Pentagon Federal Credit Union",
    address: "PO Box 2365",
    cityStateZip: "Sioux City, IA 51106",
  },
  {
    name: "Piedmont Advantage Credit Union",
    address: "3530 Advantage Way",
    cityStateZip: "Winston Salem, NC 27103",
  },
  {
    name: "PNC Bank NA",
    address: "PO Box 313",
    cityStateZip: "Wilmington, OH 45177",
  },
  {
    name: "Regional Acceptance Corp",
    address: "PO Box 2430",
    cityStateZip: "Sioux City, IA 51106",
  },
  {
    name: "RTP Federal Credit Union",
    address: "PO Box 12807",
    cityStateZip: "Durham, NC 27709",
  },
  {
    name: "Santander",
    address: "PO Box 961288",
    cityStateZip: "Carmel, IN 46082",
  },
  {
    name: "Sharonview Federal Credit Union",
    address: "PO Box 2070",
    cityStateZip: "Fort Mill, SC 29716",
  },
  {
    name: "State Employees Credit Union (SECU)",
    address: "PO Box 27528",
    cityStateZip: "Raleigh, NC 27611",
  },
  {
    name: "Telco Credit Union",
    address: "PO Box 4002",
    cityStateZip: "Tarboro, NC 27886",
  },
  {
    name: "Truist",
    address: "PO Box 819",
    cityStateZip: "Wilson, NC 27894",
  },
  {
    name: "United Auto Credit Corp",
    address: "PO Box 390196",
    cityStateZip: "Minneapolis, MN 55439",
  },
  {
    name: "US Bank",
    address: "PO Box 2928",
    cityStateZip: "Oshkosh, WI 54903",
  },
  {
    name: "Wells Fargo Auto",
    address: "PO Box 29296",
    cityStateZip: "Phoenix, AZ 85038",
  },
  {
    name: "Westlake Financial Services",
    address: "PO Box 76809",
    cityStateZip: "Los Angeles, CA 90076",
  },
];

export default function LienPage() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filteredLienholders = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return lienholders;

    return lienholders.filter((lienholder) =>
      `${lienholder.name} ${lienholder.address} ${lienholder.cityStateZip}`
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  const copyToClipboard = async (
    text: string,
    identifier: string
  ) => {
    await navigator.clipboard.writeText(text);
    setCopied(identifier);

    setTimeout(() => {
      setCopied(null);
    }, 1200);
  };

  const copyFullAddress = async (lienholder: Lienholder) => {
    const fullAddress = `${lienholder.name}\n${lienholder.address}\n${lienholder.cityStateZip}`;

    await copyToClipboard(fullAddress, lienholder.name);
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Sales Playbook
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Lienholder Information
          </h1>

          <p className="mt-2 text-slate-500">
            Insurance lienholder addresses for quick reference.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-2xl">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lienholder..."
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Showing {filteredLienholders.length} of {lienholders.length} lienholders
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filteredLienholders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLienholders.map((lienholder) => (
              <div
                key={lienholder.name}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-full flex-col">
                  <h2 className="text-lg font-bold text-slate-900">
                    {lienholder.name}
                  </h2>

                  <div className="mt-4 flex-1 space-y-1 text-slate-600">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          lienholder.address,
                          `${lienholder.name}-address`
                        )
                      }
                      className="block text-left transition hover:text-blue-600"
                      title="Click to copy"
                    >
                      {lienholder.address}
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          lienholder.cityStateZip,
                          `${lienholder.name}-city`
                        )
                      }
                      className="block text-left transition hover:text-blue-600"
                      title="Click to copy"
                    >
                      {lienholder.cityStateZip}
                    </button>
                  </div>

                  <button
                    onClick={() => copyFullAddress(lienholder)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    {copied === lienholder.name ? (
                      <>
                        <span>✓</span>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
                          />
                        </svg>
                        Copy Full Address
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">
              No lienholders found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try searching for a different name.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}