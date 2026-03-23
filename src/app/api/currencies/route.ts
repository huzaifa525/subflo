import { NextResponse } from "next/server";
import { getCurrencyList, detectCurrencyFromIP } from "@/lib/country";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const detect = searchParams.get("detect");

  if (detect === "true") {
    const currency = await detectCurrencyFromIP();
    return NextResponse.json({ currency });
  }

  const currencies = await getCurrencyList();
  return NextResponse.json({ currencies });
}
