/**
 * Homepage collection placement — independent from shopping category.
 */
export default function AdminProductPlacement({
  bestSeller = false,
  newArrival = false,
  onChange,
  disabled = false,
}) {
  return (
    <section className="admin-placement" aria-labelledby="admin-placement-title">
      <div className="admin-placement-head">
        <h3 id="admin-placement-title">Where should this product appear?</h3>
        <p>
          Choose homepage collections for this product. This does not change its shopping category —
          customers can still find it under that category.
        </p>
      </div>

      <div className="admin-placement-options" role="group" aria-label="Homepage placements">
        <label className={`admin-placement-card${bestSeller ? ' is-selected' : ''}`}>
          <input
            type="checkbox"
            checked={Boolean(bestSeller)}
            disabled={disabled}
            onChange={(event) => onChange?.({ bestSeller: event.target.checked })}
          />
          <span className="admin-placement-card-body">
            <strong>Best Sellers</strong>
            <small>Show this product in the Best Sellers homepage section and View All page.</small>
          </span>
        </label>

        <label className={`admin-placement-card${newArrival ? ' is-selected' : ''}`}>
          <input
            type="checkbox"
            checked={Boolean(newArrival)}
            disabled={disabled}
            onChange={(event) => onChange?.({ newArrival: event.target.checked })}
          />
          <span className="admin-placement-card-body">
            <strong>New Arrivals</strong>
            <small>Show this product in the New Arrivals homepage section and View All page.</small>
          </span>
        </label>
      </div>
    </section>
  );
}
