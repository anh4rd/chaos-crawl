import Container from "../components/ui/Container";
import Card from "../components/ui/Card";

export default function Home() {
  return (
    <Container>
      <div className="space-y-8">

        <div>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm">
            🎉 London Games
          </span>

          <h1 className="mt-6 text-5xl font-bold">
            Real-world
            <br />
            Social Chaos
          </h1>

          <p className="mt-4 text-zinc-400">
            Complete ridiculous challenges with your friends.
          </p>
        </div>

        <Card>
          Home screen complete.
        </Card>

      </div>
    </Container>
  );
}
