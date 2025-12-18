import { useEffect, useState } from 'react';
import { Bot, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AILog {
  id: string;
  action_taken: string;
  reason: string;
  created_at: string;
}

interface AILogFeedProps {
  campaignId: string;
}

const actionIcons: Record<string, typeof Bot> = {
  'Budget Shift': RefreshCw,
  'Scaling': TrendingUp,
  'Halt': AlertTriangle,
  'Pause': TrendingDown,
};

export function AILogFeed({ campaignId }: AILogFeedProps) {
  const [logs, setLogs] = useState<AILog[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setLogs(data);
      }
    };

    fetchLogs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ai-logs-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_logs',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as AILog, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const getActionIcon = (action: string) => {
    const IconComponent = Object.entries(actionIcons).find(([key]) => 
      action.toLowerCase().includes(key.toLowerCase())
    )?.[1] || Bot;
    
    return IconComponent;
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('halt') || action.toLowerCase().includes('pause')) {
      return 'text-destructive bg-destructive/10 border-destructive/30';
    }
    if (action.toLowerCase().includes('scal')) {
      return 'text-success bg-success/10 border-success/30';
    }
    return 'text-primary bg-primary/10 border-primary/30';
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-success pulse-glow" />
        <h3 className="font-semibold text-foreground">AI Autopilot Log</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No AI actions yet</p>
            <p className="text-xs">Actions will appear here in real-time</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const Icon = getActionIcon(log.action_taken);
            return (
              <div
                key={log.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getActionColor(log.action_taken)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.action_taken}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {log.reason}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
