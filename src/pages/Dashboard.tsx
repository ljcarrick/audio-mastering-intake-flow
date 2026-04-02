import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AuthNav } from '@/components/AuthNav';
import { ArrowLeft, ExternalLink, Zap, UserPlus } from 'lucide-react';

type Status = 'new' | 'in_progress' | 'delivered' | 'revision';

interface Track { id: string; title: string; isrc?: string; }
interface MixFile { url: string; description: string; }
interface Contact { id: string; name: string; email: string; phone: string; role: string; billTo: boolean; }
interface BillingInfo { name: string; email: string; company: string; }

interface Submission {
  id: string;
  artist: string;
  project_title: string | null;
  project_type: string;
  num_tracks: number;
  tracks: Track[];
  mix_files: MixFile[];
  has_isrcs: boolean;
  deadline: string | null;
  is_rush: boolean;
  contacts: Contact[];
  billing_info: BillingInfo;
  master_formats: string[];
  extra_passes: string[];
  project_notes: string | null;
  email_sent: boolean;
  submitted_at: string;
  status: Status;
}

const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  revision: 'Revision',
};

const STATUS_COLORS: Record<Status, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  revision: 'bg-orange-100 text-orange-800',
};

function formatISRC(isrc: string) {
  if (!isrc || isrc.length < 12) return isrc;
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`;
}

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      toast({ title: 'Failed to load submissions', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setSubmissions(data as unknown as Submission[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from('intake_submissions')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
      return;
    }

    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (data.error) {
      toast({ title: 'Invite failed', description: data.error, variant: 'destructive' });
    } else {
      toast({ title: `Invite sent to ${inviteEmail}` });
      setInviteEmail('');
      setShowInvite(false);
    }
    setInviting(false);
  };

  const counts = {
    new: submissions.filter(s => s.status === 'new').length,
    in_progress: submissions.filter(s => s.status === 'in_progress').length,
    revision: submissions.filter(s => s.status === 'revision').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // Detail view
  if (selected) {
    const s = selected;
    return (
      <div className="min-h-screen bg-background">
        <AuthNav />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Submissions
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Status</span>
              <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v as Status)}>
                <SelectTrigger className="w-36 border-gray-300 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as Status[]).map(status => (
                    <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-medium text-black">
                {s.artist}{s.project_title ? ` — ${s.project_title}` : ''}
              </h1>
              {s.is_rush && (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                  <Zap className="h-3 w-3" /> RUSH
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {s.project_type.toUpperCase()} · {s.num_tracks} track{s.num_tracks !== 1 ? 's' : ''} · Submitted {new Date(s.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track List */}
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Track List</h2>
              <div className="space-y-2">
                {s.tracks.map((track, i) => (
                  <div key={track.id} className="flex items-start gap-2">
                    <span className="text-gray-400 text-sm w-5 shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-sm text-black">{track.title}</p>
                      {track.isrc && <p className="text-xs text-gray-400">{formatISRC(track.isrc)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline & Formats */}
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline & Formats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="text-black">{s.deadline ? new Date(s.deadline + 'T00:00:00').toLocaleDateString() : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority</span>
                  <span className={s.is_rush ? 'text-red-600 font-medium' : 'text-black'}>{s.is_rush ? 'Rush' : 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ISRCs</span>
                  <span className="text-black">{s.has_isrcs ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Master Formats</p>
                <div className="flex flex-wrap gap-1">
                  {s.master_formats.map(f => (
                    <span key={f} className="bg-black text-white text-xs px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              {s.extra_passes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Extra Passes</p>
                  <div className="flex flex-wrap gap-1">
                    {s.extra_passes.map(p => (
                      <span key={p} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Files */}
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Files</h2>
              <div className="space-y-2">
                {s.mix_files.filter(f => f.url).map((file, i) => (
                  <div key={i}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      {file.url.includes('dropbox') ? 'Dropbox' : file.url.includes('drive.google') ? 'Google Drive' : file.url.includes('wetransfer') ? 'WeTransfer' : `File ${i + 1}`}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {file.description && <p className="text-xs text-gray-400">{file.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacts</h2>
              <div className="space-y-3">
                {s.contacts.filter(c => c.name || c.email).map(c => (
                  <div key={c.id}>
                    <p className="text-sm font-medium text-black">{c.name} {c.billTo && <span className="text-xs text-gray-400">(billing)</span>}</p>
                    {c.email && <a href={`mailto:${c.email}`} className="text-sm text-blue-600 hover:underline">{c.email}</a>}
                    {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                    {c.role && <p className="text-xs text-gray-400 capitalize">{c.role}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Billing */}
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Billing</h2>
              <div className="space-y-1 text-sm">
                <p className="text-black">{s.billing_info.name || '—'}</p>
                {s.billing_info.email && <a href={`mailto:${s.billing_info.email}`} className="text-blue-600 hover:underline">{s.billing_info.email}</a>}
                {s.billing_info.company && <p className="text-gray-500">{s.billing_info.company}</p>}
              </div>
            </div>

            {/* Notes */}
            {s.project_notes && (
              <div className="bg-white border border-gray-200 rounded-sm p-5 md:col-span-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</h2>
                <p className="text-sm text-black whitespace-pre-wrap">{s.project_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <AuthNav />
      <div className="max-w-5xl mx-auto py-12 px-4">
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Invite Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Client email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="client@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">They'll receive an invite link valid for 24 hours.</p>
              <Button type="submit" className="w-full" disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-black">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} total submission{submissions.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
          <div className="flex gap-4 text-sm">
            {counts.new > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {counts.new} new
              </span>
            )}
            {counts.in_progress > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                {counts.in_progress} in progress
              </span>
            )}
            {counts.revision > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                {counts.revision} revision
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setShowInvite(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Client
          </Button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
            <p className="text-gray-400 text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artist / Project</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Submitted</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black">{s.artist}</span>
                        {s.is_rush && <Zap className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                      </div>
                      {s.project_title && <p className="text-xs text-gray-400">{s.project_title}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {s.project_type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{s.num_tracks}tr</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v as Status)}>
                        <SelectTrigger className={`w-32 border-0 rounded-full text-xs font-medium h-7 ${STATUS_COLORS[s.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as Status[]).map(status => (
                            <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                        View →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
