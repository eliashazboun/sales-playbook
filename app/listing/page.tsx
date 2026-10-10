"use client";

import { useEffect, useRef, useState } from "react";
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

    isCertified: boolean;

    isDealerCertified: boolean;

    isManufacturerCertified: boolean;

    benefits: {
      name: string;

      description: string;
    }[];
  };

  highlights: string[];

  optionsMsrp: number;

  equipment: string[];

  options: {
    name: string;

    msrp: number | null;

    features: string[];
  }[];

  photos: string[];
};

type BinkCandidate = {
  id: string;

  file: string;

  label: string;

  priority: number;
};

type BinkPlacement = {
  photoPosition: number;

  binkId: string;

  file: string;

  label: string;

  type: "transition" | "info";
};

const BINK_INFO_PATH = "/bink/bink_info";

const BINK_TRANSITION_PATH = "/bink/bink_transition";

const PEEK_BINK: BinkCandidate = {
  id: "peek",

  file: `${BINK_TRANSITION_PATH}/bink_peek.png`,

  label: "Peek",

  priority: 1,
};

const ASK_ELIAS_BINK: BinkCandidate = {
  id: "ask_elias",

  file: `${BINK_INFO_PATH}/bink_ask_elias.png`,

  label: "Ask for Elias",

  priority: 1,
};

const WAVE_BINK: BinkCandidate = {
  id: "wave",

  file: `${BINK_TRANSITION_PATH}/bink_wave.png`,

  label: "Wave",

  priority: 1,
};

const TRANSITION_BINKS: BinkCandidate[] = [
  {
    id: "walking",

    file: `${BINK_TRANSITION_PATH}/bink_walking.png`,

    label: "Walking",

    priority: 0,
  },

  {
    id: "sneak",

    file: `${BINK_TRANSITION_PATH}/bink_sneak.png`,

    label: "Sneak",

    priority: 0,
  },

  {
    id: "roll",

    file: `${BINK_TRANSITION_PATH}/bink_roll.png`,

    label: "Roll",

    priority: 0,
  },
];

function getEligibleBinks(vehicle: VehicleData): BinkCandidate[] {
  const highlights = vehicle.highlights ?? [];

  const candidates: (BinkCandidate | null)[] = [
    vehicle.certification.isCertified
      ? {
          id: "honda_cert",

          file: `${BINK_INFO_PATH}/bink_honda_cert.png`,

          label: vehicle.certification.name || "Honda Certified",

          priority: 1.0,
        }
      : null,

    vehicle.certification.isDealerCertified
      ? {
          id: "hendrick_cert",

          file: `${BINK_INFO_PATH}/bink_hendrick_cert.png`,

          label: vehicle.certification.name || "Hendrick Certified",

          priority: 0.95,
        }
      : null,

    highlights.includes("CARFAX_NO_ACCIDENTS")
      ? {
          id: "clean_carfax",

          file: `${BINK_INFO_PATH}/bink_clean_carfax.png`,

          label: "No Accidents Reported",

          priority: 0.9,
        }
      : null,

    highlights.includes("CARFAX_ONE_OWNER")
      ? {
          id: "one_owner",

          file: `${BINK_INFO_PATH}/bink_one_owner.png`,

          label: "CARFAX 1-Owner",

          priority: 0.85,
        }
      : null,

    highlights.includes("RARE_FIND")
      ? {
          id: "rare_find",

          file: `${BINK_INFO_PATH}/bink_rare_find.png`,

          label: "Rare Find",

          priority: 0.8,
        }
      : null,

    vehicle.drivetrain === "FourWheelDrive"
      ? {
          id: "4x4",

          file: `${BINK_INFO_PATH}/bink_4x4.png`,

          label: "4x4",

          priority: 0.75,
        }
      : null,

    vehicle.optionsMsrp > 3000
      ? {
          id: "loaded",

          file: `${BINK_INFO_PATH}/bink_loaded.png`,

          label: "Loaded",

          priority: 0.7,
        }
      : null,
  ];

  return candidates

    .filter((bink): bink is BinkCandidate => bink !== null)

    .sort((a, b) => b.priority - a.priority);
}

