import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!process.env.LISTING_PASSWORD) {
    return NextResponse.json(
      { error: "LISTING_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (password !== process.env.LISTING_PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("listing-auth", "authenticated", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/listing",
    maxAge: 60 * 60 * 12,
  });

  return response;
}