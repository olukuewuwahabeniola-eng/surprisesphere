import { useMemo, useState } from 'react';
import { readError, submitProductReview } from '../services/api';
import StarRating, { formatRatingAverage } from './StarRating';

function formatReviewDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DistributionRow({ stars, count, total }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">
        {stars} star{stars === 1 ? '' : 's'}
      </span>
      <div className="rating-bar-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="rating-bar-count">
        {count} · {percent}%
      </span>
    </div>
  );
}

export default function ProductReviews({ productId, summary, reviews = [], onSubmitted }) {
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const distribution = useMemo(() => {
    const base = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const incoming = summary?.distribution || {};
    return {
      5: Number(incoming[5]) || 0,
      4: Number(incoming[4]) || 0,
      3: Number(incoming[3]) || 0,
      2: Number(incoming[2]) || 0,
      1: Number(incoming[1]) || 0,
    };
  }, [summary]);

  const count = Number(summary?.count) || 0;
  const average = Number(summary?.average) || 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await submitProductReview({
        productId,
        displayName,
        rating,
        body,
      });
      setSuccess(
        result.message ||
          'Thank you for sharing your experience! Your review has been submitted and is awaiting approval.',
      );
      setDisplayName('');
      setBody('');
      setRating(0);
      setFormOpen(false);
      onSubmitted?.(result);
    } catch (err) {
      setError(readError(err, 'Your review could not be submitted. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="product-reviews" aria-labelledby="customer-reviews-title">
      <div className="product-reviews-head">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 id="customer-reviews-title">Customer Reviews</h2>
        </div>
        <button
          type="button"
          className="button button-wine button-rect"
          onClick={() => {
            setFormOpen((open) => {
              const next = !open;
              if (next) {
                setRating(0);
                setError('');
              }
              return next;
            });
          }}
        >
          {formOpen ? 'Close form' : 'Write a Review'}
        </button>
      </div>

      {success && (
        <p className="review-success" role="status">
          {success.includes('awaiting approval')
            ? success
            : 'Thank you for sharing your experience! Your review has been submitted and is awaiting approval.'}
        </p>
      )}

      <div className="review-summary-grid">
        <div className="review-summary-score">
          {count > 0 ? (
            <>
              <p className="review-average">{formatRatingAverage(average)}</p>
              <StarRating value={average} size="lg" />
              <p className="review-count-copy">
                Based on {count} approved review{count === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <>
              <p className="review-average is-empty">—</p>
              <p className="review-count-copy">
                No approved reviews yet. Be the first to share your experience.
              </p>
            </>
          )}
        </div>

        <div className="review-summary-bars" aria-label="Star rating distribution">
          {[5, 4, 3, 2, 1].map((stars) => (
            <DistributionRow
              key={stars}
              stars={stars}
              count={distribution[stars]}
              total={count}
            />
          ))}
        </div>
      </div>

      {formOpen && (
        <form className="review-form" onSubmit={handleSubmit} noValidate>
          <h3>Write a Review</h3>
          <div className="review-rating-field">
            <span className="review-rating-label" id="review-rating-label">
              Your rating <abbr title="required">*</abbr>
            </span>
            <StarRating
              value={rating}
              interactive
              required
              showLabel
              onChange={(next) => {
                setRating(next);
                if (error) setError('');
              }}
              size="xl"
              label="Choose a star rating"
            />
          </div>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder="How should we show your name?"
            />
          </label>
          <label>
            Written review <span className="optional">(optional)</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share fit, quality, colour or styling notes."
            />
          </label>
          {error && (
            <p className="form-note admin-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button button-wine" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="review-list">
        {reviews.length === 0 ? (
          <p className="review-empty">Approved customer reviews will appear here.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card-top">
                <div>
                  <h3>{review.displayName}</h3>
                  <p className="review-date">{formatReviewDate(review.submittedAt)}</p>
                </div>
                <StarRating value={review.rating} size="sm" />
              </div>
              {review.body ? <p>{review.body}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
