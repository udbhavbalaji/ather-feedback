import { NextResponse } from "next/server";
import { queryPosts } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const limit = parseInt(searchParams.get("limit") || "50");
  const sentiment = searchParams.get("sentiment") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const verifiedOnly = searchParams.get("verified") === "true";
  
  try {
    const posts = await queryPosts({
      limit,
      sentiment,
      tag,
      verifiedOnly,
    });
    
    return NextResponse.json({ posts, count: posts.length });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
