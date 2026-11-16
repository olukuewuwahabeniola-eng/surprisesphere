import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SIZE_OPTIONS, EXTRA_SIZES, NUMERIC_SIZES } from '../data/adminProductOptions';

export default function AdminSizeSelector({
  selected = [],
  disabled = false,
  title = 'Choose Sizes',
  help = 'Sizes are optional. Some products, such as handbags, may not need them.',
  onChange,
  onApplyToAll,
  showApplyToAll = false,
  chipLimit = 8,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [customError, setCustomError] = useState('');
  const rootRef = useRef(null);

  const selectedSet = useMemo(
    () => new Set(selected.map((entry) => String(entry).trim()).filter(Boolean)),
    [selected],
  );

  const filteredNumeric = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return NUMERIC_SIZES;
    return NUMERIC_SIZES.filter((size) => size.toLowerCase().includes(term));
  }, [query]);

  const filteredExtra = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return EXTRA_SIZES;
    return EXTRA_SIZES.filter((size) => size.toLowerCase().includes(term));
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

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
  }

  const visibleChips = selected.slice(0, chipLimit);
  const hiddenCount = Math.max(0, selected.length - visibleChips.length);

  return (
    <div className="admin-compact-picker" ref={rootRef}>
      <button
        type="button"
        className={`admin-compact-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="admin-compact-trigger-meta">
          {selected.length ? `${selected.length} selected` : 'Optional'}
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {help ? <p className="admin-compact-help">{help}</p> : null}

      {selected.length ? (
        <ul className="admin-choice-chips" aria-label="Selected sizes">
          {visibleChips.map((size) => (
            <li key={size}>
              <span>{size}</span>
              <button
                type="button"
                className="admin-chip-remove"
                onClick={() => toggle(size)}
                disabled={disabled}
                aria-label={`Remove size ${size}`}
              >
                ×
              </button>
            </li>
          ))}
          {hiddenCount > 0 ? <li className="admin-choice-chip-more">+{hiddenCount} more</li> : null}
        </ul>
      ) : null}

      {showApplyToAll ? (
        <button
          type="button"
          className="button button-wine button-rect admin-apply-sizes"
          onClick={onApplyToAll}
          disabled={disabled || !selected.length}
        >
          Apply Sizes to All Colours
        </button>
      ) : null}

      {open ? (
        <div className="admin-compact-panel" role="dialog" aria-label="Size options">
          <div className="admin-compact-panel-toolbar">
            <label className="admin-field">
              <span>Search sizes</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search 38, XL, One Size…"
                disabled={disabled}
              />
            </label>
            <button type="button" className="button button-wine button-rect" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>

          <h4>Numeric sizes</h4>
          <div className="admin-size-grid" role="listbox" aria-label="Numeric sizes" aria-multiselectable="true">
            {filteredNumeric.map((size) => {
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

          <h4>Letter & special sizes</h4>
          <div className="admin-size-grid" role="listbox" aria-label="Letter sizes" aria-multiselectable="true">
            {filteredExtra.map((size) => {
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

          <form className="admin-custom-size" onSubmit={addCustom}>
            <p className="admin-compact-panel-subtitle">Others / Add Custom Size</p>
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

          {selected.some((entry) => !DEFAULT_SIZE_OPTIONS.includes(String(entry))) ? (
            <p className="admin-muted">
              Custom sizes in use:{' '}
              {selected.filter((entry) => !DEFAULT_SIZE_OPTIONS.includes(String(entry))).join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
