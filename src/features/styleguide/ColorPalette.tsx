import ColorSwatch from "./ColorSwatch";
export default function ColorPalette() {
  return (
    <div className="color-palette">
      <ColorSwatch label="Purple" token="--purple" />
      <ColorSwatch label="Purple mid" token="--purple-mid" />
      <ColorSwatch label="Purple dark" token="--purple-dark" />
      <ColorSwatch label="Pink" token="--pink" />
      <ColorSwatch label="Lime" token="--lime" />
      <ColorSwatch label="Yellow" token="--yellow" />
      <ColorSwatch label="Ink" token="--black" />
      <ColorSwatch label="White" token="--white" />
    </div>
  );
}
