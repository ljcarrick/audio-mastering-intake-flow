import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function AuthNav() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-lg p-2 shadow-card">
      <div className="flex items-center gap-2 px-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{user.email}</span>
      </div>
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