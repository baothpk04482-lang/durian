import type { BaseService } from "../services/base.service";

const PAGE_SIZE = 100;

type PaginatedArray<T> = T[] & { total?: number; total_pages?: number };

export async function loadAllPages<T>(
  service: BaseService<T>,
): Promise<T[]> {
  const firstPage = await service.get<PaginatedArray<T>>({
    params: { page: 1, per_page: PAGE_SIZE },
  });

  const total = firstPage.total ?? firstPage.length;
  if (total <= firstPage.length) return [...firstPage];

  const totalPages = firstPage.total_pages ?? Math.ceil(total / PAGE_SIZE);
  const pagePromises: Promise<PaginatedArray<T>>[] = [];
  for (let p = 2; p <= totalPages; p++) {
    pagePromises.push(
      service
        .get<PaginatedArray<T>>({ params: { page: p, per_page: PAGE_SIZE } })
        .catch(() => [] as unknown as PaginatedArray<T>),
    );
  }
  const restPages = await Promise.all(pagePromises);
  const all: T[] = [...firstPage];
  for (const page of restPages) {
    all.push(...page);
  }
  return all;
}
