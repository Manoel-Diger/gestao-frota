import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// A dependência 'lovable-tagger' foi removida para resolver as vulnerabilidades.
// A linha de importação abaixo foi comentada para que o projeto possa iniciar.
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // O plugin 'componentTagger' foi removido da lista de plugins
  // para que o projeto possa iniciar sem a dependência.
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
