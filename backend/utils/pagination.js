export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 48;
export const HOMEPAGE_CURATED_COUNT = 5;

export function readPagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  let pageSize = Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;

  if (!Number.isFinite(pageSize) || pageSize < 1) {
    pageSize = DEFAULT_PAGE_SIZE;
  }

  pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

export function buildPagination({ page, pageSize, total }) {
  const safeTotal = Number(total) || 0;
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / pageSize);

  return {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
    hasMore: page < totalPages,
    hasFixedQuota: false,
  };
}
