import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchServices as searchLocal, getAllCategories, getAllServices } from "@/lib/pricing/database";
import { searchServices as searchAristocles } from "@/lib/pricing/aristocles";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({
      services: getAllServices(),
      categories: getAllCategories(),
    });
  }

  // Local DB results (instant)
  const localResults = searchLocal(query);

  // Aristocles results (if authenticated)
  let aristoclesResults: { slug: string; name: string; category: string }[] = [];
  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    aristoclesResults = await searchAristocles(userId, query);
  }

  // Merge: local first, then Aristocles results not in local
  const localNames = new Set(localResults.map((s) => s.name.toLowerCase()));
  const extraFromAristocles = aristoclesResults
    .filter((s) => !localNames.has(s.name.toLowerCase()))
    .map((s) => ({
      id: s.slug,
      name: s.name,
      website: "",
      category: s.category,
      plans: [],
      fromAristocles: true,
    }));

  return NextResponse.json({
    services: [...localResults, ...extraFromAristocles],
  });
}
