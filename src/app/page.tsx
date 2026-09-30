import Landing from "@/features/public/Landing";
import { landingMetadata, structuredData } from "@/features/public/seo";
export const metadata = landingMetadata;
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <Landing />
    </>
  );
}
