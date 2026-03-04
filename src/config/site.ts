import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github: string;
    twitter: string;
  };
  creator: string;
  keywords: string[];
}

export const siteConfig: SiteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: process.env.NEXT_PUBLIC_APP_URL || "https://indiagpt.in",
  ogImage: "/og-image.png",
  links: {
    github: "https://github.com/indiagpt",
    twitter: "https://twitter.com/indiagpt",
  },
  creator: "IndiaGPT Team",
  keywords: [
    "IndiaGPT",
    "AI Assistant",
    "India",
    "Multilingual AI",
    "Hindi AI",
    "Indian Languages",
    "ChatGPT India",
    "Bharat AI",
    "Voice AI",
    "Regional Language AI",
  ],
};
