
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://www.fueleconomy.gov/ws/rest";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function parseNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseString(value: unknown): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return NextResponse.json(
      { error: "Invalid vehicle ID." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${BASE_URL}/vehicle/${id}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 86400,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Vehicle not found." },
        { status: 404 }
      );
    }

    if (!response.ok) {
      console.error(
        "FuelEconomy vehicle API error:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error: "Unable to retrieve vehicle details.",
        },
        { status: 502 }
      );
    }

    const raw = await response.json();

    const data = (
      raw?.vehicle ?? raw
    ) as Record<string, unknown>;

    if (
      !data ||
      typeof data !== "object" ||
      String(data.id) !== id
    ) {
      return NextResponse.json(
        {
          error: "Invalid vehicle data received.",
        },
        { status: 502 }
      );
    }

    const vehicle = {
      // Identification
      id: Number(id),
      year: parseNumber(data.year),
      make: parseString(data.make),
      model: parseString(data.model),
      baseModel: parseString(data.basemodel),

      // Engine
      cylinders: parseNumber(data.cylinders),
      displacement: parseNumber(data.displ),
      engineDescription: parseString(data.eng_dscr),
      transmission: parseString(data.trany),
      transmissionDescription: parseString(
        data.trans_dscr
      ),
      drive: parseString(data.drive),
      vehicleClass: parseString(data.VClass),

      // Fuel
      fuelType: parseString(data.fuelType),
      fuelType1: parseString(data.fuelType1),
      fuelType2: parseString(data.fuelType2),
      alternativeVehicleType: parseString(
        data.atvtype
      ),

      // Primary fuel economy
      mpg: {
        city: parseNumber(data.city08),
        highway: parseNumber(data.highway08),
        combined: parseNumber(data.comb08),
        combinedUnrounded: parseNumber(
          data.comb08U
        ),
      },

      // Alternative fuel economy
      alternativeMpg: {
        city: parseNumber(data.cityA08),
        highway: parseNumber(data.highwayA08),
        combined: parseNumber(data.combA08),
      },

      // Fuel costs
      fuelCosts: {
        annual: parseNumber(data.fuelCost08),
        annualAlternative: parseNumber(
          data.fuelCostA08
        ),
        fiveYearSavings: parseNumber(
          data.youSaveSpend
        ),
      },

      // Electric vehicle data
      electric: {
        cityKwhPer100Miles: parseNumber(
          data.cityE
        ),
        highwayKwhPer100Miles: parseNumber(
          data.highwayE
        ),
        combinedKwhPer100Miles: parseNumber(
          data.combE
        ),
        range: parseNumber(data.rangeA),
        chargeTime240V: parseNumber(
          data.charge240
        ),
      },

      // Environmental data
      emissions: {
        co2GramsPerMile: parseNumber(
          data.co2TailpipeGpm
        ),
        fuelEconomyScore: parseNumber(
          data.feScore
        ),
        greenhouseGasScore: parseNumber(
          data.ghgScore
        ),
      },

      // Original data timestamps
      createdOn: parseString(data.createdOn),
      modifiedOn: parseString(data.modifiedOn),
    };

    return NextResponse.json({
      vehicle,
    });
  } catch (error) {
    console.error(
      "FuelEconomy vehicle details error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to retrieve vehicle details.",
      },
      { status: 500 }
    );
  }
}
