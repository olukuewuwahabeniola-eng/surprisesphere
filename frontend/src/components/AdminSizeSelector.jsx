import { useMemo, useState } from 'react';
import { DEFAULT_SIZE_OPTIONS, EXTRA_SIZES, NUMERIC_SIZES } from '../data/adminProductOptions';

export default function AdminSizeSelector({
  selected = [],
  disabled = false,
  title = 'Sizes',
  help = 'Select every available size. Sizes are optional for products that do not need them.',
  onChange,
  onApplyToAll,
  showApplyToAll = false,
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customSize, setCustomSize] = useState('');
  const [customError, setCustomError] = useState('');
  const [extraOpen, setExtraOpen] = useState(false);

  const selectedSet = useMemo(
    () => new Set(selected.map((entry) => String(entry).trim()).filter(Boolean)),
    [selected],
  );

  const customSelected = useMemo(
    () => selected.filter((entry) => !DEFAULT_SIZE_OPTIONS.includes(String(entry))),
    [selected],
  );

  function toggle(size) {
    const value = String(size).trim();
    if (!value) return;
    if (selectedSet.has(value)) {
      onChange?.(selected.filter((entry) => entry !== value));
      return;
    }
    onChange?.([...selected, value]);
  }

  function addCustom(event) {
    event.preventDefault();
    const value = customSize.trim();
    if (!value) {
      setCustomError('Enter a custom size.');
      return;
    }
    if (selectedSet.has(value)) {
      setCustomError('That size is already selected.');
      return;
    }
    onChange?.([...selected, value]);
    setCustomSize('');
    setCustomError('');
    setCustomOpen(false);
  }

  return (
    <div className="admin-size-selector">
      <div className="admin-size-selector-head">
        <div>
          <h4>{title}</h4>
          <p>{help}</p>
        </div>
        <div className="admin-size-selector-actions">
          {showApplyToAll ? (
            <button
              type="button"
              className="button button-wine button-rect"
              onClick={onApplyToAll}
              disabled={disabled || !selected.length}
            >
              Apply sizes to all colours
            </button>
          ) : null}
          <button
            type="button"
            className="button button-wine button-rect"
            onClick={() => setExtraOpen((open) => !open)}
            disabled={disabled}
          >
            {extraOpen ? 'Hide letter sizes' : 'Show letter sizes'}
          </button>
          <button
            type="button"
            className="button button-wine button-rect"
            onClick={() => setCustomOpen((open) => !open)}
            disabled={disabled}
          >
            {customOpen ? 'Close custom size' : 'Add Custom Size'}
          </button>
        </div>
      </div>

      {selected.length ? (
        <div className="admin-selected-summary" aria-label="Selected sizes">
          <p>Selected sizes ({selected.length})</p>
          <ul>
            {selected.map((size) => (
              <li key={size}>
                <strong>{size}</strong>
                <button
                  type="button"
                  className="text-button admin-danger"
                  onClick={() => toggle(size)}
                  disabled={disabled}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="admin-muted">No sizes selected yet.</p>
      )}

      {customOpen ? (
        <form className="admin-custom-size" onSubmit={addCustom}>
          <label className="admin-field">
            <span>Custom size</span>
            <input
              value={customSize}
              onChange={(event) => setCustomSize(event.target.value)}
              placeholder="e.g. 48, 2XL, 40 EU"
              disabled={disabled}
            />
          </label>
          <button type="submit" className="button button-wine button-rect" disabled={disabled}>
            Add size
          </button>
          {customError ? (
            <p className="form-note admin-error" role="alert">
              {customError}
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="admin-size-grid" role="listbox" aria-label="Numeric sizes" aria-multiselectable="true">
        {NUMERIC_SIZES.map((size) => {
          const active = selectedSet.has(size);
          return (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={active}
              className={`admin-size-chip${active ? ' is-selected' : ''}`}
              onClick={() => toggle(size)}
              disabled={disabled}
            >
              {size}
            </button>
          );
        })}
      </div>

      {extraOpen ? (
        <div className="admin-size-grid" role="listbox" aria-label="Letter sizes" aria-multiselectable="true">
          {EXTRA_SIZES.map((size) => {
            const active = selectedSet.has(size);
            return (
              <button
                key={size}
                type="button"
                role="option"
                aria-selected={active}
                className={`admin-size-chip${active ? ' is-selected' : ''}`}
                onClick={() => toggle(size)}
                disabled={disabled}
              >
                {size}
              </button>
            );
          })}
        </div>
      ) : null}

      {customSelected.length ? (
        <p className="admin-muted">Custom sizes in use: {customSelected.join(', ')}</p>
      ) : null}
    </div>
  );
}
