import { getCaseStudies } from "@/lib/content";

export async function GET() {
  return Response.json(await getCaseStudies(), {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" },
  });
}
