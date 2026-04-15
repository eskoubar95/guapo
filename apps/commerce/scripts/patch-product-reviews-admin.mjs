import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const targets = [
  "node_modules/@lambdacurry/medusa-product-reviews/.medusa/server/src/admin/index.js",
  "node_modules/@lambdacurry/medusa-product-reviews/.medusa/server/src/admin/index.mjs",
];

const replacements = [
  ["review.images.map(", "(review.images ?? []).map("],
  ["review.images.length > 0", "(review.images ?? []).length > 0"],
  ["row.original.images.length", "(row.original.images ?? []).length"],
  [
    "const product = row.original.product;\n        return",
    "const product = row.original.product;\n        if (!product?.id) {\n          return /* @__PURE__ */ jsxRuntime.jsx(\"span\", { className: \"text-sm text-ui-fg-muted\", children: \"\\u2014\" });\n        }\n        return",
  ],
  [
    "const product = row.original.product;\n        return",
    "const product = row.original.product;\n        if (!product?.id) {\n          return /* @__PURE__ */ jsx(\"span\", { className: \"text-sm text-ui-fg-muted\", children: \"\\u2014\" });\n        }\n        return",
  ],
  [
    "return /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Link, { to: `/orders/${row.original.order.id}`, children: /* @__PURE__ */ jsxRuntime.jsxs(\"span\", { className: \"text-sm whitespace-normal break-words hover:underline\", children: [\n          \"#\",\n          row.original.order.display_id\n        ] }) });",
    "const order = row.original.order;\n        if (!order?.id) {\n          return /* @__PURE__ */ jsxRuntime.jsx(\"span\", { className: \"text-sm text-ui-fg-muted\", children: \"\\u2014\" });\n        }\n        return /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Link, { to: `/orders/${order.id}`, children: /* @__PURE__ */ jsxRuntime.jsxs(\"span\", { className: \"text-sm whitespace-normal break-words hover:underline\", children: [\n          \"#\",\n          order.display_id\n        ] }) });",
  ],
  [
    "return /* @__PURE__ */ jsx(Link, { to: `/orders/${row.original.order.id}`, children: /* @__PURE__ */ jsxs(\"span\", { className: \"text-sm whitespace-normal break-words hover:underline\", children: [\n          \"#\",\n          row.original.order.display_id\n        ] }) });",
    "const order = row.original.order;\n        if (!order?.id) {\n          return /* @__PURE__ */ jsx(\"span\", { className: \"text-sm text-ui-fg-muted\", children: \"\\u2014\" });\n        }\n        return /* @__PURE__ */ jsx(Link, { to: `/orders/${order.id}`, children: /* @__PURE__ */ jsxs(\"span\", { className: \"text-sm whitespace-normal break-words hover:underline\", children: [\n          \"#\",\n          order.display_id\n        ] }) });",
  ],
];

function patchFile(path) {
  if (!existsSync(path)) return { found: false, changed: false };

  const original = readFileSync(path, "utf8");
  let next = original;

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  if (next !== original) {
    writeFileSync(path, next, "utf8");
    return { found: true, changed: true };
  }

  return { found: true, changed: false };
}

let foundAny = false;
let changedAny = false;

for (const rel of targets) {
  const abs = resolve(process.cwd(), rel);
  const { found, changed } = patchFile(abs);
  foundAny = foundAny || found;
  changedAny = changedAny || changed;
}

if (!foundAny) {
  console.log("[postinstall] product-reviews admin patch skipped (package not installed).");
  process.exit(0);
}

if (changedAny) {
  console.log("[postinstall] product-reviews admin patch applied.");
} else {
  console.log("[postinstall] product-reviews admin patch already up to date.");
}
