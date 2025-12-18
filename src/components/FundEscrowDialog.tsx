import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Shield, Users, CreditCard } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
}

interface Creator {
  id: string;
  name: string;
  handle: string;
}

interface FundEscrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  creators?: Creator[];
  preselectedCampaignId?: string;
  preselectedCreatorId?: string;
}

export function FundEscrowDialog({
  open,
  onOpenChange,
  campaigns,
  creators = [],
  preselectedCampaignId,
  preselectedCreatorId,
}: FundEscrowDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(preselectedCampaignId || '');
  const [selectedCreator, setSelectedCreator] = useState(preselectedCreatorId || 'all');
  const [amount, setAmount] = useState('');

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);
  const selectedCreatorData = creators.find(c => c.id === selectedCreator);

  const handleFundEscrow = async () => {
    if (!selectedCampaign || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a campaign and enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-escrow-checkout', {
        body: {
          campaignId: selectedCampaign,
          campaignName: selectedCampaignData?.name,
          creatorId: selectedCreator === 'all' ? null : selectedCreator,
          creatorName: selectedCreatorData?.name,
          amount: parseFloat(amount),
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Checkout Opened',
          description: 'Complete your payment in the new tab',
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            Fund Campaign Escrow
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add funds to secure creator payments for your campaign. Funds will be held in escrow until milestones are met.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campaign Selection */}
          <div className="space-y-2">
            <Label htmlFor="campaign" className="text-foreground">Campaign</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger id="campaign" className="bg-muted border-border">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ${campaign.remaining_budget.toLocaleString()} remaining
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Creator Selection */}
          {creators.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="creator" className="text-foreground">Creator (Optional)</Label>
              <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                <SelectTrigger id="creator" className="bg-muted border-border">
                  <SelectValue placeholder="All campaign creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>All campaign creators</span>
                    </div>
                  </SelectItem>
                  {creators.map(creator => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name} (@{creator.handle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave as "All" to split funds evenly among campaign creators
              </p>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9 bg-muted border-border text-lg font-mono"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Quick amounts</Label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map(quickAmount => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="font-mono"
                >
                  ${quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedCampaign && amount && parseFloat(amount) > 0 && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 border border-border">
              <p className="text-sm font-medium text-foreground">Payment Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campaign</span>
                <span className="text-foreground">{selectedCampaignData?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="text-foreground">
                  {selectedCreator === 'all' ? 'All creators' : selectedCreatorData?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                <span className="text-muted-foreground">Escrow Amount</span>
                <span className="text-primary font-mono">${parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="glow" 
            onClick={handleFundEscrow} 
            disabled={loading || !selectedCampaign || !amount || parseFloat(amount) <= 0}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
