import { useState } from 'react';

export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

function StarIcon({ filled, preview }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`${filled ? 'is-filled' : 'is-empty'}${preview ? ' is-preview' : ''}`}
    >
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

export function ratingLabel(value) {
  return RATING_LABELS[Number(value)] || '';
}

export default function StarRating({
  value = 0,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  label = 'Rating',
  showLabel = false,
  required = false,
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const numeric = Math.max(0, Math.min(max, Number(value) || 0));
  const rounded = Math.round(numeric);
  const visual = interactive && hoverValue > 0 ? hoverValue : rounded;

  return (
    <div className={`star-rating-wrap${interactive ? ' is-interactive-wrap' : ''}`}>
      <div
        className={`star-rating size-${size}${interactive ? ' is-interactive' : ''}`}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? label : `${formatRatingAverage(numeric)} out of ${max} stars`}
        aria-required={interactive && required ? true : undefined}
        onMouseLeave={() => interactive && setHoverValue(0)}
      >
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= visual;
          const preview =
            interactive && hoverValue > 0 && starValue <= hoverValue && hoverValue !== rounded;
          if (!interactive) {
            return <StarIcon key={starValue} filled={filled} />;
          }
          return (
            <button
              key={starValue}
              type="button"
              className={`star-button${filled ? ' is-on' : ''}${starValue === rounded ? ' is-selected' : ''}`}
              aria-label={`${starValue} star${starValue === 1 ? '' : 's'}${
                RATING_LABELS[starValue] ? ` — ${RATING_LABELS[starValue]}` : ''
              }`}
              aria-checked={starValue === rounded}
              role="radio"
              onMouseEnter={() => setHoverValue(starValue)}
              onFocus={() => setHoverValue(starValue)}
              onBlur={() => setHoverValue(0)}
              onClick={() => onChange?.(starValue)}
            >
              <StarIcon filled={filled} preview={preview} />
            </button>
          );
        })}
      </div>
      {interactive && showLabel ? (
        <p className={`rating-description${rounded ? ' has-value' : ''}`} aria-live="polite">
          {rounded ? RATING_LABELS[rounded] : 'Select a rating'}
        </p>
      ) : null}
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
    <p
      className="product-card-rating"
      aria-label={`Rated ${formatRatingAverage(safeAverage)} from ${safeCount} reviews`}
    >
      <StarRating value={safeAverage} size="sm" />
      <span>
        {formatRatingAverage(safeAverage)} ({safeCount})
      </span>
    </p>
  );
}
