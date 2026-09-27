import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
            {
                protocol: "https",
                hostname: "**.tiktokcdn.com",
            },
            {
                protocol: "https",
                hostname: "**.cdninstagram.com",
            },
            {
                protocol: "https",
                hostname: "i.ytimg.com",
            },
            {
                protocol: "https",
                hostname: "img.youtube.com",
            },
            {
                protocol: "https",
                hostname: "m.media-amazon.com",
            },
            {
                protocol: "https",
                hostname: "**.shopee.com.br",
            },
            {
                protocol: "https",
                hostname: "down-br.img.susercontent.com",
            },
            {
                protocol: "https",
                hostname: "http2.mlstatic.com",
            },
            {
                protocol: "https",
                hostname: "ae01.alicdn.com",
            },
            {
                protocol: "https",
                hostname: "i.imgur.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
};

export default nextConfig;
