import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
  ],
  server: {
    port: 8080,
    host: "0.0.0.0",
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
