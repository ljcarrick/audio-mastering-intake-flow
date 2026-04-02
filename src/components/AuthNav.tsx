import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function AuthNav() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-lg p-2 shadow-card">
      {isAdmin && (
        <Button variant="ghost" size="sm" asChild>
          <Link to={location.pathname === '/dashboard' ? '/' : '/dashboard'} className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {location.pathname === '/dashboard' ? 'Form' : 'Dashboard'}
          </Link>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}