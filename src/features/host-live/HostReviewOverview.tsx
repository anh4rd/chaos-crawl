import Icon from "../../components/ui/Icon";

export type ReviewFilter = "main" | "side" | "secret";

interface Props {
  submissionCount: number;
  pendingCount: number;
  pointsAwarded: number;
  counts: Record<ReviewFilter, number>;
  pending: Record<ReviewFilter, number>;
  visible: ReviewFilter[];
  filter: ReviewFilter;
  onFilter: (filter: ReviewFilter) => void;
}

const filters: { id: ReviewFilter; label: string }[] = [
  { id: "main", label: "Main" },
  { id: "side", label: "Side" },
  { id: "secret", label: "Secret" },
];

export default function HostReviewOverview({
  submissionCount,
  pendingCount,
  pointsAwarded,
  counts,
  pending,
  visible,
  filter,
  onFilter,
}: Props) {
  return (
    <div className="host-review-overview">
      <dl className="host-review-overview__stats">
        <div className="host-review-overview__stat">
          <Icon name="upload" className="icon--size-20" aria-hidden="true" />
          <dd>{submissionCount}</dd>
          <dt>Submissions</dt>
        </div>
        <div className="host-review-overview__stat">
          <Icon
            name="clipboard-list"
            className="icon--size-20"
            aria-hidden="true"
          />
          <dd>{pendingCount}</dd>
          <dt>Awaiting review</dt>
        </div>
        <div className="host-review-overview__stat">
          <Icon name="trophy" className="icon--size-20" aria-hidden="true" />
          <dd>{pointsAwarded}</dd>
          <dt>Points awarded</dt>
        </div>
      </dl>
      <div
        className="host-review-overview__filters"
        role="group"
        aria-label="Review category"
      >
        {filters
          .filter((item) => visible.includes(item.id))
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className="host-review-overview__filter"
              aria-pressed={filter === item.id}
              onClick={() => onFilter(item.id)}
            >
              {item.label} ({counts[item.id]})
              {pending[item.id] > 0 && (
                <span className="host-review-overview__pending">
                  {pending[item.id]}
                  <span className="u-visually-hidden"> pending review</span>
                </span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
}
