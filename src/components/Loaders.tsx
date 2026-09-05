import { classNames } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={classNames(
        'animate-spin rounded-full border-2 border-ink-200 border-t-accent-600',
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size="lg" />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-48 animate-pulse bg-ink-100" />
      <div className="p-5">
        <div className="mb-3 h-4 w-20 animate-pulse rounded bg-ink-100" />
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-ink-100" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-ink-100" />
        <div className="mt-4 flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-ink-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12 px-4 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
