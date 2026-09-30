import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/data/menu.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(js, context);
const { products, categories, unitPrice, startingPrice } = context.exports;
assert.equal(new Set(products.map((p) => p.id)).size, products.length);
let configurations = 0;
for (const p of products) {
  assert(
    categories.some((c) => c.id === p.categoryId),
    p.id,
  );
  assert(startingPrice(p) > 0, p.id);
  assert.equal(
    new Set(p.optionGroups.map((g) => g.id)).size,
    p.optionGroups.length,
  );
  let combinations = [{}];
  for (const g of p.optionGroups) {
    assert(
      g.options.some((o) => o.enabled),
      `${p.id}/${g.id}`,
    );
    assert.equal(new Set(g.options.map((o) => o.id)).size, g.options.length);
    combinations = combinations.flatMap((s) =>
      g.options.filter((o) => o.enabled).map((o) => ({ ...s, [g.id]: o.id })),
    );
  }
  for (const selections of combinations) {
    const chosen = p.optionGroups.map((g) =>
      g.options.find((o) => o.id === selections[g.id]),
    );
    const absolute = chosen.find((o) => o.priceMode === "absolute");
    const expected =
      (absolute?.price ?? p.basePrice) +
      chosen.reduce(
        (sum, o) => sum + (o.priceMode === "delta" ? o.price : 0),
        0,
      );
    assert.equal(
      unitPrice(p, selections),
      expected,
      `${p.id}: ${JSON.stringify(selections)}`,
    );
    configurations++;
  }
}
const enchiladas = products.find((p) => p.id === "enchiladas");
assert.deepEqual(
  Array.from(
    enchiladas.optionGroups.find((g) => g.label === "Salsa").options,
    (o) => o.label,
  ),
  ["Salsa verde", "Salsa roja", "Salsa Lunario (habanero)"],
);
assert.equal(
  unitPrice(enchiladas, { "enchiladas-protein": "enchiladas-protein-3" }),
  117,
  "A surcharge selected before presentation must include the base price",
);
assert(
  !products
    .find((p) => p.id === "americano")
    .optionGroups.some((g) => g.label === "Leche"),
);
assert(
  !context.exports
    .visibleGroups(enchiladas, {})
    .some((g) => g.label === "Bebida del paquete"),
);
assert(
  context.exports
    .visibleGroups(enchiladas, {
      "enchiladas-presentacion": "enchiladas-presentacion-1",
    })
    .some((g) => g.label === "Bebida del paquete"),
);
console.log(
  `PASS: ${products.length} products, ${configurations} configurations, prices, option IDs, categories and Enchiladas salsa.`,
);
