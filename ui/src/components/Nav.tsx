import Link from "next/link";

const links = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/profile", label: "Profile" },
  { href: "/cv", label: "CV" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  return (
    <header className="glass sticky top-0 z-50 hairline-b">
      <nav
        className="container flex items-center justify-between"
        style={{ paddingInline: "var(--gutter)", height: "48px" }}
      >
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          Career&#x2011;Ops
        </Link>
        <ul className="flex items-center gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[12px] tracking-wide transition-opacity hover:opacity-60"
                style={{ color: "var(--fg)" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
