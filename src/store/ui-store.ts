import { create } from "zustand";

type ActiveMode = "chat" | "voice" | "driving" | "map";

interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeMode: ActiveMode;
  isMobileMenuOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveMode: (mode: ActiveMode) => void;
  setMobileMenu: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeMode: "chat",
  isMobileMenuOpen: false,

  // ── Actions ────────────────────────────────────────────────────────────

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setActiveMode: (mode) =>
    set({
      activeMode: mode,
      // Auto-close mobile menu when switching modes
      isMobileMenuOpen: false,
    }),

  setMobileMenu: (open) => set({ isMobileMenuOpen: open }),
}));
