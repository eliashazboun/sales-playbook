import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid inventory ID" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graphql-proxy.gateway.acvauctions.com/v1/inventory/${id}`,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Referer:
            "https://barbourhendrickhonda.max.auto/",
        },

        // Don't cache inventory data.
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `MAX returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const json = await response.json();
    const inventory = json.inventory;

    if (!inventory) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const vehicle = inventory.vehicle;

    const carfax =
      inventory.history?.find(
        (item: any) => item.type === "CARFAX"
      ) ?? null;

    const photos =
      inventory.photos?.edges
        ?.map((edge: any) => edge?.node?.url)
        .filter(Boolean) ?? [];

    const equipment =
      vehicle?.equipment
        ?.map((item: any) => item?.name)
        .filter(Boolean) ?? [];

    const options =
      vehicle?.options?.all
        ?.filter((option: any) => option?.name)
        .map((option: any) => ({
          name: option.name,
          msrp: option.msrp?.amount ?? null,
          features:
            option.features?.filter(Boolean) ?? [],
        })) ?? [];

    const benefits =
      inventory.certified?.benefits?.map(
        (benefit: any) => ({
          name: benefit.name ?? "",
          description: benefit.description ?? "",
        })
      ) ?? [];

    // Strip HTML from dealer description.
    const description = (inventory.description ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({
      inventoryId: inventory.id,

      year: vehicle?.ymmt?.year ?? null,
      make: vehicle?.ymmt?.make ?? "",
      model: vehicle?.ymmt?.model ?? "",
      trim: vehicle?.ymmt?.trim ?? "",

      mileage: vehicle?.odometer?.value ?? 0,

      vin: vehicle?.vin ?? "",
      stockNumber: inventory.stockNumber ?? "",

      exteriorColor:
        vehicle?.color?.name ||
        vehicle?.color?.generic ||
        "",

      interiorColor:
        vehicle?.interior?.color?.name ||
        vehicle?.interior?.color?.generic ||
        "",

      drivetrain:
        vehicle?.ymmt?.drivetrain ?? "",

      transmission:
        vehicle?.ymmt?.transmission ?? "",

      engine:
        vehicle?.ymmt?.engine?.type ?? "",

      price:
        inventory.price?.listPrice?.amount ?? null,

      allInPrice:
        inventory.price?.ftcPricing?.allInPrice
          ?.amount ?? null,

      carfaxUrl: carfax?.url ?? null,

      description,

      certification: {
        name: inventory.certified?.name ?? null,
        benefits,
      },

      equipment,
      options,
      photos,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to retrieve vehicle." },
      { status: 500 }
    );
  }
}