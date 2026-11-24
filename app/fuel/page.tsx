"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// =====================================================
// TYPES
// =====================================================

type MenuType = "year" | "make" | "model" | "options";

type MenuItem = {
  text: string;
  value: string;
};

type Vehicle = {
  id: number;
  year: number | null;
  make: string | null;
  model: string | null;
  transmission: string | null;
  drive: string | null;
  fuelType: string | null;
  fuelType1: string | null;
  fuelType2: string | null;
  alternativeVehicleType: string | null;
  mpg: {
    city: number | null;
    highway: number | null;
    combined: number | null;
    combinedUnrounded: number | null;
  };
};

type FuelPrices = {
  regular: number | null;
  midgrade: number | null;
  premium: number | null;
  diesel: number | null;
  e85: number | null;
  electric: number | null;
  cng: number | null;
  lpg: number | null;
};

type FuelInfo = {
  price: number;
  label: string;
};

type Calculation = {
  currentVehicle: Vehicle;
  newVehicle: Vehicle;
  annualMiles: number;
  currentMpg: number;
  newMpg: number;
  currentFuel: FuelInfo;
  newFuel: FuelInfo;
  currentAnnualCost: number;
  newAnnualCost: number;
  monthlySavings: number;
  annualSavings: number;
  fiveYearSavings: number;
};

const API = "/api/fuel-economy";

// Change this to adjust the loading duration.
const LOADING_DURATION = 3000;

// =====================================================
// HELPERS
// =====================================================

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);

function vehicleName(vehicle: Vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function getMpg(vehicle: Vehicle | null): number | null {
  if (!vehicle) return null;

  const unrounded = Number(vehicle.mpg?.combinedUnrounded);
  const rounded = Number(vehicle.mpg?.combined);

  if (Number.isFinite(unrounded) && unrounded > 0) {
    return unrounded;
  }

  if (Number.isFinite(rounded) && rounded > 0) {
    return rounded;
  }

  return null;
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getFuelCategory(
  vehicle: Vehicle | null,
): "regular" | "midgrade" | "premium" | null {
  if (!vehicle) return null;

  const fuel = (vehicle.fuelType1 ?? "").toLowerCase();
  const allFuels = (vehicle.fuelType ?? "").toLowerCase();
  const technology = (vehicle.alternativeVehicleType ?? "").toLowerCase();

  // Exclude electric and dual-fuel configurations
  // that require a different calculation.
  if (
    technology.includes("plug-in") ||
    technology.includes("plug in") ||
    technology.includes("electric vehicle") ||
    allFuels.includes("electricity") ||
    Boolean(vehicle.fuelType2?.trim())
  ) {
    return null;
  }

  if (fuel.includes("midgrade")) return "midgrade";
  if (fuel.includes("premium")) return "premium";
  if (fuel.includes("regular")) return "regular";

  return null;
}

function getFuelInfo(
  vehicle: Vehicle | null,
  prices: FuelPrices | null,
): FuelInfo | null {
  if (!vehicle || !prices) return null;

  const category = getFuelCategory(vehicle);

  if (!category) return null;

  const price = prices[category];

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  const labels = {
    regular: "Regular Gasoline",
    midgrade: "Midgrade Gasoline",
    premium: "Premium Gasoline",
  };

  return {
    price,
    label: labels[category],
  };
}

function calculateSavings(
  currentVehicle: Vehicle,
  newVehicle: Vehicle,
  annualMiles: number,
  currentFuel: FuelInfo,
  newFuel: FuelInfo,
): Calculation | null {
  const currentMpg = getMpg(currentVehicle);
  const newMpg = getMpg(newVehicle);

  if (
    currentMpg === null ||
    newMpg === null ||
    !Number.isFinite(annualMiles) ||
    annualMiles <= 0
  ) {
    return null;
  }

  const currentAnnualCost = (annualMiles / currentMpg) * currentFuel.price;

  const newAnnualCost = (annualMiles / newMpg) * newFuel.price;

  const annualSavings = currentAnnualCost - newAnnualCost;

  return {
    currentVehicle,
    newVehicle,
    annualMiles,
    currentMpg,
    newMpg,
    currentFuel,
    newFuel,
    currentAnnualCost,
    newAnnualCost,
    monthlySavings: annualSavings / 12,
    annualSavings,
    fiveYearSavings: annualSavings * 5,
  };
}

// =====================================================
// ICONS
// =====================================================

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name:
    | "car"
    | "fuel"
    | "check"
    | "close"
    | "chevron"
    | "sparkles"
    | "arrow"
    | "refresh";
  size?: number;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    car: (
      <>
        <path d="M5 17h14l1-6-2-5H6l-2 5 1 6Z" />
        <path d="M4 11h16M7 17v2M17 17v2" />
        <path d="M7 14h2M15 14h2" />
      </>
    ),
    fuel: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
        <path d="M3 21h13M7 7h5v5H7z" />
        <path d="m15 8 3 3v7a2 2 0 0 0 4 0v-6l-3-3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 17 .7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.5-2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// =====================================================
// VEHICLE MENU HOOK
// =====================================================

function useVehicleMenu(
  type: MenuType,
  year = "",
  make = "",
  model = "",
  enabled = true,
) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setItems([]);
      setError("");

      try {
        const params = new URLSearchParams({ type });

        if (year) params.set("year", year);
        if (make) params.set("make", make);
        if (model) params.set("model", model);

        const response = await fetch(`${API}/menu?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Unable to load ${type} options.`);
        }

        const data = await response.json();

        if (!Array.isArray(data.items)) {
          throw new Error("Invalid vehicle menu response.");
        }

        if (!controller.signal.aborted) {
          setItems(data.items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Unable to load options.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [type, year, make, model, enabled]);

  return { items, loading, error };
}

// =====================================================
// SELECT FIELD
// =====================================================

function SelectField({
  label,
  value,
  items,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  value: string;
  items: MenuItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">
          {loading ? "Loading..." : `Select ${label.toLowerCase()}`}
        </option>

        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.text}
          </option>
        ))}
      </select>
    </div>
  );
}