function buildBinkSequence(
  photoCount: number,

  eligibleBinks: BinkCandidate[],
): BinkPlacement[] {
  if (photoCount <= 0) return [];

  if (photoCount === 1) {
    return [
      {
        photoPosition: 0,

        binkId: PEEK_BINK.id,

        file: PEEK_BINK.file,

        label: PEEK_BINK.label,

        type: "transition",
      },
    ];
  }

  if (photoCount === 2) {
    return [
      {
        photoPosition: 0,

        binkId: PEEK_BINK.id,

        file: PEEK_BINK.file,

        label: PEEK_BINK.label,

        type: "transition",
      },

      {
        photoPosition: 1,

        binkId: WAVE_BINK.id,

        file: WAVE_BINK.file,

        label: WAVE_BINK.label,

        type: "transition",
      },
    ];
  }

  /*

   * Reserve:

   *

   * First photo = Peek

   * Second-to-last = Ask for Elias

   * Last photo = Wave

   */

  const availableMiddleSlots = photoCount - 3;

  const middle: {
    bink: BinkCandidate;

    type: "transition" | "info";
  }[] = [];

  let infoIndex = 0;

  let transitionIndex = 0;

  /*

   * First use all eligible vehicle information,

   * interspersed with our normal transitions.

   */

  while (
    middle.length < availableMiddleSlots &&
    infoIndex < eligibleBinks.length
  ) {
    middle.push({
      bink: eligibleBinks[infoIndex],

      type: "info",
    });

    infoIndex++;

    if (
      middle.length < availableMiddleSlots &&
      transitionIndex < TRANSITION_BINKS.length
    ) {
      middle.push({
        bink: TRANSITION_BINKS[transitionIndex],

        type: "transition",
      });

      transitionIndex++;
    }
  }

  /*

   * If we still have empty photos after exhausting

   * vehicle info, fill them with:

   *

   * Ask Elias -> Transition -> Ask Elias -> Transition...

   *

   * This prevents duplicate Ask Elias Binks from

   * appearing directly beside each other.

   */

  let useAskElias = true;

  let fallbackTransitionIndex = 0;

  while (middle.length < availableMiddleSlots) {
    if (useAskElias) {
      middle.push({
        bink: ASK_ELIAS_BINK,

        type: "info",
      });
    } else {
      const transition =
        TRANSITION_BINKS[fallbackTransitionIndex % TRANSITION_BINKS.length];

      middle.push({
        bink: transition,

        type: "transition",
      });

      fallbackTransitionIndex++;
    }

    useAskElias = !useAskElias;
  }

  /*

   * Ask for Elias is always second-to-last.

   */

  middle.push({
    bink: ASK_ELIAS_BINK,

    type: "info",
  });

  const sequence = [
    {
      bink: PEEK_BINK,

      type: "transition" as const,
    },

    ...middle,

    {
      bink: WAVE_BINK,

      type: "transition" as const,
    },
  ];

  return sequence.map((item, photoPosition) => ({
    photoPosition,

    binkId: item.bink.id,

    file: item.bink.file,

    label: item.bink.label,

    type: item.type,
  }));
}

