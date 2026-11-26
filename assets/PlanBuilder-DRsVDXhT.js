var e=`import ContentPanel from "../../components/ui/ContentPanel";
import type { ReactNode } from "react";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
export default function PlanBuilder({
  title,
  description,
  onBasics,
  navigation,
  children,
}: {
  title?: string;
  description?: string;
  onBasics: () => void;
  navigation: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="plan-builder">
      <ContentPanel
        as="section"
        variant="workspace"
        className="plan-builder__content"
      >
        <div className="plan-builder__heading">
          <div>
            <span className="step-label">STEP 2 · BUILD YOUR EXPERIENCE</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Button variant="setup-text" fullWidth={false} onClick={onBasics}>
            <Icon name="arrow-left" className="icon--size-15" /> Game basics
          </Button>
        </div>
        {children}
        {navigation}
      </ContentPanel>
    </div>
  );
}
`;export{e as default};