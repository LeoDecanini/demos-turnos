import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.moveup.digital",
                pathname: "/**", // podés restringirlo más si querés
            },
        ],
    },
};

export default nextConfig;
