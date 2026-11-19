import BrandLink from "../../components/ui/BrandLink";
import HostAccessForm from "./HostAccessForm";
import { useHostAccess } from "./useHostAccess";
export default function HostAccess() {
  const auth = useHostAccess();
  return (
    <main className="host-portal host-access">
      <div className="host-access__shell">
        <BrandLink
          variant="host"
          iconClassName="icon--size-22"
          aria-label="Chaos Crawl home"
        />
        <HostAccessForm auth={auth} />
        <p className="host-access__footer">
          Big ideas. Questionable decisions. Excellent stories.
        </p>
      </div>
    </main>
  );
}
