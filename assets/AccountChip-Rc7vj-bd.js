var e=`import Avatar from "./Avatar";
export default function AccountChip({
  name,
  preview = false,
}: {
  name: string;
  preview?: boolean;
}) {
  return (
    <div className="account-chip">
      <Avatar name={name} />
      <span className="account-chip__name">{name}</span>
      {preview && <small className="account-chip__preview">PREVIEW</small>}
    </div>
  );
}
`;export{e as default};