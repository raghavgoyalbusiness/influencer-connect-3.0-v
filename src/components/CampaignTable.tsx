import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MoreVertical, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Campaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  status: string;
  created_at: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

const statusVariantMap: Record<string, 'scaling' | 'optimizing' | 'halted' | 'pending' | 'draft' | 'active'> = {
  scaling: 'scaling',
  optimizing: 'optimizing',
  halted: 'halted',
  pending: 'pending',
  draft: 'draft',
  active: 'active',
  completed: 'active',
};

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSpendPercentage = (total: number, remaining: number) => {
    if (total === 0) return 0;
    return Math.round(((total - remaining) / total) * 100);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Active Campaigns</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Spend Progress</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => {
              const spendPercentage = getSpendPercentage(campaign.total_budget, campaign.remaining_budget);
              
              return (
                <tr 
                  key={campaign.id} 
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/flight-control/${campaign.id}`)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-foreground">{formatCurrency(campaign.total_budget)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(campaign.remaining_budget)} remaining
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-mono text-foreground">{spendPercentage}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all animate-progress"
                          style={{ width: `${spendPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={statusVariantMap[campaign.status] || 'default'}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/flight-control/${campaign.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                          <DropdownMenuItem>View Analytics</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Halt Campaign</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
