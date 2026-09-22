import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml. Static routes are listed explicitly; there are no
// per-item public URLs (jobs, testimonials render inside section pages), so
// nothing dynamic is needed. Regenerated on every build.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{
    path: string;
    changeFrequency: "daily" | "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.9 },
    { path: "/careers/open-roles", changeFrequency: "daily", priority: 0.9 },
    { path: "/team", changeFrequency: "monthly", priority: 0.8 },
    { path: "/gallery", changeFrequency: "weekly", priority: 0.7 },
    { path: "/lets-talk", changeFrequency: "monthly", priority: 0.8 },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
