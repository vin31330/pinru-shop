import ActivityDetailPage, { generateMetadata as generateActivityMetadata } from "@/app/activities/[id]/page";

export const revalidate = 60;

export const generateMetadata = generateActivityMetadata;

export default ActivityDetailPage;
