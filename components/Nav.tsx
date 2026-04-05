import Link from "next/link";

const links = [
  { href: "/community", label: "Community" },
  { href: "/generate", label: "Generate" },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-8">
        <Link
          href="/"
          className="text-slate-800 font-medium hover:text-slate-600 transition-colors"
        >
          Praxis
        </Link>
        <div className="flex gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
