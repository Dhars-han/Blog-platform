import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import Avatar from './Avatar';
import { Menu, X, PenSquare, LogOut, User as UserIcon, FileText, BookOpen } from 'lucide-react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { navigate, route } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [route.path]);

  const navLinks = [
    { label: 'Blog', path: '/' },
    { label: 'My Posts', path: '/my-posts', auth: true },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-ink-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white">
            <BookOpen size={20} />
          </span>
          <span className="font-serif">Inkwell</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .filter((l) => !l.auth || user)
            .map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  route.path === link.path
                    ? 'bg-ink-100 text-ink-900'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {link.label}
              </button>
            ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                onClick={() => navigate('/posts/new')}
                className="btn-accent"
              >
                <PenSquare size={16} />
                Write
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-2 rounded-lg p-1 pr-3 hover:bg-ink-100 transition-colors"
                >
                  <Avatar name={profile?.name || user.email || ''} url={profile?.avatar_url} size="sm" />
                  <span className="text-sm font-medium text-ink-700 max-w-[120px] truncate">
                    {profile?.name || user.email}
                  </span>
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="btn-ghost"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost">
                Sign in
              </button>
              <button onClick={() => navigate('/signup')} className="btn-primary">
                Get started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="animate-slide-down border-t border-ink-100 bg-white md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks
              .filter((l) => !l.auth || user)
              .map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  {link.label}
                </button>
              ))}
            {user ? (
              <>
                <button
                  onClick={() => navigate('/posts/new')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  <PenSquare size={16} /> Write a post
                </button>
                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  <UserIcon size={16} /> Profile
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => navigate('/login')} className="btn-secondary w-full">
                  Sign in
                </button>
                <button onClick={() => navigate('/signup')} className="btn-primary w-full">
                  Get started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
