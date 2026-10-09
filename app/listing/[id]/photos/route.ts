import JSZip from "jszip";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return new Response("Invalid inventory ID", {
        status: 400,
      });
    }

    const inventoryResponse = await fetch(
      `https://graphql-proxy.gateway.acvauctions.com/v1/inventory/${id}`,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Referer:
            "https://barbourhendrickhonda.max.auto/",
        },
        cache: "no-store",
      }
    );

    if (!inventoryResponse.ok) {
      return new Response(
        "Unable to retrieve vehicle.",
        { status: inventoryResponse.status }
      );
    }

    const json = await inventoryResponse.json();
    const inventory = json.inventory;

    const photoUrls: string[] =
      inventory.photos?.edges
        ?.map((edge: any) => edge?.node?.url)
        .filter(Boolean) ?? [];

    if (!photoUrls.length) {
      return new Response("No photos found.", {
        status: 404,
      });
    }

    const zip = new JSZip();

    const folderName = [
      inventory.vehicle?.ymmt?.year,
      inventory.vehicle?.ymmt?.make,
      inventory.vehicle?.ymmt?.model,
      inventory.stockNumber,
    ]
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    const folder = zip.folder(folderName);

    if (!folder) {
      throw new Error("Could not create ZIP folder.");
    }

    await Promise.all(
      photoUrls.map(async (photoUrl, index) => {
        try {
          const photoResponse = await fetch(photoUrl);

          if (!photoResponse.ok) {
            console.error(
              `Failed photo ${index + 1}`
            );
            return;
          }

          const arrayBuffer =
            await photoResponse.arrayBuffer();

          folder.file(
            `${String(index + 1).padStart(
              2,
              "0"
            )}.jpg`,
            arrayBuffer
          );
        } catch (error) {
          console.error(
            `Photo ${index + 1} failed`,
            error
          );
        }
      })
    );

    const zipBuffer = await zip.generateAsync({
  type: "arraybuffer",
  compression: "DEFLATE",
  compressionOptions: {
    level: 6,
  },
});

return new Response(zipBuffer, {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${folderName}-photos.zip"`,
    "Cache-Control": "no-store",
  },
});
  } catch (error) {
    console.error(error);

    return new Response(
      "Unable to create photo ZIP.",
      { status: 500 }
    );
  }
}