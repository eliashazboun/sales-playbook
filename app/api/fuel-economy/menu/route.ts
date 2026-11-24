
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://www.fueleconomy.gov/ws/rest";

type MenuType = "year" | "make" | "model" | "options";

interface MenuItem {
  text: string;
  value: string;
}

function normalizeMenuItems(data: unknown): MenuItem[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as {
    menuItem?: unknown;
    menuItems?: {
      menuItem?: unknown;
    };
  };

  const rawItems =
    response.menuItem ??
    response.menuItems?.menuItem ??
    [];

  const items = Array.isArray(rawItems)
    ? rawItems
    : [rawItems];

  return items
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null &&
        typeof item === "object" &&
        "text" in item &&
        "value" in item
    )
    .map((item) => ({
      text: String(item.text),
      value: String(item.value),
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const type = searchParams.get("type") as MenuType | null;
  const year = searchParams.get("year");
  const make = searchParams.get("make");
  const model = searchParams.get("model");

  const validTypes: MenuType[] = [
    "year",
    "make",
    "model",
    "options",
  ];

  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      {
        error:
          "Invalid menu type. Use year, make, model, or options.",
      },
      { status: 400 }
    );
  }

  if (type !== "year") {
    const currentYear = new Date().getFullYear();

    if (
      !year ||
      !/^\d{4}$/.test(year) ||
      Number(year) < 1984 ||
      Number(year) > currentYear + 2
    ) {
      return NextResponse.json(
        { error: "Invalid vehicle year." },
        { status: 400 }
      );
    }
  }

  if (
    (type === "model" || type === "options") &&
    !make?.trim()
  ) {
    return NextResponse.json(
      { error: "Vehicle make is required." },
      { status: 400 }
    );
  }

  if (type === "options" && !model?.trim()) {
    return NextResponse.json(
      { error: "Vehicle model is required." },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      `${BASE_URL}/vehicle/menu/${type}`
    );

    if (year) {
      url.searchParams.set("year", year);
    }

    if (make) {
      url.searchParams.set("make", make);
    }

    if (model) {
      url.searchParams.set("model", model);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 86400,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        "FuelEconomy menu API error:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error: "Unable to retrieve vehicle menu.",
        },
        { status: 502 }
      );
    }

    const data: unknown = await response.json();

    const items = normalizeMenuItems(data);

    return NextResponse.json({
      type,
      items,
    });
  } catch (error) {
    console.error("FuelEconomy menu error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch vehicle menu.",
      },
      { status: 500 }
    );
  }
}
