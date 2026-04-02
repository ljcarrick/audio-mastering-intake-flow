import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Music, MailCheck } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.email === import.meta.env.VITE_ADMIN_EMAIL ? '/dashboard' : '/');
    }
  }, [user, navigate]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast({ title: 'Failed to send link', description: error.message, variant: 'destructive' });
    } else {
      setEmailSent(true);
    }
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-primary rounded-full">
                <MailCheck className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to <strong>{email}</strong>.<br />
              Click it to access the form — no password needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button
              onClick={() => setEmailSent(false)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Use a different email
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-full">
              <Music className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">LC Mastering</CardTitle>
          <CardDescription>Enter your email to receive a sign-in link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send sign-in link'}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Access is by invitation only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
