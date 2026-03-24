import { NextResponse } from "next/server";
import { queryStats, queryClusters, querySentimentTrend } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  
  try {
    const [stats, clusters, trend] = await Promise.all([
      queryStats(),
      queryClusters(),
      querySentimentTrend(days),
    ]);
    
    return NextResponse.json({ stats, clusters, trend });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
