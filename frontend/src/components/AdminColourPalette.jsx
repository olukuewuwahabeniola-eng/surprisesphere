import { useEffect, useMemo, useRef, useState } from 'react';
import { COLOUR_PALETTE_GROUPS, findPaletteColour } from '../data/adminProductOptions';

export default function AdminColourPalette({
  selected = [],
  disabled = false,
  onToggle,
  onAddCustom,
  label = 'Choose Colours',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#F1D58A');
  const [customError, setCustomError] = useState('');
  const rootRef = useRef(null);

  const selectedKeys = useMemo(
    () => new Set(selected.map((entry) => String(entry.label || '').trim().toLowerCase())),
    [selected],
  );

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return COLOUR_PALETTE_GROUPS;
    return COLOUR_PALETTE_GROUPS.map((group) => ({
      ...group,
      colours: group.colours.filter((colour) => colour.label.toLowerCase().includes(term)),
    })).filter((group) => group.colours.length > 0);
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

  function handleAddCustom(event) {
    event.preventDefault();
    const name = customName.trim();
    if (!name) {
      setCustomError('Enter a custom colour name.');
      return;
    }
    if (selectedKeys.has(name.toLowerCase())) {
      setCustomError('That colour is already selected.');
      return;
    }
    onAddCustom?.({ label: name, hex: customHex || findPaletteColour(name)?.hex || '#CFCFCF' });
    setCustomName('');
    setCustomHex('#F1D58A');
    setCustomError('');
  }

  return (
    <div className="admin-compact-picker" ref={rootRef}>
      <button
        type="button"
        className={`admin-compact-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="admin-compact-trigger-meta">
          {selected.length ? `${selected.length} selected` : 'Select colours'}
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </span>
      </button>

      {selected.length ? (
        <ul className="admin-choice-chips" aria-label="Selected colours">
          {selected.map((colour) => (
            <li key={colour.label}>
              <span
                className="admin-swatch"
                style={{ background: colour.hex || '#CFCFCF' }}
                aria-hidden="true"
              />
              <span>{colour.label}</span>
              <button
                type="button"
                className="admin-chip-remove"
                onClick={() => onToggle?.(colour)}
                disabled={disabled}
                aria-label={`Remove ${colour.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="admin-compact-panel" role="dialog" aria-label="Colour options">
          <div className="admin-compact-panel-toolbar">
            <label className="admin-field">
              <span>Search colours</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search black, wine, navy…"
                disabled={disabled}
              />
            </label>
            <button
              type="button"
              className="button button-wine button-rect"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>

          <div className="admin-palette-groups">
            {filteredGroups.map((group) => (
              <section key={group.id} className="admin-palette-group">
                <h4>{group.label}</h4>
                <div
                  className="admin-palette-swatches"
                  role="listbox"
                  aria-label={group.label}
                  aria-multiselectable="true"
                >
                  {group.colours.map((colour) => {
                    const selectedState = selectedKeys.has(colour.label.toLowerCase());
                    return (
                      <button
                        key={colour.label}
                        type="button"
                        role="option"
                        aria-selected={selectedState}
                        className={`admin-palette-swatch${selectedState ? ' is-selected' : ''}`}
                        title={colour.label}
                        style={{ background: colour.hex }}
                        disabled={disabled}
                        onClick={() => onToggle?.(colour)}
                      >
                        <span className="sr-only">{colour.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            {!filteredGroups.length ? <p className="admin-muted">No colours match that search.</p> : null}
          </div>

          <form className="admin-custom-colour" onSubmit={handleAddCustom}>
            <p className="admin-compact-panel-subtitle">Others / Add Custom Colour</p>
            <label className="admin-field">
              <span>Custom colour name</span>
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="e.g. Champagne Gold"
                disabled={disabled}
              />
            </label>
            <label className="admin-field">
              <span>Exact shade</span>
              <input
                type="color"
                value={customHex}
                onChange={(event) => setCustomHex(event.target.value)}
                disabled={disabled}
              />
            </label>
            <button type="submit" className="button button-wine button-rect" disabled={disabled}>
              Add colour
            </button>
            {customError ? (
              <p className="form-note admin-error" role="alert">
                {customError}
              </p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
