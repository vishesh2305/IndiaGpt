export interface NavItem {
  label: string;
  href: string;
  icon: string;
  description?: string;
}

/**
 * Primary navigation items for the application sidebar/navbar.
 * Icon names correspond to lucide-react icon component names.
 */
export const navItems: NavItem[] = [
  {
    label: "Chat",
    href: "/",
    icon: "MessageSquare",
    description: "Start a conversation with IndiaGPT",
  },
  {
    label: "Voice",
    href: "/voice",
    icon: "Mic",
    description: "Talk to IndiaGPT using your voice",
  },
  {
    label: "Map",
    href: "/map",
    icon: "MapPin",
    description: "Explore location-aware assistance",
  },
  {
    label: "History",
    href: "/history",
    icon: "Clock",
    description: "View your past conversations",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    description: "Customize your experience",
  },
];
