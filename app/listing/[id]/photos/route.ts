import JSZip from "jszip";
import sharp from "sharp";
import path from "path";

type BinkPlacement = {
  photoPosition: number;
  binkId: string;
  file: string;
  label: string;
  type: "transition" | "info";
};

type BinkLayout = {
  widthRatio: number;
};

function getBinkPath(file: string) {
  const normalized = file.replace(/\\/g, "/");

  if (!normalized.startsWith("/bink/")) {
    throw new Error("Invalid Bink path.");
  }

  if (normalized.includes("..")) {
    throw new Error("Invalid Bink path.");
  }

  return path.join(
    process.cwd(),
    "public",
    ...normalized.split("/").filter(Boolean),
  );
}

/*
 * Controls only Bink's size.
 *
 * Horizontal position is calculated automatically
 * based on where the photo appears in the listing.
 */
function getBinkLayout(binkId: string): BinkLayout {
  switch (binkId) {
    case "peek":
      return {
        widthRatio: 0.3,
      };

    case "walking":
      return {
        widthRatio: 0.25,
      };

    case "sneak":
      return {
        widthRatio: 0.25,
      };

    case "roll":
      return {
        widthRatio: 0.25,
      };

    case "wave":
      return {
        widthRatio: 0.3,
      };

    default:
      return {
        widthRatio: 0.28,
      };
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return new Response("Invalid inventory ID", {
        status: 400,
      });
    }

    const body = await request.json();

    const selectedIndexes: number[] = Array.isArray(body.selectedIndexes)
      ? body.selectedIndexes
      : [];

    const binkSequence: BinkPlacement[] = Array.isArray(body.binkSequence)
      ? body.binkSequence
      : [];

    if (!selectedIndexes.length) {
      return new Response("No photos selected.", {
        status: 400,
      });
    }

    /*
     * Pull the vehicle directly from MAX.
     */
    const inventoryResponse = await fetch(
      `https://graphql-proxy.gateway.acvauctions.com/v1/inventory/${id}`,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Referer: "https://barbourhendrickhonda.max.auto/",
        },
        cache: "no-store",
      },
    );

    if (!inventoryResponse.ok) {
      return new Response("Unable to retrieve vehicle.", {
        status: inventoryResponse.status,
      });
    }

    const json = await inventoryResponse.json();
    const inventory = json.inventory;

    if (!inventory) {
      return new Response("Vehicle not found.", {
        status: 404,
      });
    }

    /*
     * Pull all MAX photo URLs.
     */
    const photoUrls: string[] =
      inventory.photos?.edges
        ?.map((edge: any) => edge?.node?.url)
        .filter(Boolean) ?? [];

    if (!photoUrls.length) {
      return new Response("No photos found.", {
        status: 404,
      });
    }

    /*
     * Don't trust indexes coming from the browser.
     *
     * Validate them, remove duplicates, and sort them
     * so the final ZIP follows MAX Digital's photo order.
     */
    const validIndexes = [
      ...new Set(
        selectedIndexes.filter(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < photoUrls.length,
        ),
      ),
    ].sort((a, b) => a - b);

    if (!validIndexes.length) {
      return new Response("No valid photos selected.", {
        status: 400,
      });
    }

    const zip = new JSZip();

    /*
     * Example:
     *
     * 2025-Chevrolet-Tahoe-ABC123
     */
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

    /*
     * This is the number of photos that will actually
     * appear in the Marketplace listing.
     *
     * We use this to determine how far Bink should move
     * horizontally between each photo.
     */
    const photoCount = validIndexes.length;

    /*
     * Download and process only the selected photos.
     *
     * downloadIndex represents the position of the image
     * in the final Marketplace listing:
     *
     * 0 = first photo
     * 1 = second photo
     * 2 = third photo
     * etc.
     */
    await Promise.all(
      validIndexes.map(async (photoIndex, downloadIndex) => {
        const photoUrl = photoUrls[photoIndex];

        try {
          /*
           * Download original MAX photo.
           */
          const photoResponse = await fetch(photoUrl);

          if (!photoResponse.ok) {
            console.error(`Failed photo ${photoIndex + 1}`);
            return;
          }

          const arrayBuffer = await photoResponse.arrayBuffer();
          const originalBuffer = Buffer.from(arrayBuffer);

          /*
           * Find the Bink assigned to this position.
           */
          const placement = binkSequence.find(
            (item) => item.photoPosition === downloadIndex,
          );

          /*
           * If no Bink exists for this position,
           * the original image will simply be used.
           */
          let finalBuffer = originalBuffer;

          if (placement) {
            const binkPath = getBinkPath(placement.file);

            /*
             * Read the vehicle photo dimensions.
             */
            const metadata = await sharp(
              originalBuffer,
            ).metadata();

            const photoWidth = metadata.width ?? 1600;
            const photoHeight = metadata.height ?? 1200;

            /*
             * Determine how large this particular
             * Bink should be.
             */
            const layout = getBinkLayout(
              placement.binkId,
            );

            const binkWidth = Math.round(
              photoWidth * layout.widthRatio,
            );

            /*
             * Resize the transparent Bink PNG.
             */
            const resizedBink = await sharp(binkPath)
              .resize({
                width: binkWidth,
                withoutEnlargement: true,
              })
              .png()
              .toBuffer();

            /*
             * Get Bink's dimensions after resizing.
             */
            const binkMetadata = await sharp(
              resizedBink,
            ).metadata();

            const actualBinkWidth =
              binkMetadata.width ?? binkWidth;

            const actualBinkHeight =
              binkMetadata.height ?? binkWidth;

            /*
             * VERTICAL POSITION
             *
             * Bink always stays planted directly against
             * the bottom of the vehicle photo.
             *
             * We are NOT moving him vertically.
             */
            const top = Math.max(
              0,
              photoHeight - actualBinkHeight,
            );

            /*
             * HORIZONTAL POSITION
             *
             * Figure out how much usable horizontal space
             * Bink has.
             *
             * We subtract Bink's own width so that the final
             * Bink remains completely inside the image.
             */
            const availableTravel = Math.max(
              0,
              photoWidth - actualBinkWidth,
            );

            /*
             * Divide that available space evenly across the
             * number of selected photos.
             *
             * Example with 10 photos:
             *
             * Photo 1  -> far left
             * Photo 2  -> moves right
             * Photo 3  -> moves right
             * ...
             * Photo 10 -> far right
             */
            const horizontalStep =
              photoCount > 1
                ? availableTravel / (photoCount - 1)
                : 0;

            /*
             * Move Bink one horizontal step for every
             * Marketplace photo.
             */
            const left = Math.round(
              horizontalStep * downloadIndex,
            );

            /*
             * Composite Bink onto the original vehicle photo.
             */
            finalBuffer = await sharp(originalBuffer)
              .composite([
                {
                  input: resizedBink,
                  left,
                  top,
                },
              ])
              .jpeg({
                quality: 92,
              })
              .toBuffer();
          }

          /*
           * Renumber selected photos:
           *
           * 01.jpg
           * 02.jpg
           * 03.jpg
           * etc.
           */
          folder.file(
            `${String(downloadIndex + 1).padStart(
              2,
              "0",
            )}.jpg`,
            finalBuffer,
          );
        } catch (error) {
          console.error(
            `Photo ${photoIndex + 1} failed`,
            error,
          );
        }
      }),
    );

    /*
     * Generate final ZIP.
     */
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

        "Content-Disposition":
          `attachment; filename="${folderName}-selected-photos.zip"`,

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      "Unable to create photo ZIP.",
      {
        status: 500,
      },
    );
  }
}