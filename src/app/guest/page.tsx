import GuestPosts from "@/app/components/GuestPosts";
import LocalizedText from "@/app/components/LocalizedText";
export default async function GuestHome({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(query.page) || 1)));
  return <><h1 className="mb-5 text-2xl font-bold"><LocalizedText en="Public posts" de="Öffentliche Beiträge"/></h1><GuestPosts page={page}/></>;
}
