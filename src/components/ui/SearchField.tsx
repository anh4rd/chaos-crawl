import Icon from "./Icon";
import IconButton from "./IconButton";

export default function SearchField({
  value,
  label,
  placeholder,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="search-field">
      <Icon name="search" className="icon--size-17" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value && (
        <IconButton
          type="button"
          variant="search-clear"
          icon="x"
          iconClassName="icon--size-15"
          label="Clear search"
          onClick={() => onChange("")}
        />
      )}
    </label>
  );
}
