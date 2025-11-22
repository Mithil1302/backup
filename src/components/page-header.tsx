import type { ReactNode } from 'react';

export function PageHeader({ title, children }: { title: string, children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
