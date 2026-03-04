// Force all (main) routes to be dynamically rendered (not statically generated)
// since they require authentication
export const dynamic = "force-dynamic";

export default function MainTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
