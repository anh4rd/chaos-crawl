var e=`export default function GameCodeInput({
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
      <label className="game-code-input__label" htmlFor={id}>
        Six-digit game code
      </label>
      <div className="game-code-input__cells" aria-label="Six digit game code">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            className={\`game-code-input__cell\${value[index] ? " game-code-input__cell--filled" : ""}\`}
            key={index}
          >
            {value[index] ?? "1"}
          </span>
        ))}
        <input
          id={id}
          className="game-code-input__control"
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-label="Enter six digit game code"
          onChange={(event) =>
            onChange(event.target.value.replace(/\\D/g, "").slice(0, 6))
          }
        />
      </div>
    </>
  );
}
`;export{e as default};