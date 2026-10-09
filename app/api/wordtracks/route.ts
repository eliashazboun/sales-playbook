import { NextResponse } from "next/server";
import { listSectionsWithScripts } from "@/app/lib/wordtracks.repo";

export async function GET() {
  return NextResponse.json({ sections: listSectionsWithScripts() });
}