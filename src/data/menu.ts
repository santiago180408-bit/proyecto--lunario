export type Option = {
  id: string;
  label: string;
  priceMode: "absolute" | "delta" | "none";
  price: number;
  enabled: boolean;
};
export type OptionGroup = {
  id: string;
  label: string;
  required: boolean;
  onlyWhen?: { groupId: string; optionId: string };
  options: Option[];
};
export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: null;
  pricingType: "fixed" | "variant";
  basePrice: number | null;
  optionGroups: OptionGroup[];
  sourceStatus: "confirmed";
  enabledInDemo: boolean;
  menuSection?: string;
  notesInternal?: string;
};
export const categories = [
  { id: "cafe", slug: "bebidas-con-cafe", name: "Bebidas con café", order: 1 },
  {
    id: "bebidas",
    slug: "bebidas-sin-cafe",
    name: "Bebidas sin café y frías",
    order: 2,
  },
  { id: "desayunos", slug: "desayunos", name: "Desayunos", order: 3 },
  {
    id: "postres",
    slug: "crepas-waffles-postres",
    name: "Crepas, waffles y postres",
    order: 4,
  },
  {
    id: "emparedados",
    slug: "emparedados-ensaladas",
    name: "Emparedados y ensaladas",
    order: 5,
  },
  {
    id: "antojitos",
    slug: "hamburguesas-burritos-antojitos",
    name: "Hamburguesas, burritos y antojitos",
    order: 6,
  },
] as const;
const fixed = (
  id: string,
  categoryId: string,
  name: string,
  price: number,
  description = "",
): Product => ({
  id,
  categoryId,
  name,
  description,
  image: null,
  pricingType: "fixed",
  basePrice: price,
  optionGroups: [],
  sourceStatus: "confirmed",
  enabledInDemo: true,
});
const group = (
  id: string,
  label: string,
  values: [string, number][],
  priceMode: "absolute" | "delta" | "none" = "absolute",
): OptionGroup => ({
  id,
  label,
  required: true,
  options: values.map(([label, price], i) => ({
    id: `${id}-${i}`,
    label,
    priceMode,
    price,
    enabled: true,
  })),
});
const variant = (
  id: string,
  categoryId: string,
  name: string,
  description: string,
  ...groups: OptionGroup[]
): Product => ({
  id,
  categoryId,
  name,
  description,
  image: null,
  pricingType: "variant",
  basePrice: null,
  optionGroups: groups,
  sourceStatus: "confirmed",
  enabledInDemo: true,
});
const sizes = (
  id: string,
  prices: [number, number, number],
  small = "Mediano · 14 oz",
) =>
  group(id, "Presentación", [
    [small, prices[0]],
    ["Grande · 16 oz", prices[1]],
    ["Frío · 16 oz", prices[2]],
  ]);
const choice = (id: string, label: string, items: string[]) =>
  group(
    id,
    label,
    items.map((x) => [x, 0]),
    "none",
  );
const breakfast = (
  id: string,
  name: string,
  description: string,
  solo: number,
  pack: number,
): Product =>
  variant(
    id,
    "desayunos",
    name,
    description,
    group(`${id}-presentacion`, "Presentación", [
      ["Solo platillo", solo],
      ["En paquete", pack],
    ]),
  );
