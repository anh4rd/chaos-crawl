import Badge from "../../components/ui/Badge";
import Icon from "../../components/ui/Icon";
import Overline from "../../components/ui/Overline";
export default function StyleguideIntro() {
  return (
    <div className="styleguide-intro">
      <Overline>THE CHAOS CRAWL STYLEGUIDE</Overline>
      <h1 className="styleguide-intro__title">
        Build on
        <br />
        <span className="styleguide-intro__accent">the good stuff.</span>
      </h1>
      <p className="styleguide-intro__copy">
        One place for our colors, components and patterns. Start here, reuse
        what exists, and keep every game feeling like Chaos Crawl.
      </p>
      <div className="styleguide-intro__badges">
        <Badge variant="outline">
          <Icon name="check" className="icon--size-15" /> Live component
          examples
        </Badge>
        <Badge variant="outline">Local demo data</Badge>
      </div>
    </div>
  );
}
