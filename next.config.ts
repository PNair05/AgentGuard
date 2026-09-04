import type { NextConfig } from "next";

const webMcpOriginTrialToken = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...(webMcpOriginTrialToken
            ? [{ key: "Origin-Trial", value: webMcpOriginTrialToken }]
            : []),
          { key: "Permissions-Policy", value: "tools=(self)" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
