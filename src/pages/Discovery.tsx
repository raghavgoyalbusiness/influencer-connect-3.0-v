import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddToCampaignDialog } from '@/components/AddToCampaignDialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Sparkles, 
  User, 
  ArrowLeft,
  Loader2,
  Check,
  Brain,
  Zap,
  MapPin,
  Users,
  TrendingUp,
  FolderPlus,
  Plus,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SemanticCreator {
  id: string;
  name: string;
  handle: string;
  niche: string;
  adjacentNiche: string;
  aesthetic_score: number;
  base_rate: number;
  location: string;
  platform: string;
  followers: number;
  style: string;
  demographics: string;
  matchScore: number;
  reasoning: string;
}

const samplePrompts = [
  "A minimalist tech reviewer in Berlin with a dry sense of humor and high production value",
  "Quiet Luxury girl in NYC who loves organic coffee and uses film-grain filters",
  "High-energy fitness creators with minimalist gym aesthetic for Gen Z audience",
  "Cottagecore creators with soft lighting and cozy home decor vibes",
  "Vegan food creators with artistic plating and high engagement",
];

export default function Discovery() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [creators, setCreators] = useState<SemanticCreator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [searchInsights, setSearchInsights] = useState<string | null>(null);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'analyzing' | 'scanning' | 'matching' | 'complete'>('idle');

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter a search query',
        description: 'Describe your ideal creator in natural language',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSearching(true);
    setCreators([]);
    setSearchInsights(null);
    setSearchPhase('analyzing');

    // Animate through phases
    setTimeout(() => setSearchPhase('scanning'), 800);
    setTimeout(() => setSearchPhase('matching'), 2000);

    try {
      const { data, error } = await supabase.functions.invoke('semantic-creator-search', {
        body: { query: searchQuery },
      });

      if (error) throw error;

      setSearchPhase('complete');
      setCreators(data.creators || []);
      setSearchInsights(data.searchInsights || null);

      toast({
        title: 'Search Complete',
        description: `Found ${data.creators?.length || 0} creators matching your vibe`,
      });
    } catch (error) {
      console.error('Semantic search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Unable to complete semantic search. Please try again.',
        variant: 'destructive',
      });
      setSearchPhase('idle');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleCreator = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const getSearchPhaseText = () => {
    switch (searchPhase) {
      case 'analyzing':
        return 'Understanding your creative vision...';
      case 'scanning':
        return 'Scanning 300M+ Creator Profiles for Vibe Match...';
      case 'matching':
        return 'Analyzing aesthetic compatibility...';
      case 'complete':
        return 'Search Complete!';
      default:
        return '';
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Magic Search
            </h1>
            <p className="text-muted-foreground">Describe your dream influencer. AI handles the rest.</p>
          </div>
        </div>

        {/* Hero Search Section */}
        <div className="glass-card p-8 md:p-12">
          <div className="max-w-3xl mx-auto">
            {/* Search Input - Perplexity/Claude Style */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSemanticSearch();
                  }
                }}
                placeholder='Describe your dream influencer (e.g., "A minimalist tech reviewer in Berlin with a dry sense of humor and high production value")...'
                className="w-full min-h-[80px] pl-12 pr-24 py-4 bg-muted/50 border-2 border-border focus:border-primary rounded-2xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                rows={2}
                disabled={isSearching}
              />
              <Button
                onClick={handleSemanticSearch}
                disabled={isSearching || !searchQuery.trim()}
                variant="glow"
                size="lg"
                className="absolute right-3 top-1/2 -translate-y-1/2 gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Sample Prompts */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Try these example searches:
              </p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(prompt);
                    }}
                    className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-primary/30"
                  >
                    {prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Searching Animation */}
        {isSearching && (
          <div className="glass-card p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">{getSearchPhaseText()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our AI is analyzing aesthetic patterns, audience demographics, and creative styles
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {['analyzing', 'scanning', 'matching'].map((phase, i) => (
                  <div
                    key={phase}
                    className={`w-2 h-2 rounded-full transition-all ${
                      ['analyzing', 'scanning', 'matching'].indexOf(searchPhase) >= i
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Insights */}
        {searchInsights && !isSearching && (
          <div className="glass-card p-4 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">AI Search Insights</p>
                <p className="text-sm text-foreground mt-1">{searchInsights}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Actions */}
        {selectedCreators.length > 0 && (
          <div className="glass-card p-4 flex items-center justify-between sticky top-20 z-30 border-primary/50">
            <p className="text-foreground">
              <span className="font-bold text-primary">{selectedCreators.length}</span> creators selected
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedCreators([])}>
                Clear
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowCampaignDialog(true)}
              >
                <FolderPlus className="w-4 h-4" />
                Add to Campaign
              </Button>
              <Button 
                variant="glow"
                className="gap-2"
                onClick={() => navigate('/campaign/new')}
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </Button>
            </div>
          </div>
        )}

        {/* Add to Campaign Dialog */}
        <AddToCampaignDialog
          open={showCampaignDialog}
          onOpenChange={setShowCampaignDialog}
          selectedCreatorIds={selectedCreators}
          onSuccess={() => setSelectedCreators([])}
        />

        {/* Creator Results Grid */}
        {creators.length > 0 && !isSearching && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {creators.length} Creators Found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((creator) => {
                const isSelected = selectedCreators.includes(creator.id);

                return (
                  <div
                    key={creator.id}
                    onClick={() => toggleCreator(creator.id)}
                    className={`
                      glass-card p-5 cursor-pointer transition-all relative
                      ${isSelected 
                        ? 'border-primary glow-primary' 
                        : 'hover:border-primary/50'
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    <div className={`
                      absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>

                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{creator.name}</h4>
                        <p className="text-sm text-muted-foreground">@{creator.handle}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {creator.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {formatFollowers(creator.followers)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`
                        px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1
                        ${creator.matchScore >= 90 
                          ? 'bg-success/20 text-success' 
                          : creator.matchScore >= 75 
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        <TrendingUp className="w-3 h-3" />
                        {creator.matchScore}% Match
                      </div>
                      <Badge variant="secondary">{creator.niche}</Badge>
                      <Badge variant="outline">{creator.platform}</Badge>
                    </div>

                    {/* AI Reasoning */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Why this match:
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {creator.reasoning}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        ${creator.base_rate.toLocaleString()}/post
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {creator.adjacentNiche}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {creators.length === 0 && !isSearching && searchPhase === 'idle' && (
          <div className="glass-card p-12 text-center">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Discover Creators by Vibe
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Stop clicking through 20 filters. Just describe your ideal creator in natural language, 
              and our AI will find the perfect match from 300M+ profiles.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge variant="secondary" className="text-sm py-1.5 px-4">
                Aesthetic Style
              </Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-4">
                Location
              </Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-4">
                Demographics
              </Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-4">
                Platform
              </Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-4">
                Engagement
              </Badge>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
