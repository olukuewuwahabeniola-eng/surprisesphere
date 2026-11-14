import { useMemo, useState } from 'react';
import { COLOUR_PALETTE_GROUPS, findPaletteColour } from '../data/adminProductOptions';

export default function AdminColourPalette({
  selected = [],
  disabled = false,
  onToggle,
  onAddCustom,
}) {
  const [query, setQuery] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#F1D58A');
  const [customError, setCustomError] = useState('');

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

  function handleAddCustom(event) {
    event.preventDefault();
    const label = customName.trim();
    if (!label) {
      setCustomError('Enter a custom colour name.');
      return;
    }
    if (selectedKeys.has(label.toLowerCase()) || findPaletteColour(label)) {
      // Still allow adding palette colour via custom if not selected; block only duplicates in selection
    }
    if (selectedKeys.has(label.toLowerCase())) {
      setCustomError('That colour is already selected.');
      return;
    }
    onAddCustom?.({ label, hex: customHex || '#CFCFCF' });
    setCustomName('');
    setCustomHex('#F1D58A');
    setCustomError('');
    setCustomOpen(false);
  }

  return (
    <div className="admin-palette">
      <div className="admin-palette-toolbar">
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
          onClick={() => setCustomOpen((open) => !open)}
          disabled={disabled}
        >
          {customOpen ? 'Close custom colour' : 'Add Custom Colour'}
        </button>
      </div>

      {customOpen ? (
        <form className="admin-custom-colour" onSubmit={handleAddCustom}>
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
      ) : null}

      {selected.length ? (
        <div className="admin-selected-summary" aria-label="Selected colours">
          <p>Selected colours ({selected.length})</p>
          <ul>
            {selected.map((colour) => (
              <li key={colour.label}>
                <span
                  className="admin-swatch"
                  style={{ background: colour.hex || '#CFCFCF' }}
                  aria-hidden="true"
                />
                <strong>{colour.label}</strong>
                <button
                  type="button"
                  className="text-button admin-danger"
                  onClick={() => onToggle?.(colour)}
                  disabled={disabled}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="admin-muted">Select one or more colours below. Multiple selections stay active.</p>
      )}

      <div className="admin-palette-groups">
        {filteredGroups.map((group) => (
          <section key={group.id} className="admin-palette-group">
            <h4>{group.label}</h4>
            <div className="admin-palette-swatches" role="listbox" aria-label={group.label} aria-multiselectable="true">
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
    </div>
  );
}
