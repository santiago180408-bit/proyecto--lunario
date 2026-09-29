import DemoApp from "@/components/DemoApp";

export function generateStaticParams() {
  return [
    { slug: ["menu"] },
    { slug: ["pedido"] },
    { slug: ["pedido", "recoger-hora"] },
    { slug: ["pedido", "mesa"] },
    { slug: ["pedido", "revision"] },
    { slug: ["reservar"] },
    { slug: ["reservar", "mesa"] },
    { slug: ["reservar", "revision"] },
    { slug: ["coworking"] },
    { slug: ["coworking", "configurar"] },
    { slug: ["coworking", "revision"] },
    { slug: ["solicitud"] },
  ];
}

export default function Page() {
  return <DemoApp />;
}
