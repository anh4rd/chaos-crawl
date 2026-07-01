interface TeamCardProps {
  emoji: string;
  name: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function TeamCard({
  emoji,
  name,
  selected = false,
  onClick,
}: TeamCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full
        rounded-2xl
        border
        p-5
        text-left
        transition

        ${
          selected
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-zinc-800 bg-zinc-900"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{emoji}</span>

        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
    </button>
  );
}