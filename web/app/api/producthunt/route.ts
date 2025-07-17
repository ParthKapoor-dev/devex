import { NextRequest, NextResponse } from "next/server";
import { getProductHuntUpvotes } from "@/lib/product-hunt-upvotes";

export async function GET(_req: NextRequest) {
  const id = "devex";
  const votes = await getProductHuntUpvotes(id);

  // You can include a timestamp to help clients know when data was last refreshed.
  return NextResponse.json({
    productId: id,
    votes,
    cachedAt: new Date().toISOString(),
    ttlSeconds: 3600,
  });
}
