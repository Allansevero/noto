import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-table", "date-fns"],
  },
  async rewrites() {
    return [
      {
        source: "/api/focusnfe/:path*",
        destination: "https://homologacao.focusnfe.com.br/:path*",
      },
    ];
  },
};

export default nextConfig;
