import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  getAdminHomepage,
  readError,
  saveAdminHeroSlides,
  uploadAdminImages,
} from '../services/api';
import { getStoredAdminKey } from '../utils/adminAuth';

function blankSlide(index = 0) {
  return {
    id: `slide-${Date.now()}-${index}`,
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    href: '/shop',
    image: '',
    alt: '',
    active: true,
    sortOrder: index,
  };
}

export default function AdminHeroSlidesPage() {
  const outlet = useOutletContext() || {};
  const adminKey = outlet.adminKey || getStoredAdminKey();
  const [slides, setSlides] = useState([]);
  const [library, setLibrary] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState('');

  const activeCount = useMemo(
    () => slides.filter((slide) => slide.active !== false).length,
    [slides],
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!adminKey) {
        setStatus('idle');
        return;
      }
      setStatus('loading');
      setError('');
      try {
        const data = await getAdminHomepage(adminKey);
        if (!alive) return;
        setSlides(
          (data.heroSlides || []).map((slide, index) => ({
            ...blankSlide(index),
            ...slide,
            sortOrder: slide.sortOrder ?? index,
          })),
        );
        setLibrary(data.imageLibrary || []);
        setStatus('ready');
      } catch (err) {
        if (!alive) return;
        setError(readError(err, 'Could not load hero slides.'));
        setStatus('error');
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [adminKey]);

  function patchSlide(id, patch) {
    setSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    );
  }

  function moveSlide(id, direction) {
    setSlides((current) => {
      const ordered = [...current].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = ordered.findIndex((slide) => slide.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return current;
      const next = [...ordered];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((slide, sortOrder) => ({ ...slide, sortOrder }));
    });
  }

  function addSlide() {
    setSlides((current) => [...current, blankSlide(current.length)]);
  }

  function removeSlide(id) {
    setSlides((current) =>
      current
        .filter((slide) => slide.id !== id)
        .map((slide, sortOrder) => ({ ...slide, sortOrder })),
    );
  }

  async function uploadForSlide(id, fileList) {
    const file = fileList?.[0];
    if (!file || !adminKey) return;
    setUploadingId(id);
    setError('');
    try {
      const result = await uploadAdminImages(adminKey, [file]);
      const url = result.images?.[0]?.url;
      if (!url) throw new Error('Upload did not return an image URL.');
      patchSlide(id, { image: url });
      setNote('Image uploaded. Save slides to publish.');
    } catch (err) {
      setError(readError(err, 'Could not upload hero image.'));
    } finally {
      setUploadingId('');
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!adminKey || busy) return;
    setBusy(true);
    setError('');
    setNote('');
    try {
      const payload = slides.map((slide, index) => ({
        ...slide,
        title: String(slide.title || '').trim(),
        image: String(slide.image || '').trim(),
        sortOrder: index,
      }));
      if (payload.some((slide) => !slide.title || !slide.image)) {
        throw new Error('Every slide needs a title and an image.');
      }
      const result = await saveAdminHeroSlides(adminKey, payload);
      setSlides(result.heroSlides || payload);
      setNote(
        `Saved ${result.heroSlides?.length || payload.length} slides (${result.activeCount || 0} active on the homepage).`,
      );
    } catch (err) {
      setError(readError(err, 'Could not save hero slides.'));
    } finally {
      setBusy(false);
    }
  }

  if (!adminKey) {
    return (
      <div className="admin-dashboard">
        <h1>Hero Slides</h1>
        <p>Unlock admin to manage homepage hero slides.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-head">
        <div>
          <h1>Hero Slides</h1>
          <p>
            Manage the homepage slideshow through HomepageContent. Only active slides appear on the
            storefront. Product uploads never become hero slides automatically — pick a library image
            or upload one here.
          </p>
        </div>
        <div className="admin-quick-actions">
          <Link to="/">View homepage</Link>
          <button type="button" className="button button-wine button-rect" onClick={addSlide}>
            Add slide
          </button>
        </div>
      </div>

      {error ? (
        <p className="form-note admin-error" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p className="form-note" role="status">
          {note}
        </p>
      ) : null}

      {status === 'loading' ? <p>Loading hero slides…</p> : null}

      <form className="admin-panel" onSubmit={handleSave}>
        <p className="admin-loading">
          {slides.length} slides · {activeCount} active on homepage
        </p>

        <div className="admin-hero-slide-list">
          {slides
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((slide, index) => (
              <article key={slide.id} className="admin-hero-slide-card">
                <div className="admin-hero-slide-preview">
                  {slide.image ? (
                    <img src={slide.image} alt="" />
                  ) : (
                    <div className="admin-upload-preview-empty">No image</div>
                  )}
                </div>

                <div className="admin-hero-slide-fields">
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Headline</span>
                      <textarea
                        rows={2}
                        value={slide.title}
                        onChange={(event) => patchSlide(slide.id, { title: event.target.value })}
                        placeholder={'BEAUTY,\nREIMAGINED.'}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Supporting text</span>
                      <textarea
                        rows={2}
                        value={slide.subtitle}
                        onChange={(event) => patchSlide(slide.id, { subtitle: event.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Button label</span>
                      <input
                        value={slide.cta}
                        onChange={(event) => patchSlide(slide.id, { cta: event.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Button destination</span>
                      <input
                        value={slide.href}
                        onChange={(event) => patchSlide(slide.id, { href: event.target.value })}
                        placeholder="/shop/slides"
                      />
                    </label>
                    <label className="admin-field">
                      <span>Image URL</span>
                      <input
                        value={slide.image}
                        onChange={(event) => patchSlide(slide.id, { image: event.target.value })}
                        placeholder="/images/surprise/… or Cloudinary URL"
                      />
                    </label>
                    <label className="admin-field">
                      <span>Image alt text</span>
                      <input
                        value={slide.alt}
                        onChange={(event) => patchSlide(slide.id, { alt: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="admin-check-row">
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={slide.active !== false}
                        onChange={(event) =>
                          patchSlide(slide.id, { active: event.target.checked })
                        }
                      />
                      Active on homepage
                    </label>
                  </div>

                  <div className="admin-form-actions">
                    <label className="button button-wine button-rect">
                      {uploadingId === slide.id ? 'Uploading…' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={busy || uploadingId === slide.id}
                        onChange={(event) => {
                          uploadForSlide(slide.id, event.target.files);
                          event.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-wine button-rect"
                      onClick={() => moveSlide(slide.id, -1)}
                      disabled={index === 0}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="button button-wine button-rect"
                      onClick={() => moveSlide(slide.id, 1)}
                      disabled={index >= slides.length - 1}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="button button-wine button-rect"
                      onClick={() => removeSlide(slide.id)}
                    >
                      Remove
                    </button>
                  </div>

                  {library.length ? (
                    <div className="admin-hero-library">
                      <p className="eyebrow">Fashion library</p>
                      <div className="admin-hero-library-grid">
                        {library.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            className={`admin-hero-library-item${
                              slide.image === entry.url ? ' is-selected' : ''
                            }`}
                            onClick={() =>
                              patchSlide(slide.id, {
                                image: entry.url,
                                alt: entry.alt || slide.alt,
                              })
                            }
                            title={entry.alt}
                          >
                            <img src={entry.url} alt="" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="button button-wine button-rect" disabled={busy}>
            {busy ? 'Saving…' : 'Save hero slides'}
          </button>
        </div>
      </form>
    </div>
  );
}
