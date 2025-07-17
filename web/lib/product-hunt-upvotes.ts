import { unstable_cache } from "next/cache";
import "server-only";

interface PHPost {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
}

export function getProductHuntUpvotes(productId: string) {
  // `unstable_cache` memoizes by the key array; include the productId.
  const cachedFn = unstable_cache(
    () => fetchProductHuntUpvotesRaw(productId),
    ["ph-upvotes", String(productId)],
    {
      revalidate: 3600, // seconds (1 hour)
      tags: [`ph-upvotes-${productId}`], // optional: enables revalidateTag
    },
  );

  return cachedFn();
}

async function fetchProductHuntUpvotesRaw(
  productId: string,
): Promise<number | null> {
  const accessToken = process.env.PRODUCTHUNT_TOKEN;
  if (!accessToken) {
    console.error("Missing PRODUCTHUNT_TOKEN env var.");
    return null;
  }

  // Use GraphQL variables instead of interpolating to avoid injection risks.
  const query = `
    query GetPost($id: ID!) {
      post(id: $id) {
        id
        name
        tagline
        votesCount
      }
    }
  `;

  try {
    const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      // Product Hunt GraphQL expects string ID; convert to string
      body: JSON.stringify({
        query,
        variables: { id: productId.toString() },
      }),
      // Disable Next's built-in caching for this network call; we control caching separately.
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Product Hunt API HTTP error:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = (await response.json()) as {
      data?: { post?: PHPost };
      errors?: any;
    };

    if (data?.data?.post?.votesCount != null) {
      return data.data.post.votesCount;
    } else {
      console.error("Error fetching upvotes:", data.errors);
      return null;
    }
  } catch (err) {
    console.error("Network or API error:", err);
    return null;
  }
}

export { fetchProductHuntUpvotesRaw };
