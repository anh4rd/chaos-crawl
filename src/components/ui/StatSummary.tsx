type Stat = { label: string; value: string | number };

export default function StatSummary({
  items,
  valueFirst = false,
}: {
  items: [Stat, Stat, Stat];
  valueFirst?: boolean;
}) {
  return (
    <dl className="stat-summary">
      {items.map(({ label, value }) => {
        const term = <dt className="stat-summary__label">{label}</dt>;
        const description = <dd className="stat-summary__value">{value}</dd>;
        return (
          <div className="stat-summary__item" key={label}>
            {valueFirst ? (
              <>
                {description}
                {term}
              </>
            ) : (
              <>
                {term}
                {description}
              </>
            )}
          </div>
        );
      })}
    </dl>
  );
}
