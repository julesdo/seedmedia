"use client";

import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Mission Seed */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Mission Seed</h3>
            <p className="text-sm text-muted-foreground">
              Le média social de la résilience technologique. 
              Analyses. Débats. Gouvernance ouverte. Solutions fiables.
            </p>
          </div>

          {/* Liens rapides */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Liens</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/articles" className="text-muted-foreground hover:text-foreground transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/dossiers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dossiers
                </Link>
              </li>
              <li>
                <Link href="/debats" className="text-muted-foreground hover:text-foreground transition-colors">
                  Débats
                </Link>
              </li>
              <li>
                <Link href="/gouvernance" className="text-muted-foreground hover:text-foreground transition-colors">
                  Gouvernance
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Ressources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/transparence" className="text-muted-foreground hover:text-foreground transition-colors">
                  Transparence
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/seedmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Open-source
                  <SolarIcon icon="external-link-bold" className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="text-muted-foreground hover:text-foreground transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-muted-foreground hover:text-foreground transition-colors">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-sm text-center text-muted-foreground">
            © {new Date().getFullYear()} Seed. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

