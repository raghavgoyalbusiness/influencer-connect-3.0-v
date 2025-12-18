import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WaitlistNotification } from '@/components/WaitlistNotification';
import AgencyDashboard from './AgencyDashboard';
import CreatorPortal from './CreatorPortal';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Users,
  Gift,
  Phone,
  Loader2,
  Mail
} from 'lucide-react';

export default function Index() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [freeEmail, setFreeEmail] = useState('');
  const [priorityEmail, setPriorityEmail] = useState('');
  const [submittingFree, setSubmittingFree] = useState(false);
  const [submittingPriority, setSubmittingPriority] = useState(false);
  const [referralCode] = useState(() => searchParams.get('ref') || '');

  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      toast({
        title: 'Checkout Cancelled',
        description: 'No worries! Join the free waitlist anytime.',
      });
    }
  }, [searchParams, toast]);

  const handleFreeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeEmail) return;

    setSubmittingFree(true);
    try {
      const { data, error } = await supabase.functions.invoke('waitlist-signup', {
        body: { email: freeEmail, isPriority: false, referredBy: referralCode },
      });

      if (error) throw error;

      if (data.alreadyExists) {
        toast({
          title: 'Already on the list!',
          description: 'You are already on our waitlist. Check your email for updates.',
        });
      } else {
        navigate(`/thank-you?type=free&email=${encodeURIComponent(freeEmail)}&code=${data.entry?.referral_code || ''}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to join waitlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingFree(false);
    }
  };

  const handlePriorityCheckout = async () => {
    if (!priorityEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email to continue.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingPriority(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-priority-checkout', {
        body: { email: priorityEmail },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      setSubmittingPriority(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    if (role === 'creator') {
      return <CreatorPortal />;
    }
    return <AgencyDashboard />;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      {/* Floating Notification */}
      <WaitlistNotification />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Flux AI</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-12 md:py-20">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-6 gap-2">
            <Sparkles className="w-3 h-3" />
            AI-Powered Influencer Marketing
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            The Future of
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Creator Marketing
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Flux AI uses computer vision and real-time analytics to match brands with 
            perfect creators. Join 5,000+ agencies on our waitlist.
          </p>
        </div>

        {/* Dual-Path Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Free Path */}
          <div className="glass-card p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Free Waitlist</h3>
                <p className="text-sm text-muted-foreground">Join 5,000+ others</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Early access when we launch</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Weekly product updates</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Referral rewards program</span>
              </li>
            </ul>

            <form onSubmit={handleFreeSignup} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={freeEmail}
                  onChange={(e) => setFreeEmail(e.target.value)}
                  className="pl-10 bg-muted border-border"
                  required
                />
              </div>
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full gap-2"
                disabled={submittingFree}
              >
                {submittingFree ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Join the Free Waitlist
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Priority Path - Golden Border */}
          <div className="relative group">
            {/* Golden Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
            
            <div className="relative glass-card p-8 flex flex-col bg-card border-2 border-amber-400/50">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold gap-1 px-4 py-1">
                  <Star className="w-3 h-3" />
                  MOST POPULAR
                </Badge>
              </div>

              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Priority Founding Member</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-400">$49</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-start gap-2 text-foreground">
                  <Gift className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Skip the 5,000+ person queue</strong></span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span><strong>3 months of Flux Pro free</strong> at launch</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Founding Member badge</strong> on your profile</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Phone className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Private 1-on-1 strategy call</strong> with our founders</span>
                </li>
              </ul>

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={priorityEmail}
                    onChange={(e) => setPriorityEmail(e.target.value)}
                    className="pl-10 bg-muted border-amber-400/30 focus:border-amber-400"
                    required
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handlePriorityCheckout}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-semibold"
                  disabled={submittingPriority}
                >
                  {submittingPriority ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Become a Founding Member
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Only 12 Founding Member spots remaining
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <p className="text-muted-foreground mb-4">Trusted by marketing teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            <span className="text-xl font-bold text-foreground">Nike</span>
            <span className="text-xl font-bold text-foreground">Adidas</span>
            <span className="text-xl font-bold text-foreground">Spotify</span>
            <span className="text-xl font-bold text-foreground">Netflix</span>
            <span className="text-xl font-bold text-foreground">Adobe</span>
          </div>
        </div>
      </main>
    </div>
  );
}
