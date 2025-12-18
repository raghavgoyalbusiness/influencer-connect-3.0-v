import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Sparkles, TrendingUp, Plus } from 'lucide-react';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  niche: string | null;
  aesthetic_score: number;
  base_rate: number;
}

interface Participant {
  id: string;
  creator_id: string;
  status: string;
  current_engagement_rate: number;
  real_time_sales_lift: number;
  creators?: Creator;
}

interface CreatorGridProps {
  participants: Participant[];
  viewType?: 'grid' | 'list';
}

export function CreatorGrid({ participants, viewType = 'list' }: CreatorGridProps) {
  const getStatusStyles = (status: string, salesLift: number) => {
    if (status === 'paused') {
      return 'border-destructive/50 bg-destructive/5';
    }
    if (salesLift > 20) {
      return 'border-success/50 bg-success/5 glow-success';
    }
    if (salesLift > 10) {
      return 'border-primary/50 bg-primary/5';
    }
    return 'border-border';
  };

  const getStatusBadge = (status: string, salesLift: number) => {
    if (status === 'paused') {
      return <Badge variant="halted">Halt Pending</Badge>;
    }
    if (salesLift > 20) {
      return <Badge variant="scaling">Scaling</Badge>;
    }
    if (salesLift > 10) {
      return <Badge variant="optimizing">Optimizing</Badge>;
    }
    return <Badge variant="active">Active</Badge>;
  };

  if (participants.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Creators Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add creators to this campaign to start tracking performance
        </p>
        <Button variant="glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Creators
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => {
        const creator = participant.creators;
        if (!creator) return null;

        return (
          <div
            key={participant.id}
            className={`glass-card p-4 transition-all duration-300 ${getStatusStyles(participant.status, participant.real_time_sales_lift)}`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">{creator.name}</h4>
                  {getStatusBadge(participant.status, participant.real_time_sales_lift)}
                </div>
                <p className="text-sm text-muted-foreground">@{creator.handle}</p>
              </div>

              {/* Metrics */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Sparkles className="w-3 h-3" />
                    <span>Aesthetic</span>
                  </div>
                  <p className="font-mono font-medium text-foreground">
                    {(creator.aesthetic_score * 100).toFixed(0)}%
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>Sales Lift</span>
                  </div>
                  <p className={`font-mono font-medium ${
                    participant.real_time_sales_lift > 15 ? 'text-success' : 
                    participant.real_time_sales_lift < 5 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    +{participant.real_time_sales_lift.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="font-mono font-medium text-foreground">
                    {participant.current_engagement_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Niche Tag */}
              {creator.niche && (
                <Badge variant="secondary" className="hidden lg:inline-flex">
                  {creator.niche}
                </Badge>
              )}
            </div>

            {/* Mobile Metrics */}
            <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Aesthetic:</span>
                <span className="font-mono text-xs">{(creator.aesthetic_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sales:</span>
                <span className={`font-mono text-xs ${
                  participant.real_time_sales_lift > 15 ? 'text-success' : 'text-foreground'
                }`}>
                  +{participant.real_time_sales_lift.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
