import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Rocket, Loader2 } from 'lucide-react';

export default function CampaignCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [vibeDescription, setVibeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a campaign name.',
        variant: 'destructive',
      });
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast({
        title: 'Invalid Budget',
        description: 'Please enter a valid budget amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: name.trim(),
          total_budget: budgetNum,
          remaining_budget: budgetNum,
          vibe_description: vibeDescription.trim() || null,
          agency_user_id: user?.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Campaign Created',
        description: 'Your campaign has been created successfully.',
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Campaign</h1>
              <p className="text-muted-foreground">Launch a new influencer marketing campaign</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Product Launch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 10000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1"
                step="0.01"
                className="bg-muted border-border"
              />
              <p className="text-xs text-muted-foreground">
                This is the total amount you plan to spend on this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vibe">Vibe Description (Optional)</Label>
              <Textarea
                id="vibe"
                placeholder="Describe the aesthetic, tone, and style you're looking for..."
                value={vibeDescription}
                onChange={(e) => setVibeDescription(e.target.value)}
                maxLength={500}
                rows={4}
                className="bg-muted border-border resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Our AI will use this to find creators that match your brand vibe
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glow"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
