import { create } from "zustand";

type PermissionStatus = "prompt" | "granted" | "denied" | "unavailable";

interface LocationStore {
  coordinates: { lat: number; lng: number } | null;
  city: string | null;
  state: string | null;
  permissionStatus: PermissionStatus;
  isLoading: boolean;
  error: string | null;

  setCoordinates: (coords: { lat: number; lng: number }) => void;
  setLocationInfo: (city: string, state: string) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getLocationString: () => string;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  coordinates: null,
  city: null,
  state: null,
  permissionStatus: "prompt",
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────────────

  setCoordinates: (coords) =>
    set({
      coordinates: coords,
      error: null,
    }),

  setLocationInfo: (city, state) =>
    set({
      city,
      state,
      error: null,
    }),

  setPermissionStatus: (status) => set({ permissionStatus: status }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  getLocationString: () => {
    const { city, state } = get();
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return "Location not set";
  },

  clearLocation: () =>
    set({
      coordinates: null,
      city: null,
      state: null,
      error: null,
      isLoading: false,
    }),
}));