// =====================================================
// VEHICLE SELECTOR
// =====================================================

function VehicleSelector({
  title,
  subtitle,
  vehicle,
  onChange,
  accent,
}: {
  title: string;
  subtitle: string;
  vehicle: Vehicle | null;
  onChange: (vehicle: Vehicle | null) => void;
  accent: "blue" | "green";
}) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [option, setOption] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const years = useVehicleMenu("year");

  const makes = useVehicleMenu("make", year, "", "", Boolean(year));

  const models = useVehicleMenu("model", year, make, "", Boolean(year && make));

  const options = useVehicleMenu(
    "options",
    year,
    make,
    model,
    Boolean(year && make && model),
  );

  useEffect(() => {
    if (!option) {
      setLoadingVehicle(false);
      setVehicleError("");
      return;
    }

    const controller = new AbortController();

    async function loadVehicle() {
      setLoadingVehicle(true);
      setVehicleError("");

      try {
        const response = await fetch(
          `${API}/vehicle/${encodeURIComponent(option)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load vehicle details.");
        }

        const data = await response.json();

        if (!data.vehicle) {
          throw new Error("Vehicle data unavailable.");
        }

        if (!controller.signal.aborted) {
          onChange(data.vehicle);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          onChange(null);

          setVehicleError(
            error instanceof Error ? error.message : "Vehicle lookup failed.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVehicle(false);
        }
      }
    }

    loadVehicle();

    return () => controller.abort();
  }, [option, onChange]);

  function reset(
    nextYear: string,
    nextMake: string,
    nextModel: string,
    nextOption: string,
  ) {
    setYear(nextYear);
    setMake(nextMake);
    setModel(nextModel);
    setOption(nextOption);
    setVehicleError("");
    onChange(null);
  }

  const error =
    years.error || makes.error || models.error || options.error || vehicleError;

  const supported = Boolean(
    vehicle && getMpg(vehicle) && getFuelCategory(vehicle),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div
          className={
            accent === "blue"
              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              : "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
          }
        >
          <Icon name="car" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {supported && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            <Icon name="check" size={13} />
            Ready
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Year"
            items={years.items}
            value={year}
            loading={years.loading}
            onChange={(v) => reset(v, "", "", "")}
          />

          <SelectField
            label="Make"
            items={makes.items}
            value={make}
            loading={makes.loading}
            disabled={!year}
            onChange={(v) => reset(year, v, "", "")}
          />

          <SelectField
            label="Model"
            items={models.items}
            value={model}
            loading={models.loading}
            disabled={!make}
            onChange={(v) => reset(year, make, v, "")}
          />

          <SelectField
            label="Configuration"
            items={options.items}
            value={option}
            loading={options.loading}
            disabled={!model}
            onChange={(v) => reset(year, make, model, v)}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {error}
          </p>
        )}

        {loadingVehicle && (
          <p className="mt-4 text-xs text-slate-500">
            Retrieving vehicle information...
          </p>
        )}

        {vehicle && !loadingVehicle && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              {vehicleName(vehicle)}
            </p>

            <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-3">
              {[
                {
                  label: "City",
                  value: vehicle.mpg.city,
                },
                {
                  label: "Highway",
                  value: vehicle.mpg.highway,
                },
                {
                  label: "Combined",
                  value: vehicle.mpg.combined,
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {item.value ?? "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.label} MPG</p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {vehicle.fuelType1 || "Unknown fuel type"}
              {vehicle.transmission ? ` · ${vehicle.transmission}` : ""}
            </p>

            {!supported && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                This vehicle is not supported by the current gasoline
                calculator.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// ANIMATED MONEY COUNTER
// =====================================================

function MoneyCounter({ amount }: { amount: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const duration = 1500;

    function animate(timestamp: number) {
      if (start === null) start = timestamp;

      const progress = Math.min((timestamp - start) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 4);

      setDisplay(amount * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [amount]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <span className="tabular-nums">
      {money(prefersReducedMotion ? amount : display)}
    </span>
  );
}

// =====================================================
// CONFETTI
// =====================================================

function Confetti() {
  const colors = ["#facc15", "#ffffff", "#f472b6", "#67e8f9", "#a7f3d0"];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece absolute -top-3 h-2.5 w-2 rounded-sm"
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.08}s`,
            animationDuration: `${2 + (i % 4) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

// =====================================================
// MORE DETAILS TABLE
// =====================================================

function DetailsTable({ data }: { data: Calculation }) {
  const rows = [
    {
      label: "Vehicle",
      current: vehicleName(data.currentVehicle),
      next: vehicleName(data.newVehicle),
    },
    {
      label: "Combined MPG",
      current: formatNumber(data.currentMpg),
      next: formatNumber(data.newMpg),
    },
    {
      label: "Fuel Type",
      current: data.currentFuel.label,
      next: data.newFuel.label,
    },
    {
      label: "Fuel Price",
      current: `${money(data.currentFuel.price)}/gal`,
      next: `${money(data.newFuel.price)}/gal`,
    },
    {
      label: "Monthly Fuel Cost",
      current: money(data.currentAnnualCost / 12),
      next: money(data.newAnnualCost / 12),
    },
    {
      label: "Annual Fuel Cost",
      current: money(data.currentAnnualCost),
      next: money(data.newAnnualCost),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-3 font-semibold">Detail</th>
              <th className="px-3 py-3 font-semibold">Current</th>
              <th className="px-3 py-3 font-semibold">New</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-3 py-3 font-medium text-slate-500">
                  {row.label}
                </td>
                <td className="px-3 py-3 text-slate-800">{row.current}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">
                  {row.next}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Annual mileage:{" "}
        <strong className="text-slate-800">
          {formatNumber(data.annualMiles)} miles
        </strong>
        <p className="mt-2 leading-relaxed">
          Estimates use EPA combined MPG and FuelEconomy.gov reference fuel
          prices. Actual costs may vary. Five-year figures assume constant
          mileage, MPG, and prices.
        </p>
      </div>
    </div>
  );
}

// =====================================================
// SAVINGS POPUP
// =====================================================






function SavingsModal({
  data,
  onClose,
}: {
  data: Calculation;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [progress, setProgress] = useState(0);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const positive = data.monthlySavings > 0.005;
  const negative = data.monthlySavings < -0.005;
  const amount = Math.abs(data.monthlySavings);

  // --------------------------------------------------
  // FAKE LOADING — 2 SECONDS
  // --------------------------------------------------

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    let frame = 0;

    function animateLoading(now: number) {
      const elapsed = now - start;
      const percentage = Math.min(
        (elapsed / duration) * 100,
        100
      );

      setProgress(percentage);

      if (percentage < 100) {
        frame = requestAnimationFrame(animateLoading);
      } else {
        setLoading(false);
      }
    }

    frame = requestAnimationFrame(animateLoading);

    return () => cancelAnimationFrame(frame);
  }, []);

  // --------------------------------------------------
  // ANIMATE SAVINGS NUMBER
  // --------------------------------------------------

  useEffect(() => {
    if (loading) return;

    const duration = 1500;
    const start = performance.now();
    let frame = 0;

    function animateAmount(now: number) {
      const percentage = Math.min(
        (now - start) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - percentage, 4);

      setDisplayAmount(amount * eased);

      if (percentage < 1) {
        frame = requestAnimationFrame(animateAmount);
      } else {
        setDisplayAmount(amount);
      }
    }

    frame = requestAnimationFrame(animateAmount);

    return () => cancelAnimationFrame(frame);
  }, [loading, amount]);

  // --------------------------------------------------
  // MODAL CONTROLS
  // --------------------------------------------------

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      // Keep keyboard focus inside the modal.
      if (event.key === "Tab" && dialogRef.current) {
        const buttons = Array.from(
          dialogRef.current.querySelectorAll<HTMLButtonElement>(
            "button:not([disabled])"
          )
        );

        if (buttons.length === 0) return;

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  // --------------------------------------------------
  // CONFETTI
  // --------------------------------------------------

  // Fixed values prevent random rendering changes.
  const confetti = Array.from({ length: 55 }, (_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    delay: `${(i * 7 % 16) * 0.09}s`,
    duration: `${2.5 + (i % 5) * 0.35}s`,
    color: [
      "#34d399",
      "#60a5fa",
      "#fbbf24",
      "#ffffff",
      "#a78bfa",
      "#f472b6",
    ][i % 6],
    width: i % 3 === 0 ? "9px" : "6px",
    height: i % 3 === 0 ? "14px" : "10px",
  }));

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="savings-modal-title"
        className="relative flex h-[94dvh] w-[94vw] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* CLOSE BUTTON */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close savings modal"
          className="absolute right-6 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl font-light text-white transition hover:bg-white/20"
        >
          ×
        </button>

        {loading ? (
          // ==================================================
          // LOADING SCREEN
          // ==================================================

          <div
            className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8 py-16 text-center"
            style={{
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
              color: "#ffffff",
            }}
          >
            <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
              {/* SPINNER */}
              <div className="relative mb-12 flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-[6px] border-white/15 border-t-emerald-400" />

                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                  <Icon
                    name="fuel"
                    size={44}
                    className="text-white"
                  />
                </div>
              </div>

              <h2
                id="savings-modal-title"
                className="text-3xl font-bold tracking-tight text-white sm:text-5xl"
              >
                Calculating your savings
              </h2>

              <p className="mt-6 text-base text-blue-100 sm:text-lg">
                Checking fuel economy and calculating
                your monthly savings.
              </p>

              {/* PROGRESS BAR */}
              <div className="mt-14 w-full max-w-lg">
                <progress
                  value={progress}
                  max={100}
                  aria-label="Calculating savings"
                  className="savings-progress h-5 w-full"
                />

                <div className="mt-5 flex items-center justify-between text-sm font-medium text-blue-100">
                  <span>Calculating...</span>
                  <span className="tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ==================================================
          // SAVINGS REVEAL
          // ==================================================

          <>
            <div
              className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-8 py-16 text-center sm:px-16"
              style={{
                background:
                  "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
                color: "#ffffff",
              }}
            >
              {/* BACKGROUND DECORATIONS */}
              <div className="pointer-events-none absolute -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-blue-400/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-emerald-400/10 blur-3xl" />

              {/* CONFETTI */}
              {positive && (
                <div
                  className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
                  aria-hidden="true"
                >
                  {confetti.map((piece, i) => (
                    <span
                      key={i}
                      className="savings-confetti absolute -top-5 rounded-sm"
                      style={{
                        left: piece.left,
                        width: piece.width,
                        height: piece.height,
                        backgroundColor: piece.color,
                        animationDelay: piece.delay,
                        animationDuration: piece.duration,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* MAIN CONTENT */}
              <div className="relative z-10 flex w-full flex-col items-center">
                {/* SMALL INTRO */}
                <div
                  className="mb-12 flex items-center gap-3"
                  style={{
                    animation:
                      "savingsFadeIn 0.7s ease-out both",
                  }}
                >
                  <Icon
                    name={positive ? "sparkles" : "fuel"}
                    size={30}
                    className="text-emerald-400"
                  />

                  <h2
                    id="savings-modal-title"
                    className="text-xl font-medium tracking-wide text-white/90 sm:text-3xl"
                  >
                    {positive
                      ? "Your estimated monthly savings"
                      : negative
                        ? "Estimated additional monthly fuel cost"
                        : "Estimated monthly fuel difference"}
                  </h2>
                </div>

                {/* HUGE DOLLAR AMOUNT */}
                <div
                  className="savings-number w-full break-words text-center font-black leading-none tracking-tighter"
                  style={{
                    fontSize: "clamp(4.5rem, 12vw, 13rem)",
                    color: positive
                      ? "#4ade80"
                      : negative
                        ? "#fbbf24"
                        : "#ffffff",
                    textShadow:
                      "0 12px 40px rgba(0,0,0,0.18)",
                    animation:
                      "savingsReveal 1s cubic-bezier(0.16,1,0.3,1) both",
                  }}
                >
                  {money(displayAmount)}
                </div>

                {/* SUBTLE SUBTITLE */}
                <p
                  className="mt-10 text-base font-normal tracking-wide text-blue-100 sm:text-xl"
                  style={{
                    animation:
                      "savingsFadeIn 1s ease-out 0.4s both",
                  }}
                >
                  {positive
                    ? "saved every month on gas"
                    : negative
                      ? "more per month on gas"
                      : "difference per month on gas"}
                </p>

                {/* VEHICLE COMPARISON */}
                <div
                  className="mt-16 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-blue-100 sm:text-lg"
                  style={{
                    animation:
                      "savingsFadeIn 1s ease-out 0.6s both",
                  }}
                >
                  <span>{vehicleName(data.currentVehicle)}</span>

                  <span className="text-emerald-400">
                    →
                  </span>

                  <span>{vehicleName(data.newVehicle)}</span>
                </div>
              </div>
            </div>

            {/* MORE DETAILS */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-8 py-5">
              <button
                type="button"
                aria-expanded={showDetails}
                onClick={() =>
                  setShowDetails((prev) => !prev)
                }
                className="w-full py-2 text-center text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                {showDetails
                  ? "Hide details ▲"
                  : "More details ▼"}
              </button>
            </div>

            {/* DETAILS TABLE */}
            {showDetails && (
              <div className="min-h-0 max-h-[45%] shrink-0 overflow-y-auto border-t border-slate-100 bg-white px-8 py-6">
                <div className="mx-auto max-w-4xl">
                  <DetailsTable data={data} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ANIMATIONS */}
      <style jsx global>{`
        /* Native progress bar */
        .savings-progress {
          appearance: none;
          -webkit-appearance: none;
          display: block;
          width: 100%;
          height: 20px;
          border: 0;
          overflow: hidden;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.2);
        }

        .savings-progress::-webkit-progress-bar {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
        }

        .savings-progress::-webkit-progress-value {
          background-color: #4ade80;
          border-radius: 9999px;
        }

        .savings-progress::-moz-progress-bar {
          background-color: #4ade80;
          border-radius: 9999px;
        }

        /* Savings amount entrance */
        @keyframes savingsReveal {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.7);
            filter: blur(8px);
          }

          65% {
            opacity: 1;
            transform: translateY(0) scale(1.06);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes savingsFadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Confetti falls once on reveal */
        @keyframes savingsConfettiFall {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(90vh) rotate(720deg);
          }
        }

        .savings-confetti {
          animation-name: savingsConfettiFall;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .savings-confetti {
            display: none;
          }

          .savings-number {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}






// =====================================================
// MAIN PAGE
// =====================================================

export default function FuelEconomyPage() {
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);

  const [newVehicle, setNewVehicle] = useState<Vehicle | null>(null);

  const [annualMiles, setAnnualMiles] = useState("15000");

  const [prices, setPrices] = useState<FuelPrices | null>(null);

  const [pricesLoading, setPricesLoading] = useState(true);

  const [pricesError, setPricesError] = useState("");

  const [reloadPrices, setReloadPrices] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const handleCurrentChange = useCallback((vehicle: Vehicle | null) => {
    setCurrentVehicle(vehicle);
    setShowModal(false);
  }, []);

  const handleNewChange = useCallback((vehicle: Vehicle | null) => {
    setNewVehicle(vehicle);
    setShowModal(false);
  }, []);

  // -------------------------------------------------
  // AUTOMATIC FUEL PRICES
  // -------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      setPricesLoading(true);
      setPricesError("");
      setPrices(null);

      try {
        const response = await fetch(`${API}/prices`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to retrieve fuel prices.");
        }

        const data = await response.json();

        if (!data.prices) {
          throw new Error("Fuel prices are missing.");
        }

        const raw = data.prices;

        const parsed: FuelPrices = {
          regular: parsePrice(raw.regular),
          midgrade: parsePrice(raw.midgrade),
          premium: parsePrice(raw.premium),
          diesel: parsePrice(raw.diesel),
          e85: parsePrice(raw.e85),
          electric: parsePrice(raw.electric),
          cng: parsePrice(raw.cng),
          lpg: parsePrice(raw.lpg),
        };

        if (!controller.signal.aborted) {
          setPrices(parsed);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPricesError(
            error instanceof Error
              ? error.message
              : "Failed to load fuel prices.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPricesLoading(false);
        }
      }
    }

    loadPrices();

    return () => controller.abort();
  }, [reloadPrices]);

  // -------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------

  const currentFuel = useMemo(
    () => getFuelInfo(currentVehicle, prices),
    [currentVehicle, prices],
  );

  const newFuel = useMemo(
    () => getFuelInfo(newVehicle, prices),
    [newVehicle, prices],
  );

  const validMiles =
    annualMiles.trim() !== "" &&
    Number.isFinite(Number(annualMiles)) &&
    Number(annualMiles) > 0;

  const calculation = useMemo(() => {
    if (
      !currentVehicle ||
      !newVehicle ||
      !currentFuel ||
      !newFuel ||
      !validMiles
    ) {
      return null;
    }

    return calculateSavings(
      currentVehicle,
      newVehicle,
      Number(annualMiles),
      currentFuel,
      newFuel,
    );
  }, [
    currentVehicle,
    newVehicle,
    currentFuel,
    newFuel,
    annualMiles,
    validMiles,
  ]);

  const blocker = useMemo(() => {
    if (!currentVehicle) return "Select current vehicle";
    if (!newVehicle) return "Select new vehicle";

    if (!getMpg(currentVehicle) || !getMpg(newVehicle)) {
      return "MPG data unavailable";
    }

    if (!getFuelCategory(currentVehicle) || !getFuelCategory(newVehicle)) {
      return "Unsupported fuel configuration";
    }

    if (!validMiles) return "Enter annual mileage";
    if (pricesLoading) return "Loading fuel prices";
    if (pricesError) return "Fuel prices unavailable";

    if (!currentFuel || !newFuel) {
      return "Required fuel price unavailable";
    }

    if (!calculation) return "Unable to calculate";

    return null;
  }, [
    currentVehicle,
    newVehicle,
    validMiles,
    pricesLoading,
    pricesError,
    currentFuel,
    newFuel,
    calculation,
  ]);

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fuel Economy Calculator
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Compare vehicles and calculate monthly fuel savings.
          </p>
        </div>

        {/* VEHICLES */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VehicleSelector
            title="Current Vehicle"
            subtitle="Customer's trade-in"
            vehicle={currentVehicle}
            onChange={handleCurrentChange}
            accent="blue"
          />

          <VehicleSelector
            title="New Vehicle"
            subtitle="Vehicle being considered"
            vehicle={newVehicle}
            onChange={handleNewChange}
            accent="green"
          />
        </div>

        {/* CONTROLS */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[1fr_auto]">
            <div>
              <label
                htmlFor="annualMiles"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Annual Mileage
              </label>

              <input
                id="annualMiles"
                type="number"
                min="1"
                step="1"
                value={annualMiles}
                onChange={(event) => {
                  setAnnualMiles(event.target.value);
                  setShowModal(false);
                }}
                className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {[10000, 12000, 15000, 20000].map((miles) => (
                  <button
                    key={miles}
                    type="button"
                    onClick={() => {
                      setAnnualMiles(String(miles));
                      setShowModal(false);
                    }}
                    className={
                      Number(annualMiles) === miles
                        ? "rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                        : "rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200"
                    }
                  >
                    {formatNumber(miles)}
                  </button>
                ))}
              </div>
            </div>

            {/* CALCULATE */}
            <div className="sm:min-w-[230px]">
              <button
                type="button"
                disabled={Boolean(blocker)}
                onClick={() => {
                  if (calculation) {
                    setShowModal(true);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Icon name="sparkles" size={17} />
                Calculate Savings
                <Icon name="arrow" size={17} />
              </button>

              <p
                role="status"
                className={
                  blocker
                    ? "mt-2 text-center text-xs text-slate-500"
                    : "mt-2 text-center text-xs text-emerald-600"
                }
              >
                {blocker ?? "Ready to calculate"}
              </p>
            </div>
          </div>

          {pricesError && (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-red-600">{pricesError}</span>

              <button
                type="button"
                onClick={() => setReloadPrices((value) => value + 1)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                <Icon name="refresh" size={14} />
                Retry
              </button>
            </div>
          )}
        </section>

        <p className="mt-4 text-center text-xs text-slate-400">
          Vehicle data and fuel prices provided by FuelEconomy.gov.
        </p>
      </div>

      {/* POPUP */}
      {showModal && calculation && (
        <SavingsModal data={calculation} onClose={() => setShowModal(false)} />
      )}

      {/* SIMPLE ANIMATIONS */}
      <style jsx global>{`
        @keyframes popupEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .popup-enter {
          animation: popupEnter 0.35s ease-out both;
        }

        @keyframes revealPop {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-8deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.1) rotate(3deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .reveal-pop {
          animation: revealPop 0.7s ease-out both;
        }

        @keyframes revealNumber {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          70% {
            opacity: 1;
            transform: scale(1.08);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .reveal-number {
          animation: revealNumber 0.8s ease-out both;
        }

        @keyframes confettiFall {
          0% {
            opacity: 0;
            transform: translateY(-15px) rotate(0deg);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(520px) rotate(720deg);
          }
        }

        .confetti-piece {
          animation-name: confettiFall;
          animation-timing-function: ease-in;
          animation-fill-mode: both;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
