"use client";

import { useState } from "react";

type VehicleData = {
  inventoryId: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  vin: string;
  stockNumber: string;
  exteriorColor: string;
  interiorColor: string;
  drivetrain: string;
  transmission: string;
  engine: string;
  price: number | null;
  allInPrice: number | null;
  carfaxUrl: string | null;
  description: string;
  certification: {
    name: string | null;
    benefits: {
      name: string;
      description: string;
    }[];
  };
  equipment: string[];
  options: {
    name: string;
    msrp: number | null;
    features: string[];
  }[];
  photos: string[];
};

export default function ListingHelperPage() {
  const [url, setUrl] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadVehicle() {
    setError("");
    setVehicle(null);

    const match = url.match(/\/vehicle\/(\d+)/);

    if (!match) {
      setError(
        "That doesn't look like a MAX Digital vehicle link."
      );
      return;
    }

    const inventoryId = match[1];

    try {
      setLoading(true);

      const response = await fetch(
        `/listing/${inventoryId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load vehicle.");
      }

      const data = await response.json();
      setVehicle(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function getListingDump() {
    if (!vehicle) return "";

    const optionText = vehicle.options
      .map((option) => {
        const features =
          option.features.length > 0
            ? `\n${option.features
                .map((feature) => `• ${feature}`)
                .join("\n")}`
            : "";

        return `${option.name}${
          option.msrp
            ? ` ($${option.msrp.toLocaleString()})`
            : ""
        }${features}`;
      })
      .join("\n\n");

    const certificationText =
      vehicle.certification.benefits
        .map(
          (benefit) =>
            `• ${benefit.name}: ${benefit.description}`
        )
        .join("\n");

    return `FACEBOOK LISTING VEHICLE INFO

VEHICLE
Year: ${vehicle.year}
Make: ${vehicle.make}
Model: ${vehicle.model}
Trim: ${vehicle.trim}
Mileage: ${vehicle.mileage.toLocaleString()}
VIN: ${vehicle.vin}
Stock #: ${vehicle.stockNumber}
Exterior: ${vehicle.exteriorColor}
Interior: ${vehicle.interiorColor}

POWERTRAIN
Engine: ${vehicle.engine}
Transmission: ${vehicle.transmission}
Drivetrain: ${vehicle.drivetrain}

PRICING
List Price: ${
      vehicle.price
        ? `$${vehicle.price.toLocaleString()}`
        : "N/A"
    }
All-In Price: ${
      vehicle.allInPrice
        ? `$${vehicle.allInPrice.toLocaleString()}`
        : "N/A"
    }

CERTIFICATION / WARRANTY
${vehicle.certification.name || "None"}
${certificationText || "None listed"}

EQUIPMENT
${
  vehicle.equipment.length
    ? vehicle.equipment
        .map((item) => `• ${item}`)
        .join("\n")
    : "None listed"
}

OPTIONS / PACKAGES
${optionText || "None listed"}

DEALER DESCRIPTION
${vehicle.description}

CARFAX
${vehicle.carfaxUrl || "No CARFAX URL provided"}

PHOTOS
${vehicle.photos.length} high-resolution photos available`;
  }

  async function copyListingInfo() {
    await navigator.clipboard.writeText(getListingDump());
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Sales Playbook
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Facebook Listing Helper
          </h1>

          <p className="mt-2 text-slate-500">
            Paste a MAX Digital vehicle link to pull
            everything you need for a listing.
          </p>

          <div className="mt-6 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadVehicle();
              }}
              placeholder="https://barbourhendrickhonda.max.auto/vehicle/87696891"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              onClick={loadVehicle}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Get Vehicle"}
            </button>
          </div>

          {error && (
            <div className="mt-4 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>
      </section>

      {vehicle && (
        <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
          {/* Main Vehicle Header */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[340px_1fr]">
              {vehicle.photos[0] && (
                <img
                  src={vehicle.photos[0]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="h-full min-h-[250px] w-full object-cover"
                />
              )}

              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                      {vehicle.stockNumber}
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-slate-900">
                      {vehicle.year} {vehicle.make}{" "}
                      {vehicle.model} {vehicle.trim}
                    </h2>

                    <p className="mt-2 text-lg text-slate-500">
                      {vehicle.mileage.toLocaleString()} miles
                    </p>
                  </div>

                  {vehicle.price && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        List Price
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${vehicle.price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Info
                    label="Exterior"
                    value={vehicle.exteriorColor}
                  />
                  <Info
                    label="Interior"
                    value={vehicle.interiorColor}
                  />
                  <Info
                    label="Mileage"
                    value={vehicle.mileage.toLocaleString()}
                  />
                  <Info label="VIN" value={vehicle.vin} />
                  <Info
                    label="Stock #"
                    value={vehicle.stockNumber}
                  />
                  <Info
                    label="Drivetrain"
                    value={prettyDrivetrain(
                      vehicle.drivetrain
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={copyListingInfo}
              className="rounded-2xl bg-blue-600 p-5 text-left text-white shadow-sm transition hover:bg-blue-700"
            >
              <div className="text-lg font-bold">
                {copied
                  ? "✓ Copied!"
                  : "Copy Listing Info"}
              </div>
              <div className="mt-1 text-sm text-blue-100">
                Copy everything formatted for ChatGPT
              </div>
            </button>

            <a
              href={`/listing/${vehicle.inventoryId}/photos`}
              className="rounded-2xl bg-slate-900 p-5 text-left text-white shadow-sm transition hover:bg-slate-800"
            >
              <div className="text-lg font-bold">
                Download All Photos
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {vehicle.photos.length} high-resolution
                images as ZIP
              </div>
            </a>

            {vehicle.carfaxUrl ? (
              <a
                href={vehicle.carfaxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="text-lg font-bold text-slate-900">
                  Open CARFAX
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Open vehicle history in a new tab
                </div>
              </a>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-60">
                <div className="text-lg font-bold text-slate-700">
                  CARFAX Unavailable
                </div>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Listing Essentials">
              <InfoRow
                label="Year"
                value={String(vehicle.year)}
              />
              <InfoRow label="Make" value={vehicle.make} />
              <InfoRow label="Model" value={vehicle.model} />
              <InfoRow label="Trim" value={vehicle.trim} />
              <InfoRow
                label="Mileage"
                value={`${vehicle.mileage.toLocaleString()} miles`}
              />
              <InfoRow label="VIN" value={vehicle.vin} />
              <InfoRow
                label="Stock #"
                value={vehicle.stockNumber}
              />
              <InfoRow
                label="Exterior"
                value={vehicle.exteriorColor}
              />
              <InfoRow
                label="Interior"
                value={vehicle.interiorColor}
              />
            </Card>

            <Card title="Powertrain">
              <InfoRow
                label="Engine"
                value={vehicle.engine}
              />
              <InfoRow
                label="Transmission"
                value={vehicle.transmission}
              />
              <InfoRow
                label="Drivetrain"
                value={prettyDrivetrain(
                  vehicle.drivetrain
                )}
              />
              <InfoRow
                label="List Price"
                value={
                  vehicle.price
                    ? `$${vehicle.price.toLocaleString()}`
                    : "N/A"
                }
              />
              <InfoRow
                label="All-In Price"
                value={
                  vehicle.allInPrice
                    ? `$${vehicle.allInPrice.toLocaleString()}`
                    : "N/A"
                }
              />
              <InfoRow
                label="Certification"
                value={
                  vehicle.certification.name || "None"
                }
              />
            </Card>
          </div>

          {/* Warranty */}
          {vehicle.certification.benefits.length > 0 && (
            <Card title={vehicle.certification.name || "Coverage"}>
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicle.certification.benefits.map(
                  (benefit) => (
                    <div
                      key={benefit.name}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {benefit.name}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {benefit.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}

          {/* Options */}
          {vehicle.options.length > 0 && (
            <Card title="Packages & Options">
              <div className="space-y-4">
                {vehicle.options.map((option) => (
                  <div
                    key={option.name}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <h3 className="font-bold text-slate-900">
                        {option.name}
                      </h3>

                      {option.msrp && (
                        <span className="whitespace-nowrap text-sm font-semibold text-slate-500">
                          +${option.msrp.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {option.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {option.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Raw listing info */}
          <Card title="Copy/Paste Vehicle Dump">
            <p className="mb-4 text-sm text-slate-500">
              This is the information you can paste directly
              into ChatGPT when you want a Marketplace or
              Craigslist listing written.
            </p>

            <textarea
              readOnly
              value={getListingDump()}
              className="h-[500px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700 outline-none"
            />

            <button
              onClick={copyListingInfo}
              className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              {copied
                ? "✓ Copied to Clipboard"
                : "Copy Everything"}
            </button>
          </Card>
        </section>
      )}
    </main>
  );
}

function prettyDrivetrain(value: string) {
  const map: Record<string, string> = {
    FourWheelDrive: "4WD",
    AllWheelDrive: "AWD",
    FrontWheelDrive: "FWD",
    RearWheelDrive: "RWD",
  };

  return map[value] || value;
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-slate-800">
        {value || "N/A"}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <button
      onClick={copy}
      className="flex w-full items-center justify-between gap-4 border-b border-slate-100 py-3 text-left last:border-0 hover:text-blue-600"
      title="Click to copy"
    >
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="break-all text-right text-sm font-semibold">
        {copied ? "Copied!" : value || "N/A"}
      </span>
    </button>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </div>
  );
}