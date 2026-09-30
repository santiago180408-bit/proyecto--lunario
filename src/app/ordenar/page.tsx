import type { Metadata } from "next";
import OrderEntry from "@/features/public/OrderEntry";
export const metadata: Metadata = {
  title: "Elige tu experiencia | Lunario Café",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <OrderEntry />;
}
