import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'لا توجد بيانات',
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="card loading-card">
        <Loader2 className="loading-spinner" />
        <span className="loading-text">جاري التحميل...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card empty-card">
        <p className="empty-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr className="table-header">
              {columns.map((column) => (
                <th key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="table-row">
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(item)
                      : (item as Record<string, unknown>)[column.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
