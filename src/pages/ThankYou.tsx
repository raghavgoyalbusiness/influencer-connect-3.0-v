import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Crown, 
  Share2, 
  Copy, 
  Sparkles,
  ArrowRight,
  Gift,
  Zap,
  Star,
  Phone,
  Users,
  Loader2
} from 'lucide-react';

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const type = searchParams.get('type') || 'free';
  const email = searchParams.get('email') || '';
  const referralCode = searchParams.get('code') || '';
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<number | null>(null);
  const [actualReferralCode, setActualReferralCode] = useState(referralCode);
  const isPriority = type === 'priority';

  useEffect(() => {
    const processSignup = async () => {
      if (isPriority && sessionId && email) {
        // Record priority signup after successful payment
        try {
          const { data, error } = await supabase.functions.invoke('waitlist-signup', {
            body: { 
              email, 
              isPriority: true,
              stripePaymentIntentId: sessionId,
            },
          });
          
          if (!error && data?.entry) {
            setActualReferralCode(data.entry.referral_code);
            // Generate random position between 1-50 for priority
            setPosition(Math.floor(Math.random() * 50) + 1);
            
            // Send welcome email to priority members
            const firstName = email.split('@')[0].split('.')[0];
            await supabase.functions.invoke('send-priority-welcome-email', {
              body: { 
                email, 
                firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
              },
            });
          }
        } catch (err) {
          console.error('Error processing signup:', err);
        }
      } else if (!isPriority && email) {
        // For free signups, calculate actual position
        try {
          const { data } = await supabase
            .from('waitlist')
            .select('id, referral_code, created_at')
            .eq('email', email)
            .maybeSingle();
          
          if (data) {
            setActualReferralCode(data.referral_code);
            // Count entries before this one
            const { count } = await supabase
              .from('waitlist')
              .select('*', { count: 'exact', head: true })
              .lt('created_at', data.created_at);
            setPosition((count || 0) + 51); // Free users start at position 51+
          }
        } catch (err) {
          console.error('Error fetching position:', err);
        }
      }
      setLoading(false);
    };

    processSignup();
  }, [isPriority, sessionId, email]);

  const referralLink = `${window.location.origin}/?ref=${actualReferralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `Just joined the Influencer Connect waitlist! 🚀 The future of AI-powered influencer marketing is here. Skip the line with my referral link:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      {isPriority && (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl" />
        </>
      )}

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          {isPriority ? (
            /* Priority Thank You */
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center mx-auto">
                  <Crown className="w-12 h-12 text-black" />
                </div>
              </div>

              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold gap-1 px-4 py-1 mb-4">
                <Star className="w-3 h-3" />
                FOUNDING MEMBER
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Welcome to the Inner Circle!
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                You are now a Founding Member. Your exclusive benefits are locked in.
              </p>

              {/* Position Card */}
              <div className="glass-card p-6 mb-8 border-amber-400/30">
                <p className="text-sm text-muted-foreground mb-2">Your Waitlist Position</p>
                <p className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-2">
                  #{position}
                </p>
                <p className="text-sm text-amber-400 font-medium">Priority Access Guaranteed</p>
              </div>

              {/* Benefits Reminder */}
              <div className="glass-card p-6 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  Your Founding Member Benefits
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>3 months of Influencer Connect Pro free at launch</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>Founding Member badge on profile</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>1-on-1 strategy call with founders</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Check your inbox at <span className="text-foreground font-medium">{email}</span> for confirmation
              </p>

              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          ) : (
            /* Free Thank You */
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                You are on the list!
              </h1>

              <p className="text-lg text-muted-foreground mb-2">
                Your current position
              </p>
              
              <p className="text-5xl font-bold text-foreground mb-8">
                #{position?.toLocaleString() || '5,000+'}
              </p>

              {/* Referral Section */}
              <div className="glass-card p-6 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Want to move up the list?</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  For every agency friend you refer, <span className="text-primary font-semibold">you jump 50 spots!</span>
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground truncate"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={shareOnTwitter}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={shareOnLinkedIn}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </Button>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="glass-card p-6 border-amber-400/30 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-foreground">Skip the line entirely?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Become a Founding Member for $49 and get priority access plus exclusive perks.
                </p>
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-semibold"
                  onClick={() => navigate('/')}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Priority
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
