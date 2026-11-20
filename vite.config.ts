import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// tr46 (pulled in by mongodb) does `require("punycode/")` to load the userland
// package. In dev, Vite's dep optimizer leaves that require external, which
// workerd can't run. Resolve it to the installed file so it gets bundled.
const punycodePath = fileURLToPath(new URL("./node_modules/punycode/punycode.js", import.meta.url));
const resolvePunycode = {
  name: "resolve-punycode-slash",
  resolveId(id: string) {
    if (id === "punycode/") return punycodePath;
  },
};
const serverOptimizeDeps = { optimizeDeps: { rolldownOptions: { plugins: [resolvePunycode] } } };

export default defineConfig({
  environments: {
    rsc: serverOptimizeDeps,
    ssr: serverOptimizeDeps,
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
