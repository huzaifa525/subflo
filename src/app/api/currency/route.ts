import { NextResponse } from "next/server";
import { convert, getAllCurrencies } from "@/lib/currency";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amount = parseFloat(searchParams.get("amount") || "0");
  const from = searchParams.get("from") || "usd";
  const to = searchParams.get("to") || "inr";
  const listAll = searchParams.get("list");

  if (listAll === "true") {
    const currencies = await getAllCurrencies();
    return NextResponse.json({ currencies });
  }

  if (!amount) {
    return NextResponse.json({ error: "Provide amount, from, to" }, { status: 400 });
  }

  try {
    const converted = await convert(amount, from, to);
    return NextResponse.json({ amount, from, to, converted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion failed" },
      { status: 500 }
    );
  }
}
