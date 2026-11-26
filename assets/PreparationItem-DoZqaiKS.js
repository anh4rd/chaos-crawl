var e=`import PosterCopy from "../../components/ui/PosterCopy";
export default function PreparationItem({
  title,
  prep,
}: {
  title: string;
  prep: string;
}) {
  return (
    <div className="preparation-item">
      <strong>{title}</strong>
      <PosterCopy>{prep}</PosterCopy>
    </div>
  );
}
`;export{e as default};