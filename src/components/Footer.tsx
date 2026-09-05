import { useRouter } from '@/context/RouterContext';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-bold text-ink-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white">
              <BookOpen size={18} />
            </span>
            <span className="font-serif">Inkwell</span>
          </button>
          <p className="text-sm text-ink-500">
            A place to read, write, and deepen your thinking.
          </p>
        </div>
      </div>
    </footer>
  );
}
