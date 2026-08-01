import { NextResponse } from "next/server";
import { getPublishedActivities } from "@/lib/activities";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activities = await getPublishedActivities({ includeUpcoming: true, includeEnded: true });
    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: "無法讀取活動資料" }, { status: 500 });
  }
}
