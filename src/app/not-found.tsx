import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Tricolor accent bar */}
        <div className="flex w-48 overflow-hidden rounded-full">
          <div className="h-1.5 flex-1 bg-saffron" />
          <div className="h-1.5 flex-1 bg-navy" />
          <div className="h-1.5 flex-1 bg-india-green" />
        </div>

        {/* 404 number */}
        <h1 className="text-[8rem] font-extrabold leading-none tracking-tighter text-saffron sm:text-[10rem]">
          404
        </h1>

        {/* Message */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Page not found
          </h2>
          <p className="max-w-md text-base text-muted-foreground">
            The page you are looking for does not exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action button */}
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-saffron px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-saffron-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go back home
        </Link>

        {/* Bottom tricolor accent */}
        <div className="mt-8 flex w-48 overflow-hidden rounded-full">
          <div className="h-1.5 flex-1 bg-saffron" />
          <div className="h-1.5 flex-1 bg-navy" />
          <div className="h-1.5 flex-1 bg-india-green" />
        </div>
      </div>
    </div>
  );
}
