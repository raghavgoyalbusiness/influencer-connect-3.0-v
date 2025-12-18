import { Zap, TrendingUp } from 'lucide-react';

interface BonusMeterProps {
  currentEngagement: number;
  threshold?: number;
  bonusAmount: number;
}

export function BonusMeter({ currentEngagement, threshold = 75, bonusAmount }: BonusMeterProps) {
  const percentage = Math.min((currentEngagement / threshold) * 100, 100);
  const isUnlocked = percentage >= 100;

  return (
    <div className={`glass-card p-6 transition-all duration-500 ${isUnlocked ? 'glow-success border-success/50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isUnlocked ? 'bg-success/20' : 'bg-warning/20'
          }`}>
            <Zap className={`w-5 h-5 ${isUnlocked ? 'text-success' : 'text-warning'}`} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Performance Bonus</h3>
            <p className="text-xs text-muted-foreground">
              Reach {threshold}% engagement to unlock
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold font-mono ${isUnlocked ? 'text-success' : 'text-foreground'}`}>
            ${bonusAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {isUnlocked ? 'Unlocked!' : 'Potential bonus'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current: {currentEngagement.toFixed(1)}%</span>
          <span className="font-mono text-foreground">{percentage.toFixed(0)}%</span>
        </div>
        
        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-1000 animate-progress ${
              isUnlocked 
                ? 'bg-gradient-to-r from-success to-success/70' 
                : 'bg-gradient-to-r from-warning to-warning/70'
            }`}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Threshold marker */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-foreground/50"
            style={{ left: '100%' }}
          />
        </div>

        {/* Milestones */}
        <div className="flex justify-between text-xs text-muted-foreground pt-1">
          <span>0%</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {threshold}% Goal
          </span>
        </div>
      </div>

      {isUnlocked && (
        <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-sm text-success font-medium text-center">
            🎉 Congratulations! Bonus unlocked and pending release!
          </p>
        </div>
      )}
    </div>
  );
}
