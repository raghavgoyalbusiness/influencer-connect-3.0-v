import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FolderOpen, Check } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_budget: number;
  remaining_budget: number;
}

interface AddToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCreatorIds: string[];
  onSuccess?: () => void;
}

export function AddToCampaignDialog({
  open,
  onOpenChange,
  selectedCreatorIds,
  onSuccess,
}: AddToCampaignDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchCampaigns();
    }
  }, [open, user]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, total_budget, remaining_budget')
        .eq('agency_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCampaign = async () => {
    if (!selectedCampaign || selectedCreatorIds.length === 0) return;

    setIsAdding(true);
    try {
      // Create campaign participants for each selected creator
      const participants = selectedCreatorIds.map((creatorId) => ({
        campaign_id: selectedCampaign,
        creator_id: creatorId,
        status: 'pending' as const,
        current_engagement_rate: 0,
        real_time_sales_lift: 0,
        escrow_amount: 0,
      }));

      const { error } = await supabase
        .from('campaign_participants')
        .insert(participants);

      if (error) {
        // Handle duplicate entries gracefully
        if (error.code === '23505') {
          toast({
            title: 'Already Added',
            description: 'Some creators are already in this campaign.',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Creators Added',
          description: `Added ${selectedCreatorIds.length} creator(s) to the campaign.`,
        });
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Error adding creators:', err);
      toast({
        title: 'Error',
        description: 'Failed to add creators. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Campaign</DialogTitle>
          <DialogDescription>
            Select a campaign to add {selectedCreatorIds.length} creator(s) to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No campaigns yet</p>
              <Button
                variant="glow"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/campaign/new');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedCampaign === campaign.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedCampaign === campaign.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedCampaign === campaign.id && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{campaign.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Budget: ${campaign.total_budget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(campaign.status) as any}>
                      {campaign.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {campaigns.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="glow"
              className="flex-1"
              onClick={handleAddToCampaign}
              disabled={!selectedCampaign || isAdding}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Campaign
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
