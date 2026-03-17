import type { Metadata } from "next";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "StableMatch",
  description: "MVP for discovering and claiming horse boarding facilities in Sweden."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>
        <div className="siteShell">
          <header className="siteHeader">
            <Link className="brand" href="/">
              StableMatch
            </Link>
            <nav className="siteNav">
              <Link href="/">Sök stall</Link>
              <Link href="/for-owners">För stallägare</Link>
              <Link href="/admin/review">Admin</Link>
              <Link href="/admin/duplicates">Dubletter</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
