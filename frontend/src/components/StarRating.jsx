function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={filled ? 'is-filled' : 'is-empty'}>
      <path d="M10 1.8 12.4 7l5.6.5-4.2 3.7 1.3 5.5L10 13.8 4.9 16.7l1.3-5.5L2 7.5 7.6 7 10 1.8Z" />
    </svg>
  );
}

export function formatRatingAverage(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return '0';
  }
  return (Math.round(number * 10) / 10).toFixed(1).replace(/\.0$/, '.0');
}

export default function StarRating({
  value = 0,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  label = 'Rating',
}) {
  const numeric = Math.max(0, Math.min(max, Number(value) || 0));
  const rounded = Math.round(numeric);

  return (
    <div
      className={`star-rating size-${size}${interactive ? ' is-interactive' : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? label : `${formatRatingAverage(numeric)} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = interactive ? starValue <= rounded : starValue <= Math.round(numeric);
        if (!interactive) {
          return <StarIcon key={starValue} filled={filled} />;
        }
        return (
          <button
            key={starValue}
            type="button"
            className={filled ? 'star-button is-on' : 'star-button'}
            aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            aria-checked={starValue === rounded}
            role="radio"
            onClick={() => onChange?.(starValue)}
          >
            <StarIcon filled={filled} />
          </button>
        );
      })}
    </div>
  );
}

export function CompactProductRating({ average = 0, count = 0 }) {
  const safeCount = Number(count) || 0;
  if (safeCount <= 0) {
    return null;
  }
  const safeAverage = Number(average) || 0;

  return (
    <p className="product-card-rating" aria-label={`Rated ${formatRatingAverage(safeAverage)} from ${safeCount} reviews`}>
      <StarRating value={safeAverage} size="sm" />
      <span>
        {formatRatingAverage(safeAverage)} ({safeCount})
      </span>
    </p>
  );
}
