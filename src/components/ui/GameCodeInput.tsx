export default function GameCodeInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className="join-code-label" htmlFor={id}>
        Six-digit game code
      </label>
      <div className="join-code-boxes" aria-label="Six digit game code">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            className={`join-code-box${value[index] ? " join-code-box--filled" : ""}`}
            key={index}
          >
            {value[index] ?? "1"}
          </span>
        ))}
        <input
          id={id}
          className="join-code-input-overlay"
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-label="Enter six digit game code"
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
      </div>
    </>
  );
}
