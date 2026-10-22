import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <span className="text-sm text-gray-600">Page {currentPage} of {pageCount}</span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function paginate<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageCount(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
