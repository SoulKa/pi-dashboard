import path from "node:path";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    proxy: {
      "/api/vvs": {
        target: "https://www3.vvs.de/mngvvs",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vvs/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vue(), UnoCSS()],
});
