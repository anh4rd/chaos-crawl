interface TeamCardProps {
  emoji: string;
  name: string;
  colour: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function TeamCard({
  emoji,
  name,
  colour,
  selected = false,
  onClick,
}: TeamCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative
        w-full
        overflow-hidden
        rounded-3xl
        border
        p-5
        text-left
        transition-all
        duration-200
        ${
          selected
            ? "border-yellow-400 scale-[1.02]"
            : "border-zinc-800 hover:border-zinc-600"
        }
      `}
    >
      <div
        className="absolute inset-y-0 left-0 w-2"
        style={{ background: colour }}
      />

      <div className="ml-4 flex items-center gap-4">

        <span className="text-4xl">
          {emoji}
        </span>

        <div>

          <h3 className="text-xl font-bold">
            {name}
          </h3>

          <p className="text-sm text-zinc-400">
            Join this team
          </p>

        </div>

      </div>

    </button>
  );
}