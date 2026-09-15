import type { NextConfig } from "next";

// Configuração do Next.js
const nextConfig: NextConfig = {
  // Rotas renomeadas mantêm redirect permanente (28): /visitas -> /experiencias (guia §9).
  async redirects() {
    return [{ source: "/:locale(pt|en)/visitas", destination: "/:locale/experiencias", permanent: true }];
  },
};

export default nextConfig;
