export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8">
        {/* Animated tricolor rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer saffron ring */}
          <div className="absolute h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-saffron" />
          {/* Middle white/navy ring */}
          <div
            className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-navy"
            style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
          />
          {/* Inner green ring */}
          <div
            className="absolute h-8 w-8 animate-spin rounded-full border-4 border-transparent border-t-india-green"
            style={{ animationDuration: "0.8s" }}
          />
          {/* Center dot */}
          <div className="h-3 w-3 rounded-full bg-saffron animate-pulse" />
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            India<span className="text-saffron">GPT</span>
          </h1>
          <div className="flex items-center gap-1.5">
            <div
              className="h-1 w-6 rounded-full bg-saffron animate-pulse"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="h-1 w-6 rounded-full bg-navy animate-pulse"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="h-1 w-6 rounded-full bg-india-green animate-pulse"
              style={{ animationDelay: "400ms" }}
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}