export default function ListingHelperPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const AUTH_KEY = "fb-listing-helper-unlocked";
  const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  const [url, setUrl] = useState("");

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  const [listing, setListing] = useState("");
  const [generatingListing, setGeneratingListing] = useState(false);
  const [listingError, setListingError] = useState("");
  const generationId = useRef(0);

  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  const [downloadingPhotos, setDownloadingPhotos] = useState(false);

  const eligibleBinks = vehicle ? getEligibleBinks(vehicle) : [];

  const binkSequence = buildBinkSequence(selectedPhotos.length, eligibleBinks);

  useEffect(() => {
    const savedExpiration = localStorage.getItem(AUTH_KEY);

    if (savedExpiration) {
      const expiration = Number(savedExpiration);

      if (Date.now() < expiration) {
        setUnlocked(true);
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    }

    setCheckingPassword(false);
  }, []);

  async function generateListing(data: VehicleData, requestId: number) {
    const cacheKey = `marketplace-listing-v1:${data.inventoryId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      if (generationId.current === requestId) setListing(cached);
      return;
    }

    if (generationId.current === requestId) setGeneratingListing(true);
    try {
      const response = await fetch("/listing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle: data }),
      });
      const result = await response.json();
      if (!response.ok || !result.listing) {
        throw new Error(result.error || "Unable to generate listing.");
      }
      if (generationId.current !== requestId) return;
      localStorage.setItem(cacheKey, result.listing);
      setListing(result.listing);
    } catch (err) {
      if (generationId.current === requestId) {
        setListingError(
          err instanceof Error ? err.message : "Generation failed.",
        );
      }
    } finally {
      if (generationId.current === requestId) setGeneratingListing(false);
    }
  }

  async function loadVehicle() {
    const requestId = ++generationId.current;
    setError("");
    setListingError("");
    setListing("");
    setGeneratingListing(false);
    setVehicle(null);
    setSelectedPhotos([]);

    const match = url.match(/\/vehicle\/(\d+)/);
    if (!match) {
      setError("That doesn't look like a MAX Digital vehicle link.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/listing/${match[1]}`);
      if (!response.ok) throw new Error("Unable to load vehicle.");
      const data: VehicleData = await response.json();
      if (generationId.current !== requestId) return;
      setVehicle(data);
      setSelectedPhotos([]);
      void generateListing(data, requestId);
    } catch (err) {
      if (generationId.current === requestId) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      if (generationId.current === requestId) setLoading(false);
    }
  }

  async function copyListingInfo() {
    if (!listing) return;
    try {
      await navigator.clipboard.writeText(listing);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setListingError(
        "Clipboard access failed. You can select and copy the listing below.",
      );
    }
  }

  function retryListing() {
    if (!vehicle) return;
    setListingError("");
    void generateListing(vehicle, generationId.current);
  }

  function togglePhoto(index: number) {
    setSelectedPhotos((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index],
    );
  }

  function selectAllPhotos() {
    if (!vehicle) return;

    setSelectedPhotos(vehicle.photos.map((_, index) => index));
  }

  function clearPhotos() {
    setSelectedPhotos([]);
  }

  async function downloadSelectedPhotos() {
    if (!vehicle || selectedPhotos.length === 0) {
      return;
    }

    try {
      setDownloadingPhotos(true);

      setError("");

      const response = await fetch(`/listing/${vehicle.inventoryId}/photos`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          selectedIndexes: selectedPhotos,

          binkSequence,
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(message || "Unable to download photos.");
      }

      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = downloadUrl;

      anchor.download = `${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.stockNumber}-photos.zip`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download selected photos.",
      );
    } finally {
      setDownloadingPhotos(false);
    }
  }

  function scrollToPhotos() {
    document.getElementById("vehicle-photos")?.scrollIntoView({
      behavior: "smooth",

      block: "start",
    });
  }
  function unlockListingHelper() {
    if (password === "MYTOOL") {
      const expiration = Date.now() + AUTH_DURATION;

      localStorage.setItem(AUTH_KEY, String(expiration));

      setUnlocked(true);
      setPasswordError(false);
      setPassword("");
    } else {
      setPasswordError(true);
    }
  }
  if (checkingPassword) {
    return <main className="min-h-screen bg-slate-100" />;
  }
  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Sales Playbook
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Facebook Listing Helper
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enter password to continue.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                unlockListingHelper();
              }
            }}
            placeholder="Password"
            autoFocus
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          {passwordError && (
            <p className="mt-2 text-sm font-medium text-red-600">
              Incorrect password.
            </p>
          )}

          <button
            type="button"
            onClick={unlockListingHelper}
            className="mt-4 w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-600"
          >
            Unlock
          </button>
        </div>
      </main>
    );
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
            Paste a MAX Digital vehicle link to pull everything you need for a
            listing.
          </p>

          <div className="mt-6 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadVehicle();
                }
              }}
              placeholder="https\://barbourhendrickhonda.max.auto/vehicle/87696891"
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
                      {vehicle.year} {vehicle.make} {vehicle.model}{" "}
                      {vehicle.trim}
                    </h2>

                    <p className="mt-2 text-lg text-slate-500">
                      {vehicle.mileage.toLocaleString()} miles
                    </p>
                  </div>

                  {vehicle.price && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">List Price</p>

                      <p className="text-2xl font-bold text-slate-900">
                        ${vehicle.price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Info label="Exterior" value={vehicle.exteriorColor} />

                  <Info label="Interior" value={vehicle.interiorColor} />

                  <Info
                    label="Mileage"
                    value={vehicle.mileage.toLocaleString()}
                  />

                  <Info label="VIN" value={vehicle.vin} />

                  <Info label="Stock #" value={vehicle.stockNumber} />

                  <Info
                    label="Drivetrain"
                    value={prettyDrivetrain(vehicle.drivetrain)}
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
                  : generatingListing
                    ? "Generating Listing..."
                    : "Copy Marketplace Listing"}
              </div>

              <div className="mt-1 text-sm text-blue-100">
                {listingError
                  ? "Generation failed. Retry below."
                  : listing
                    ? "Ready to paste into Facebook"
                    : "Writing your listing automatically..."}
              </div>
            </button>

            <button
              onClick={scrollToPhotos}
              className="rounded-2xl bg-slate-900 p-5 text-left text-white shadow-sm transition hover:bg-slate-800"
            >
              <div className="text-lg font-bold">Select Photos</div>

              <div className="mt-1 text-sm text-slate-300">
                Choose Marketplace photos to download
              </div>
            </button>

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

          {/* Photo Selector */}

          <div
            id="vehicle-photos"
            className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Marketplace Photos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Click the photos you want in your Marketplace ZIP.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={selectAllPhotos}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Select All
                </button>

                <button
                  onClick={clearPhotos}
                  disabled={selectedPhotos.length === 0}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  onClick={downloadSelectedPhotos}
                  disabled={selectedPhotos.length === 0 || downloadingPhotos}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {downloadingPhotos
                    ? "Creating ZIP..."
                    : `Download Selected (${selectedPhotos.length})`}
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {vehicle.photos.map((photo, index) => {
                const selected = selectedPhotos.includes(index);

                return (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => togglePhoto(index)}
                    className={`group relative overflow-hidden rounded-xl border-4 transition ${
                      selected
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Vehicle photo ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />

                    <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-white">
                      {index + 1}
                    </div>

                    {selected && (
                      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-500">
                {selectedPhotos.length} of {vehicle.photos.length} photos
                selected
              </p>

              <button
                onClick={downloadSelectedPhotos}
                disabled={selectedPhotos.length === 0 || downloadingPhotos}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {downloadingPhotos
                  ? "Creating ZIP..."
                  : `Download Selected (${selectedPhotos.length})`}
              </button>
            </div>
          </div>

          {/* Quick Info */}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Listing Essentials">
              <InfoRow label="Year" value={String(vehicle.year)} />

              <InfoRow label="Make" value={vehicle.make} />

              <InfoRow label="Model" value={vehicle.model} />

              <InfoRow label="Trim" value={vehicle.trim} />

              <InfoRow
                label="Mileage"
                value={`${vehicle.mileage.toLocaleString()} miles`}
              />

              <InfoRow label="VIN" value={vehicle.vin} />

              <InfoRow label="Stock #" value={vehicle.stockNumber} />

              <InfoRow label="Exterior" value={vehicle.exteriorColor} />

              <InfoRow label="Interior" value={vehicle.interiorColor} />
            </Card>

            <Card title="Powertrain">
              <InfoRow label="Engine" value={vehicle.engine} />

              <InfoRow label="Transmission" value={vehicle.transmission} />

              <InfoRow
                label="Drivetrain"
                value={prettyDrivetrain(vehicle.drivetrain)}
              />

              <InfoRow
                label="List Price"
                value={
                  vehicle.price ? `$${vehicle.price.toLocaleString()}` : "N/A"
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
                value={vehicle.certification.name || "None"}
              />
            </Card>
          </div>

          {/* Warranty */}

          {vehicle.certification.benefits.length > 0 && (
            <Card title={vehicle.certification.name || "Coverage"}>
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicle.certification.benefits.map((benefit) => (
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
                ))}
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
                          +$
                          {option.msrp.toLocaleString()}
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

          {/* Generated Marketplace Listing */}
          <Card title="Marketplace Listing">
            <p className="mb-4 text-sm text-slate-500">
              Generated automatically from MAX vehicle details. Review before
              posting.
            </p>
            {listingError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {listingError}
                <button
                  onClick={retryListing}
                  className="ml-3 font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}
            <textarea
              value={listing}
              onChange={(event) => setListing(event.target.value)}
              placeholder={
                generatingListing
                  ? "Generating your Marketplace listing..."
                  : "Your listing will appear here."
              }
              className="h-[500px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 outline-none"
            />
            <button
              onClick={copyListingInfo}
              disabled={!listing || generatingListing}
              className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied
                ? "✓ Copied to Clipboard"
                : generatingListing
                  ? "Generating..."
                  : "Copy Marketplace Listing"}
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

function Info({ label, value }: { label: string; value: string }) {
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

function InfoRow({ label, value }: { label: string; value: string }) {
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
      <span className="text-sm text-slate-500">{label}</span>

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
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>

      {children}
    </div>
  );
}
