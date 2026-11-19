import Card from "../../components/ui/Card";
import { Example } from "./Example";
export default function CardExample() {
  return (
    <Example
      className="card-example"
      title="Card"
      source="src/components/ui/Card.tsx"
      code={
        'import Card from "./components/ui/Card";\n\n<Card>\n  <h2>Your next adventure</h2>\n  <p>Compose the content you need.</p>\n</Card>'
      }
    >
      <Card>
        <h2>Your next adventure</h2>
        <p className="card-example__copy">
          A shared surface for tasks, forms and game details.
        </p>
        <p className="card-example__copy card-example__detail">
          Children + optional className
        </p>
      </Card>
    </Example>
  );
}
