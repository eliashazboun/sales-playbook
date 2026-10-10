import OpenAI from "openai";
import { MARKETPLACE_PROMPT } from "../marketplace-prompt";

export const runtime = "nodejs";

type VehicleInput = {
  inventoryId?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  exteriorColor?: string;
  interiorColor?: string;
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  description?: string;
  highlights?: string[];
  equipment?: string[];
  options?: { name: string; features: string[] }[];
  certification?: {
    name?: string | null;
    isCertified?: boolean;
    isDealerCertified?: boolean;
    isManufacturerCertified?: boolean;
    benefits?: { name: string; description: string }[];
  };
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const vehicle = body?.vehicle as VehicleInput | undefined;
    if (!vehicle || !vehicle.inventoryId || !vehicle.year || !vehicle.make || !vehicle.model) {
      return Response.json({ error: "Missing vehicle details." }, { status: 400 });
    }

    // Send only listing-relevant fields. Do not transmit internal prices, VIN, or stock data.
    const listingFacts = {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      mileage: vehicle.mileage,
      exteriorColor: vehicle.exteriorColor,
      interiorColor: vehicle.interiorColor,
      drivetrain: vehicle.drivetrain,
      transmission: vehicle.transmission,
      engine: vehicle.engine,
      highlights: vehicle.highlights ?? [],
      equipment: (vehicle.equipment ?? []).slice(0, 120),
      options: (vehicle.options ?? []).slice(0, 40),
      certification: vehicle.certification ?? null,
      description: (vehicle.description ?? "").slice(0, 5000),
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_LISTING_MODEL || "gpt-6-luna",
      instructions: MARKETPLACE_PROMPT,
      input: `Create a Facebook Marketplace listing using ONLY these vehicle facts:\n${JSON.stringify(listingFacts)}`,
      max_output_tokens: 1200,
      store: false,
    });

    const listing = response.output_text?.trim();
    if (!listing) {
      return Response.json({ error: "OpenAI returned an empty listing." }, { status: 502 });
    }
    return Response.json({ listing });
  } catch (error) {
    console.error("Marketplace listing generation failed:", error);
    return Response.json({ error: "Unable to generate Marketplace listing." }, { status: 500 });
  }
}
