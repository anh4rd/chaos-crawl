import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import BrandLink from "../../components/ui/BrandLink";
import Icon from "../../components/ui/Icon";
import Overline from "../../components/ui/Overline";
import StyleguideSidebar from "./StyleguideSidebar";
export default function StyleguideShell({ children }: { children: ReactNode }) {
  return (
    <div className="styleguide">
      <a
        className="styleguide__skip"
        href="#/styleguide"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("sg-content")?.focus();
        }}
      >
        Skip to components
      </a>
      <header className="styleguide__topbar">
        <BrandLink variant="compact" />
        <Overline className="styleguide__topbar-label">
          DESIGN REFERENCE
        </Overline>
        <Link className="styleguide__app-link" to="/">
          Open app <Icon name="arrow-up-right" className="icon--size-16" />
        </Link>
      </header>
      <div className="styleguide__layout">
        <StyleguideSidebar />
        <main id="sg-content" className="styleguide__main" tabIndex={-1}>
          {children}
          <footer className="styleguide__footer">
            <Icon name="sparkles" className="icon--size-18" />
            <p>
              Keep this reference useful: reuse the source components and update
              their examples when contracts change. New component modules appear
              in the catalog automatically.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
