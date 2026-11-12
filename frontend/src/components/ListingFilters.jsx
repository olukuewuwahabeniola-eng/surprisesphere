import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export default function ListingFilters({
  categories = [],
  showCategoryFilter = true,
  showPriceFilters = true,
  showSort = true,
  showSizeColourFilters = true,
  resultCount = 0,
  shownCount,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      size: searchParams.get('size') || '',
      colour: searchParams.get('colour') || '',
      sort: searchParams.get('sort') || 'newest',
    }),
    [searchParams],
  );

  function update(key, value) {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (showSort && values.sort && values.sort !== 'newest') {
      next.set('sort', values.sort);
    }
    setSearchParams(next, { replace: true });
  }

  const hasControls =
    showCategoryFilter || showPriceFilters || showSort || showSizeColourFilters;

  if (!hasControls) {
    return (
      <div className="listing-filters listing-filters-meta-only">
        <p>
          {typeof shownCount === 'number' && shownCount !== resultCount
            ? `${shownCount} shown of ${resultCount}`
            : resultCount}{' '}
          {resultCount === 1 ? 'matching piece' : 'matching pieces'}
        </p>
      </div>
    );
  }

  return (
    <form className="listing-filters" onSubmit={(event) => event.preventDefault()}>
      <div className="listing-filters-row">
        {showCategoryFilter && (
          <label>
            Category
            <select value={values.category} onChange={(event) => update('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {showPriceFilters && (
          <>
            <label>
              Min price (₦)
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={values.minPrice}
                onChange={(event) => update('minPrice', event.target.value)}
              />
            </label>

            <label>
              Max price (₦)
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Any"
                value={values.maxPrice}
                onChange={(event) => update('maxPrice', event.target.value)}
              />
            </label>
          </>
        )}

        {showSizeColourFilters && (
          <>
            <label>
              Size
              <select value={values.size} onChange={(event) => update('size', event.target.value)}>
                <option value="">All sizes</option>
                {values.size && <option value={values.size}>{values.size}</option>}
              </select>
              <span className="filter-hint">Use the options on each product card.</span>
            </label>

            <label>
              Colour
              <select value={values.colour} onChange={(event) => update('colour', event.target.value)}>
                <option value="">All colours</option>
                {values.colour && <option value={values.colour}>{values.colour}</option>}
              </select>
              <span className="filter-hint">Use the options on each product card.</span>
            </label>
          </>
        )}

        {showSort && (
          <label>
            Sort
            <select value={values.sort} onChange={(event) => update('sort', event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="listing-filters-meta">
        <p>
          {typeof shownCount === 'number' && shownCount !== resultCount
            ? `${shownCount} shown of ${resultCount}`
            : resultCount}{' '}
          {resultCount === 1 ? 'matching piece' : 'matching pieces'}
        </p>
        <button type="button" className="text-button" onClick={clearFilters}>
          Clear filters
        </button>
      </div>
    </form>
  );
}
