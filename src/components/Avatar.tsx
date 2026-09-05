import { getInitials } from '@/lib/utils';
import { classNames } from '@/lib/utils';

interface AvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

export default function Avatar({ name, url, size = 'md' }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={classNames(
          'rounded-full object-cover ring-2 ring-white shadow-sm',
          sizeClasses[size]
        )}
      />
    );
  }
  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 font-semibold text-white ring-2 ring-white shadow-sm',
        sizeClasses[size]
      )}
    >
      {getInitials(name)}
    </div>
  );
}
