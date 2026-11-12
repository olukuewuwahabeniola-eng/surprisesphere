import { useEffect } from 'react';

const SELECTOR = '[data-reveal]:not(.is-revealed)';

function isInViewport(node) {
  const rect = node.getBoundingClientRect();
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 40 && rect.top < viewHeight - 40;
}

export default function useScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const revealAll = () => {
      document.querySelectorAll('[data-reveal]').forEach((node) => {
        node.classList.add('is-revealed');
      });
    };

    if (reduce.matches) {
      revealAll();
      const onChange = () => {
        if (reduce.matches) {
          revealAll();
        }
      };
      reduce.addEventListener('change', onChange);
      return () => reduce.removeEventListener('change', onChange);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -4% 0px',
      },
    );

    const observeNew = () => {
      document.querySelectorAll(SELECTOR).forEach((node) => {
        if (isInViewport(node)) {
          node.classList.add('is-revealed');
          return;
        }
        observer.observe(node);
      });
    };

    observeNew();
    const raf = window.requestAnimationFrame(() => observeNew());

    const mutations = new MutationObserver(observeNew);
    mutations.observe(document.body, { childList: true, subtree: true });

    const onChange = () => {
      if (reduce.matches) {
        observer.disconnect();
        revealAll();
      }
    };
    reduce.addEventListener('change', onChange);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      mutations.disconnect();
      reduce.removeEventListener('change', onChange);
    };
  }, []);
}
