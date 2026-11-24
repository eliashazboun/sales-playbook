
import { NextResponse } from "next/server";

const BASE_URL = "https://www.fueleconomy.gov/ws/rest";

interface FuelPricesResponse {
  regular: number | null;
  midgrade: number | null;
  premium: number | null;
  diesel: number | null;
  e85: number | null;
  electric: number | null;
  cng: number | null;
  lpg: number | null;
}

function parsePrice(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const price = Number(value);

  return Number.isFinite(price) && price >= 0
    ? price
    : null;
}

export async function GET() {
  try {
    const response = await fetch(
      `${BASE_URL}/fuelprices`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(
        "FuelEconomy prices API error:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error: "Unable to retrieve fuel prices.",
        },
        { status: 502 }
      );
    }

    const raw = await response.json();

    const data = (
      raw?.fuelPrices ?? raw
    ) as Record<string, unknown>;

    const prices: FuelPricesResponse = {
      regular: parsePrice(data.regular),
      midgrade: parsePrice(data.midgrade),
      premium: parsePrice(data.premium),
      diesel: parsePrice(data.diesel),
      e85: parsePrice(data.e85),
      electric: parsePrice(data.electric),
      cng: parsePrice(data.cng),
      lpg: parsePrice(data.lpg),
    };

    if (
      prices.regular === null &&
      prices.premium === null &&
      prices.diesel === null
    ) {
      return NextResponse.json(
        {
          error: "Fuel price data is unavailable.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      prices,
      source: "FuelEconomy.gov",
      unit: {
        gasoline: "USD/gallon",
        diesel: "USD/gallon",
        electricity: "USD/kWh",
        cng: "USD/GGE",
      },
    });
  } catch (error) {
    console.error("FuelEconomy prices error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve fuel prices.",
      },
      { status: 500 }
    );
  }
}
