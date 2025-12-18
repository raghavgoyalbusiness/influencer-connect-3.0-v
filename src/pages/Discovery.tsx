import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Upload, 
  Sparkles, 
  User, 
  Filter,
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  niche: string | null;
  aesthetic_score: number;
  base_rate: number;
}

export default function Discovery() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  const handleVibeSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI vibe search delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .gte('aesthetic_score', 0.7)
        .limit(20);

      if (error) throw error;
      setCreators(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMoodBoardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      // Fetch creators with high aesthetic scores (simulating visual match)
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .gte('aesthetic_score', 0.8)
        .limit(20);

      if (error) throw error;
      setCreators(data || []);
      
      toast({
        title: 'Aesthetic DNA Extracted',
        description: `Found ${data?.length || 0} creators matching your mood board`,
      });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCreator = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
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

      <main className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visual Discovery Engine</h1>
            <p className="text-muted-foreground">Find creators by aesthetic "vibe" or mood board</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vibe Search */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Vibe Search
              </h3>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try "deadpan humor" or "minimalist lighting"'
                  className="bg-muted border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleVibeSearch()}
                />
                <Button 
                  variant="glow" 
                  onClick={handleVibeSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['deadpan humor', 'luxury aesthetic', 'minimalist', 'high energy'].map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => {
                      setSearchQuery(vibe);
                      handleVibeSearch();
                    }}
                    className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Board Upload */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Mood Board
              </h3>
              <label className={`
                flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
                ${isUploading 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleMoodBoardUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary mb-2 animate-spin" />
                    <p className="text-sm text-primary font-medium">Extracting Aesthetic DNA...</p>
                    <div className="w-48 h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-progress" style={{ width: '70%' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop an image or video</p>
                    <p className="text-xs text-muted-foreground mt-1">AI will find matching creators</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

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
              <Button variant="glow">
                Create Campaign
              </Button>
            </div>
          </div>
        )}

        {/* Creator Grid */}
        {creators.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {creators.length} Creators Found
              </h2>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {creators.map((creator) => {
                const isSelected = selectedCreators.includes(creator.id);
                const visualMatchScore = Math.floor(creator.aesthetic_score * 100);

                return (
                  <div
                    key={creator.id}
                    onClick={() => toggleCreator(creator.id)}
                    className={`
                      glass-card p-4 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-primary glow-primary' 
                        : 'hover:border-primary/50'
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    <div className={`
                      absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 overflow-hidden">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h4 className="font-medium text-foreground">{creator.name}</h4>
                      <p className="text-sm text-muted-foreground">@{creator.handle}</p>
                    </div>

                    {/* Scores */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Visual Match</p>
                        <p className={`font-mono font-bold ${
                          visualMatchScore > 85 ? 'text-success' : 'text-foreground'
                        }`}>
                          {visualMatchScore}%
                        </p>
                      </div>
                      {creator.niche && (
                        <Badge variant="secondary" className="text-xs">
                          {creator.niche}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {creators.length === 0 && !isSearching && (
          <div className="glass-card p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Discover Creators by Vibe
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Use natural language to describe the aesthetic you're looking for, or upload a mood board for AI-powered visual matching
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
