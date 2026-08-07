import { NextResponse } from "next/server";
import { getPublishedActivities } from "@/lib/activities";

export const revalidate = 60;

export async function GET() {
  try {
    const activities = await getPublishedActivities({ includeUpcoming: true, includeEnded: true });
    return NextResponse.json(activities, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "無法讀取活動資料" }, { status: 500 });
  }
}
