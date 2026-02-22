export interface PageParams {
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export function paginate<T>(items: T[], params: PageParams): PageResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const start = (page - 1) * limit;
  return {
    total: items.length,
    page,
    limit,
    data: items.slice(start, start + limit),
  };
}