export const products: Product[] = [
  fixed("expresso", "cafe", "Expresso", 39, "Extracción de café"),
  fixed(
    "expresso-doble",
    "cafe",
    "Expresso doble",
    72,
    "Extracción doble de café",
  ),
  fixed(
    "expresso-cortado",
    "cafe",
    "Expresso cortado",
    52,
    "Expresso y espuma de leche",
  ),
  fixed("macciato", "cafe", "Macciato", 42, "Expresso y leche acremada"),
  fixed("affogato", "cafe", "Affogato", 52, "Expresso con helado de vainilla"),
  ...(
    [
      ["americano", "Café americano", "Expresso y agua", [47, 52, 52]],
      [
        "capuchino",
        "Café capuchino",
        "Expresso y leche espumada",
        [52, 59, 59],
      ],
      ["latte", "Café latte", "Expresso y leche acremada", [52, 59, 59]],
      [
        "caramel",
        "Café caramel",
        "Expresso, caramelo y leche acremada",
        [52, 63, 63],
      ],
      [
        "mocha",
        "Café mocha",
        "Expresso, chocolate y leche acremada",
        [52, 63, 63],
      ],
      [
        "nutella",
        "Café Nutella",
        "Expresso, Nutella y leche acremada",
        [52, 63, 63],
      ],
      [
        "cream-brulett",
        "Café cream bruletté",
        "Expresso, leche espumada y azúcar acaramelizada",
        [65, 70, 70],
      ],
      [
        "latte-bombon",
        "Café latte con bombón",
        "Expresso, leche acremada y bombones",
        [62, 69, 69],
      ],
    ] as [string, string, string, [number, number, number]][]
  ).map(([id, name, desc, price]) =>
    variant(id, "cafe", name, desc, sizes(`${id}-size`, price)),
  ),
  variant(
    "capuchino-saborizado",
    "cafe",
    "Capuchino saborizado",
    "Expresso, leche espumada y jarabe de sabor",
    sizes("caps-size", [71, 78, 78]),
    choice("caps-flavor", "Sabor", [
      "Menta",
      "Caramelo",
      "Amareto",
      "Vainilla",
      "Chocolate blanco",
      "Chocolate suizo",
      "Crema irlandesa",
      "Cajeta",
      "Baileys",
    ]),
  ),
  // Retain the original configuration for items already saved in the demo cart.
  { ...variant(
    "lattes-saborizados",
    "bebidas",
    "Lattes saborizados",
    "",
    group("ls-size", "Presentación", [
      ["Mediano · 14 oz", 55],
      ["Grande · 16 oz", 63],
      ["Frío · 16 oz", 63],
    ]),
    choice("ls-flavor", "Sabor", [
      "Taro",
      "Matcha",
      "Red velvet",
      "Golden milk",
      "Cajeta",
      "Chai",
      "Chai manzana canela",
      "Chocolate",
      "Chocolate blanco",
    ]),
  ), enabledInDemo: false },
  ...([
    ["matcha", "Matcha", "Matcha"],
    ["latte-taro", "Latte de taro", "Lattes saborizados"],
    ["latte-red-velvet", "Latte red velvet", "Lattes saborizados"],
    ["latte-golden-milk", "Golden milk", "Lattes saborizados"],
    ["latte-cajeta", "Latte de cajeta", "Lattes saborizados"],
    ["latte-chai", "Latte chai", "Lattes saborizados"],
    ["latte-chai-manzana", "Latte chai manzana canela", "Lattes saborizados"],
    ["latte-chocolate", "Latte de chocolate", "Lattes saborizados"],
    ["latte-chocolate-blanco", "Latte de chocolate blanco", "Lattes saborizados"],
  ] as const).map(([id, name, menuSection]) => ({
    ...variant(
      id, "bebidas", name, "Sin café.",
      group(`${id}-size`, "Presentación", [
        ["Mediano · 14 oz", 55],
        ["Grande · 16 oz", 63],
        ["Frío · 16 oz", 63],
      ]),
      group(`${id}-milk`, "Leche", [
        ["Entera", 0], ["Deslactosada", 10],
        ["Almendras", 15], ["Avena", 20],
      ], "delta"),
    ),
    menuSection,
  })),
  variant(
    "tisanas",
    "bebidas",
    "Tisanas",
    "",
    group("tis-size", "Presentación", [
      ["Mediano · 14 oz", 56],
      ["Grande · 16 oz", 63],
      ["Frío · 16 oz", 63],
    ]),
    choice("tis-flavor", "Sabor", [
      "Manzana arándano",
      "Moras del bosque",
      "Ponche de guayaba",
      "Frutas de la pasión",
      "Cerezas extremas",
      "Frutas caribeñas",
      "Fresa kiwi",
      "Frutos rojos",
    ]),
  ),
  variant(
    "infusiones",
    "bebidas",
    "Infusiones",
    "",
    sizes("inf-size", [42, 49, 49], "Mediano · 12 oz"),
    choice("inf-flavor", "Sabor", [
      "Jamaica con limón",
      "Jengibre con limón",
      "Manzana arándano",
      "Doble menta",
      "Relax",
      "Zarzamora",
    ]),
  ),
  ...(
    [
      [
        "malteadas",
        "Malteadas",
        62,
        "14 oz",
        ["Fresa", "Chocolate", "Oreo", "Vainilla", "Café"],
      ],
      [
        "frappes",
        "Frappés",
        65,
        "16 oz",
        [
          "Café",
          "Mocha",
          "Coffee toffee",
          "Oreo",
          "Cajeta",
          "Fresas con crema",
          "Chai manzana canela",
          "Caramelo",
          "Red velvet",
          "Chocomenta",
          "Taro",
          "Vainilla",
          "Matcha",
          "Coco",
          "Mazapán",
          "Chai",
          "Nutella",
          "Chocolate blanco",
          "Chocolate oscuro",
        ],
      ],
      [
        "eskimos",
        "Eskimos",
        65,
        "16 oz",
        ["Kiwi", "Fresa", "Moras mix", "Mango"],
      ],
      [
        "smoothies",
        "Smoothies",
        62,
        "16 oz",
        ["Mora azul", "Maracuyá", "Frutos rojos", "Piña colada"],
      ],
      [
        "sodas",
        "Sodas italianas",
        56,
        "16 oz · incluye perlas explosivas",
        [
          "Kiwi",
          "Fresa",
          "Lavanda",
          "Mojito",
          "Mango",
          "Mora azul",
          "Frutos rojos",
          "Dragon fruit",
          "Sandía",
          "Lichi",
          "Conga",
          "Manzana verde",
          "Maracuyá",
        ],
      ],
    ] as [string, string, number, string, string[]][]
  ).map(([id, name, price, desc, flavors]) => ({
    ...variant(
      id,
      "bebidas",
      name,
      desc,
      choice(`${id}-flavor`, "Sabor", flavors),
    ),
    pricingType: "fixed" as const,
    basePrice: price,
  })),
  fixed(
    "canasta-helado",
    "bebidas",
    "Canasta de helado",
    55,
    "2 bolas de helado, crema batida, galleta, cerezas y chispitas",
  ),
  breakfast(
    "chilaquiles",
    "Chilaquiles",
    "Queso, crema, aguacate y cebolla",
    85,
    158,
  ),
  breakfast(
    "enchiladas",
    "Enchiladas suizas",
    "Queso, crema, aguacate y cebolla",
    85,
    158,
  ),
  breakfast(
    "huevos",
    "Huevos al gusto",
    "Tocino, jamón, rancheros o divorciados",
    75,
    148,
  ),
  breakfast("molletes", "Molletes", "Frijoles, queso y pico de gallo", 75, 148),
  breakfast(
    "enfrijoladas",
    "Enfrijoladas",
    "Queso, crema, aguacate y cebolla",
    85,
    158,
  ),
  breakfast(
    "enmoladas",
    "Enmoladas",
    "Queso, crema, aguacate y cebolla",
    85,
    158,
  ),
  breakfast(
    "omelette",
    "Omelette",
    "3 huevos; espinaca o champiñones con queso manchego",
    85,
    158,
  ),
  breakfast("tacos-dorados", "Tacos dorados de pollo", "", 75, 148),
  {
    ...fixed(
      "menu-kids",
      "desayunos",
      "Menú kids",
      80,
      "Incluye jugo o té, fruta con yogur, miel y granola, y pan dulce",
    ),
    optionGroups: [
      choice("kids-dish", "Platillo", [
        "Mini hot cakes · 4 piezas",
        "Nuggets de pollo · 6 piezas",
        "Molletitos · 2 piezas",
        "Huevito · 2 piezas",
        "Sincronizaditas",
      ]),
    ],
  },
  fixed(
    "fruta",
    "desayunos",
    "Fruta",
    40,
    "Fruta de temporada con miel, yogur y granola",
  ),
  fixed("pan-dulce", "desayunos", "Pan dulce", 10, "Pieza"),
  fixed(
    "agua-sabor",
    "desayunos",
    "Agua de sabor",
    30,
    "480 ml; sabor sujeto a consulta",
  ),
  fixed(
    "jarra-agua",
    "desayunos",
    "Jarra de agua",
    150,
    "2 litros; sabor sujeto a consulta",
  ),
  ...(
    [
      ["crepa-clasica", "Crepa salada clásica", 65, "Queso manchego y jamón"],
      [
        "crepa-champinones",
        "Crepa de champiñones",
        65,
        "Queso manchego y champiñones",
      ],
      ["crepa-hawaiana", "Crepa hawaiana", 65, "Queso manchego, jamón y piña"],
      [
        "crepa-quesos",
        "Crepa 3 quesos",
        65,
        "Manchego, mozzarella y americano",
      ],
      ["crepa-italiana", "Crepa italiana", 69, "Queso manchego y peperoni"],
      ["crepa-atun", "Crepa de atún", 69, "Queso manchego y atún"],
      ["crepa-pollo", "Crepa de pollo", 79, "Queso manchego y pollo BBQ"],
      [
        "crepa-serrano",
        "Crepa de jamón serrano",
        99,
        "Queso manchego y jamón serrano",
      ],
    ] as [string, string, number, string][]
  ).map(([id, name, price, desc]) => fixed(id, "postres", name, price, desc)),
  ...(
    [
      ["Manzana", 65],
      ["Zarzamora", 65],
      ["Fresa", 69],
      ["Durazno", 69],
      ["Kiwi", 69],
      ["Plátano", 69],
      ["Nuez", 69],
      ["Mango", 72],
      ["Frutos rojos", 84],
      ["3 frutas", 99],
    ] as [string, number][]
  ).map(([name, price], i) =>
    fixed(
      `crepa-dulce-${i}`,
      "postres",
      `Crepa dulce de ${name.toLowerCase()}`,
      price,
    ),
  ),
  ...(
    [
      ["Mantequilla miel", 78],
      ["Zarzamora", 78],
      ["Fresa", 78],
      ["Frutos rojos", 80],
      ["Bicolor", 80],
      ["Durazno", 80],
      ["Plátano", 80],
      ["Manzana", 80],
      ["Cajeta nuez", 80],
      ["Mango nuez", 80],
      ["Fresa kiwi", 82],
      ["3 frutas", 96],
    ] as [string, number][]
  ).map(([name, price], i) =>
    fixed(`waffle-${i}`, "postres", `Waffle ${name.toLowerCase()}`, price),
  ),
  fixed("crepizza", "postres", "Crepizza", 105, "Puré de tomate, queso manchego, mozzarella, morrón, jalapeños, cebolla morada y finas hierbas; cobertura sujeta a consulta"),
  ...[
    "Trufa",
    "Limón",
    "Red velvet",
    "Tarta moka",
    "Tarta de frutas",
    "Tarta de guayaba",
  ].map((name, i) => fixed(`postre-${i}`, "postres", name, 65, "Porción")),
  ...(
    [
      ["Sándwich clásico", 45, "Queso manchego y jamón de pavo"],
      ["Sándwich 3 quesos", 52, "Manchego, mozzarella y americano"],
      ["Sándwich atún", 60, "Queso manchego y atún"],
      ["Croissant clásico", 49, "Queso manchego y jamón de pavo"],
      ["Croissant español", 62, "Queso manchego y jamón serrano"],
      [
        "Croissant dulce",
        42,
        "Queso Philadelphia o Nutella y una fruta; elección sujeta a consulta",
      ],
      ["Chapata clásica", 59, "Queso manchego y jamón de pavo"],
      ["Chapata 3 quesos", 69, "Manchego, mozzarella y americano"],
      ["Chapata pollo", 75, "Queso manchego y pollo BBQ"],
      ["Chapata italiana", 75, "Queso manchego, mozzarella y peperoni"],
      ["Chapata española", 85, "Queso manchego y jamón serrano"],
      ["Chapata gourmet", 92, "Queso manchego, peperoni y salami"],
      ["Baguette clásica", 75, "Queso manchego y jamón de pavo"],
      ["Baguette atún", 78, "Queso manchego y atún"],
      ["Baguette italiana", 85, "Queso manchego, mozzarella y peperoni"],
      ["Baguette española", 110, "Queso manchego y jamón serrano"],
      ["Baguette pollo", 95, "Queso manchego y pollo BBQ"],
      ["Baguette gourmet", 99, "Queso manchego, peperoni y salami"],
      [
        "Club sandwich",
        120,
        "Pan dorado con mantequilla, pollo a la plancha, queso fundido y papas crujientes",
      ],
      [
        "Ensalada frutal",
        75,
        "Lechuga, manzana, durazno, fresa, frutos rojos y ajonjolí garapiñado",
      ],
      [
        "Ensalada verde",
        75,
        "Lechuga, vegetales, elote, jamón de pavo, queso manchego, crutones y ajonjolí",
      ],
      [
        "Ensalada frutos rojos",
        75,
        "Lechuga, fresa, frutos rojos y ajonjolí garapiñado",
      ],
      [
        "Ensalada atún",
        82,
        "Lechuga, vegetales, queso manchego, crutones y ajonjolí",
      ],
      [
        "Ensalada pollo",
        95,
        "Lechuga, vegetales, queso manchego, crutones y ajonjolí",
      ],
      [
        "Ensalada arrachera",
        105,
        "Lechuga, vegetales, queso manchego, crutones y ajonjolí",
      ],
    ] as [string, number, string][]
  ).map(([name, price, desc], i) =>
    fixed(`emp-${i}`, "emparedados", name, price, desc),
  ),
  ...(
    [
      [
        "Hamburguesa clásica",
        110,
        "Carne de res al grill, queso manchego fundido y pan dorado",
      ],
      [
        "Hamburguesa hawaiana",
        139,
        "Res al grill, queso fundido, piña caramelizada y salsa de mango",
      ],
      [
        "Hamburguesa estelar",
        149,
        "Pollo a la plancha con BBQ y doble queso fundido",
      ],
      [
        "Hamburguesa premium arrachera",
        159,
        "Arrachera al grill, queso manchego y guacamole",
      ],
      [
        "Hamburguesa premium lunar",
        159,
        "Pechuga crujiente, aderezo chipotle y queso manchego",
      ],
      [
        "Hamburguesa premium Texas",
        169,
        "Res al grill, mix de quesos, cebolla crujiente y BBQ",
      ],
      [
        "Burrito de pollo",
        90,
        "Tortilla de harina, pollo, frijoles, queso manchego, pimiento y papas",
      ],
      [
        "Burrito de res",
        99,
        "Tortilla de harina, bisteck de res y tocino, frijoles, queso y papas",
      ],
      [
        "Burrito Lunario",
        100,
        "Tortilla de harina, arrachera, frijoles, queso y papas",
      ],
      [
        "Papas chicken · 400 g",
        120,
        "Papas doradas con boneless y aderezo ranch",
      ],
      ["Papas cheese · 250 g", 89, "Papas con queso fundido y tocino"],
      ["Papas gajo · 250 g", 89, "Con aderezo ranch"],
      ["Papas a la francesa · 250 g", 85, "Papas crujientes sazonadas"],
      ["Nachos Lunario", 140, "Totopos con queso fundido y carne preparada"],
      ["Nachos clásicos", 80, "Totopos con queso gratinado y chiles"],
    ] as [string, number, string][]
  ).map(([name, price, desc], i) =>
    fixed(`antojito-${i}`, "antojitos", name, price, desc),
  ),
  variant(
    "alitas",
    "antojitos",
    "Alitas",
    "Acompañadas de vegetales",
    group("alitas-piezas", "Piezas", [
      ["6 piezas", 85],
      ["12 piezas", 155],
      ["24 piezas", 295],
    ]),
  ),
  variant(
    "boneless",
    "antojitos",
    "Boneless",
    "Pollo crujiente",
    group("boneless-piezas", "Piezas", [
      ["6 piezas", 85],
      ["12 piezas", 150],
      ["24 piezas", 290],
    ]),
  ),
  variant(
    "aros",
    "antojitos",
    "Aros de cebolla",
    "",
    group("aros-piezas", "Piezas", [
      ["6 piezas", 45],
      ["12 piezas", 85],
    ]),
  ),
];
// Only associations confirmed by Menu_Lunario_organizado.docx are selectable.
// Proteins/sauces, crepe bases and waffle batter marked for confirmation stay hidden.
for (const product of products) {
  const add = (...groups: OptionGroup[]) =>
    product.optionGroups.push(...groups);
  if (
    [
      "capuchino",
      "latte",
      "caramel",
      "mocha",
      "nutella",
      "cream-brulett",
      "latte-bombon",
      "capuchino-saborizado",
    ].includes(product.id)
  ) {
    add(
      group(
        `${product.id}-milk`,
        "Leche",
        [
          ["Entera", 0],
          ["Deslactosada", 10],
          ["Almendras", 15],
          ["Avena", 20],
        ],
        "delta",
      ),
    );
  }
  if (product.optionGroups.some((g) => g.id === `${product.id}-presentacion`))
    add({
      ...choice(`${product.id}-drink`, "Bebida del paquete", ["Café", "Té"]),
      onlyWhen: {
        groupId: `${product.id}-presentacion`,
        optionId: `${product.id}-presentacion-1`,
      },
    });
  if (product.id === "menu-kids")
    add(choice("kids-drink", "Bebida", ["Jugo", "Té"]));
  if (product.id === "huevos")
    add(
      choice("huevos-style", "Preparación", [
        "Tocino",
        "Jamón",
        "Rancheros",
        "Divorciados",
      ]),
    );
  if (product.id === "omelette")
    add(
      choice("omelette-filling", "Relleno", [
        "Espinaca con queso manchego",
        "Champiñones con queso manchego",
      ]),
    );
  if (product.categoryId === "emparedados")
    add({
      ...group(
        `${product.id}-extra`,
        "Extras",
        [
          ["Sin extra", 0],
          ["Papas fritas", 45],
        ],
        "delta",
      ),
      required: false,
    });

}
export const visibleGroups = (
  product: Product,
  selections: Record<string, string>,
) =>
  product.optionGroups.filter(
    (g) =>
      !g.onlyWhen || selections[g.onlyWhen.groupId] === g.onlyWhen.optionId,
  );
export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
export function unitPrice(
  product: Product,
  selections: Record<string, string>,
) {
  let price = product.basePrice ?? startingPrice(product);
  let extras = 0;
  for (const g of visibleGroups(product, selections)) {
    const o = g.options.find((o) => o.id === selections[g.id]);
    if (o?.priceMode === "absolute") price = o.price;
    if (o?.priceMode === "delta") extras += o.price;
  }
  return price + extras;
}
export function startingPrice(product: Product) {
  const p = product.optionGroups.flatMap((g) =>
    g.options.filter((o) => o.priceMode === "absolute").map((o) => o.price),
  );
  return p.length ? Math.min(...p) : (product.basePrice ?? 0);
}
