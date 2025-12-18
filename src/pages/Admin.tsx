import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download,
  Search,
  Crown,
  Users,
  Mail,
  Calendar,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  TrendingUp,
  Filter,
  Copy,
  Trash2
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  is_priority: boolean;
  stripe_customer_id: string | null;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'priority' | 'free'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'referrals'>('newest');

  const fetchEntries = async () => {
    try {
      let query = supabase
        .from('waitlist')
        .select('*');

      if (filterType === 'priority') {
        query = query.eq('is_priority', true);
      } else if (filterType === 'free') {
        query = query.eq('is_priority', false);
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'referrals') {
        query = query.order('referral_count', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch waitlist entries',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Waitlist data has been updated',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEntries(entries.filter(e => e.id !== id));
      toast({
        title: 'Deleted',
        description: 'Entry has been removed from the waitlist',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const filteredEntries = getFilteredEntries();
    const headers = ['Email', 'Type', 'Joined', 'Referral Code', 'Referrals', 'Stripe ID'];
    const rows = filteredEntries.map(entry => [
      entry.email,
      entry.is_priority ? 'Priority' : 'Free',
      new Date(entry.created_at).toLocaleDateString(),
      entry.referral_code,
      entry.referral_count.toString(),
      entry.stripe_customer_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exported',
      description: `${filteredEntries.length} entries exported to CSV`,
    });
  };

  const copyEmails = () => {
    const filteredEntries = getFilteredEntries();
    const emails = filteredEntries.map(e => e.email).join('\n');
    navigator.clipboard.writeText(emails);
    toast({
      title: 'Copied',
      description: `${filteredEntries.length} emails copied to clipboard`,
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      setLoading(true);
      fetchEntries().finally(() => setLoading(false));
    }
  }, [user, authLoading, filterType, sortBy]);

  const getFilteredEntries = () => {
    return entries.filter(entry =>
      entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredEntries = getFilteredEntries();
  const priorityCount = entries.filter(e => e.is_priority).length;
  const freeCount = entries.filter(e => !e.is_priority).length;
  const totalReferrals = entries.reduce((sum, e) => sum + e.referral_count, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading waitlist data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Waitlist Admin</h1>
              <p className="text-muted-foreground">Manage signups and export data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={copyEmails}>
              <Copy className="w-4 h-4" />
              Copy Emails
            </Button>
            <Button variant="glow" className="gap-2" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Signups</p>
                <p className="text-2xl font-bold text-foreground">{entries.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-amber-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority Members</p>
                <p className="text-2xl font-bold text-amber-400">{priorityCount}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Waitlist</p>
                <p className="text-2xl font-bold text-foreground">{freeCount}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold text-success">{totalReferrals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email or referral code..."
                className="pl-9 bg-muted border-border"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(v: 'all' | 'priority' | 'free') => setFilterType(v)}>
                <SelectTrigger className="w-40 bg-muted border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signups</SelectItem>
                  <SelectItem value="priority">Priority Only</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: 'newest' | 'oldest' | 'referrals') => setSortBy(v)}>
                <SelectTrigger className="w-40 bg-muted border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="referrals">Most Referrals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Referral Code</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Referrals</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{entry.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {entry.is_priority ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black gap-1">
                          <Crown className="w-3 h-3" />
                          Priority
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
                          {entry.referral_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?ref=${entry.referral_code}`);
                            toast({ title: 'Copied', description: 'Referral link copied' });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        <span className={`font-mono ${entry.referral_count > 0 ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                          {entry.referral_count}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {entries.length === 0 
                  ? 'No waitlist signups yet' 
                  : 'No entries match your search'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} entries
        </div>
      </main>
    </div>
  );
}
