"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlaceResult {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  placeId?: string;
}

interface MapSearchProps {
  /** Called when search returns results (to add markers). */
  onResults: (places: PlaceResult[]) => void;
  /** Called when a specific place result is selected. */
  onSelectPlace?: (place: PlaceResult) => void;
  /** User's current coordinates for location-biased search. */
  userLocation?: { lat: number; lng: number } | null;
  /** Additional class names for the container. */
  className?: string;
}

/**
 * Floating search bar overlaying the map.
 *
 * Positioned at top-centre. On submit, queries the `/api/location/places`
 * endpoint and passes results back to the parent for marker rendering.
 */
export function MapSearch({
  onResults,
  onSelectPlace,
  userLocation,
  className,
}: MapSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Close results on outside click ────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Search handler ────────────────────────────────────────────────────

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = query.trim();
      if (!trimmed) return;

      setIsSearching(true);
      setResults([]);

      try {
        const params = new URLSearchParams({ query: trimmed });

        if (userLocation) {
          params.set("lat", userLocation.lat.toString());
          params.set("lng", userLocation.lng.toString());
        }

        const res = await fetch(`/api/location/places?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data = await res.json();
        const places: PlaceResult[] = data.places ?? [];

        setResults(places);
        setShowResults(places.length > 0);
        onResults(places);
      } catch (error) {
        console.error("[MapSearch] Search failed:", error);
        setResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [query, userLocation, onResults]
  );

  // ── Clear search ──────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    onResults([]);
    inputRef.current?.focus();
  }, [onResults]);

  // ── Select a result ───────────────────────────────────────────────────

  const handleSelectPlace = useCallback(
    (place: PlaceResult) => {
      setShowResults(false);
      setQuery(place.name);
      onSelectPlace?.(place);
    },
    [onSelectPlace]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute left-1/2 top-4 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2",
        className
      )}
    >
      {/* Search input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search places in India..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="h-11 rounded-xl border-border bg-white pl-10 pr-20 shadow-lg focus-visible:ring-[#FF9933]"
          />
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClear}
                className="h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSearching || !query.trim()}
              className="h-8 rounded-lg bg-[#FF9933] px-3 text-xs text-white hover:bg-[#FF9933]/90"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
          {results.map((place, index) => (
            <button
              key={place.placeId ?? `${place.name}-${index}`}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/30"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF9933]/10">
                <Search className="h-4 w-4 text-[#FF9933]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {place.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {place.address}
                </p>
                {place.rating !== undefined && place.rating > 0 && (
                  <p className="mt-0.5 text-xs text-[#FF9933]">
                    Rating: {place.rating} / 5
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
