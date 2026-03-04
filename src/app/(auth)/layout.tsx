import { IndiaLogo } from "@/components/shared/india-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-gradient-to-b from-saffron-50 to-white">
      {/* Tricolor bar at top */}
      <div className="flex h-[3px] w-full">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-india-green" />
        <div className="flex-1 bg-navy" />
      </div>

      {/* Centered content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="mb-8">
          <IndiaLogo size="lg" className="items-center" />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
