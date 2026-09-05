import { AuthProvider } from '@/context/AuthContext';
import { RouterProvider, useRouter, matchRoute } from '@/context/RouterContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import BlogFeed from '@/pages/BlogFeed';
import PostDetail from '@/pages/PostDetail';
import PostEditor from '@/pages/PostEditor';
import MyPosts from '@/pages/MyPosts';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import UserProfile from '@/pages/UserProfile';
import { FullPageLoader } from '@/components/Loaders';
import { useAuth } from '@/context/AuthContext';

function Routes() {
  const { route } = useRouter();
  const { loading } = useAuth();
  const path = route.path;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <FullPageLoader label="Loading..." />
      </div>
    );
  }

  // Match routes in order of specificity
  const routes = [
    { pattern: '/', component: () => <BlogFeed /> },
    { pattern: '/login', component: () => <Login /> },
    { pattern: '/signup', component: () => <SignUp /> },
    { pattern: '/posts/new', component: () => <ProtectedRoute><PostEditor /></ProtectedRoute> },
    { pattern: '/posts/:slug', component: (params: Record<string, string>) => <PostDetail slug={params.slug} /> },
    { pattern: '/posts/:id/edit', component: (params: Record<string, string>) => <ProtectedRoute><PostEditor postId={params.id} /></ProtectedRoute> },
    { pattern: '/my-posts', component: () => <ProtectedRoute><MyPosts /></ProtectedRoute> },
    { pattern: '/profile/:userId', component: (params: Record<string, string>) => <UserProfile userId={params.userId} /> },
  ];

  for (const r of routes) {
    const { match, params } = matchRoute(r.pattern, path);
    if (match) {
      return r.component(params);
    }
  }

  // 404
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-serif text-4xl font-bold text-ink-900">404</h1>
      <p className="mt-2 text-ink-500">This page doesn't exist.</p>
      <button onClick={() => (window.location.hash = '/')} className="btn-primary mt-6">
        Back to blog
      </button>
    </div>
  );
}

function AppContent() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header />
      <main className="flex-1">
        <Routes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
