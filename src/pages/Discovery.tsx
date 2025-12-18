import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Upload, 
  Sparkles, 
  User, 
  Filter,
  ArrowLeft,
  Loader2,
  Check,
  Dna,
  Eye,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MockCreator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  niche: string;
  aesthetic_score: number;
  base_rate: number;
  adjacentNiche: string;
}

// Mock creators with high match scores for vision analysis
const generateMockCreators = (): MockCreator[] => [
  {
    id: 'mock-1',
    name: 'Sophia Chen',
    handle: 'sophiaminimal',
    avatar_url: null,
    niche: 'Lifestyle',
    aesthetic_score: 0.96,
    base_rate: 2500,
    adjacentNiche: 'Wellness'
  },
  {
    id: 'mock-2',
    name: 'Marcus Rivera',
    handle: 'marcusvisuals',
    avatar_url: null,
    niche: 'Photography',
    aesthetic_score: 0.94,
    base_rate: 3200,
    adjacentNiche: 'Travel'
  },
  {
    id: 'mock-3',
    name: 'Aisha Patel',
    handle: 'aisha.creates',
    avatar_url: null,
    niche: 'Fashion',
    aesthetic_score: 0.91,
    base_rate: 4500,
    adjacentNiche: 'Luxury'
  },
  {
    id: 'mock-4',
    name: 'Jake Thompson',
    handle: 'jakethompson',
    avatar_url: null,
    niche: 'Fitness',
    aesthetic_score: 0.89,
    base_rate: 1800,
    adjacentNiche: 'Health Tech'
  },
  {
    id: 'mock-5',
    name: 'Luna Martinez',
    handle: 'lunacreative',
    avatar_url: null,
    niche: 'Art',
    aesthetic_score: 0.87,
    base_rate: 2100,
    adjacentNiche: 'Design'
  }
];

type AnalysisPhase = 'idle' | 'uploading' | 'extracting' | 'matching' | 'complete';

export default function Discovery() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [creators, setCreators] = useState<MockCreator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Simulate analysis progress
  useEffect(() => {
    if (analysisPhase === 'uploading') {
      const timer = setTimeout(() => {
        setAnalysisProgress(25);
        setAnalysisPhase('extracting');
      }, 800);
      return () => clearTimeout(timer);
    }
    if (analysisPhase === 'extracting') {
      const timer = setTimeout(() => {
        setAnalysisProgress(60);
        setAnalysisPhase('matching');
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (analysisPhase === 'matching') {
      const timer = setTimeout(() => {
        setAnalysisProgress(100);
        setAnalysisPhase('complete');
        setCreators(generateMockCreators());
        toast({
          title: 'Aesthetic DNA Analysis Complete',
          description: 'Found 5 creators with high visual compatibility',
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [analysisPhase, toast]);

  const handleVibeSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI vibe search delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock creators for demo
    setCreators(generateMockCreators());
    setIsSearching(false);
  };

  const handleMoodBoardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(previewUrl);
    
    // Start analysis phases
    setAnalysisProgress(0);
    setAnalysisPhase('uploading');
    setCreators([]);
  };

  const toggleCreator = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const resetAnalysis = () => {
    setAnalysisPhase('idle');
    setAnalysisProgress(0);
    setUploadedImage(null);
    setCreators([]);
  };

  const getAnalysisText = () => {
    switch (analysisPhase) {
      case 'uploading':
        return 'Processing Image...';
      case 'extracting':
        return 'Analyzing Aesthetic DNA...';
      case 'matching':
        return 'Matching Creator Profiles...';
      case 'complete':
        return 'Analysis Complete!';
      default:
        return '';
    }
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
                <Camera className="w-4 h-4 text-primary" />
                Upload Mood Board
              </h3>
              
              {analysisPhase !== 'idle' && analysisPhase !== 'complete' ? (
                /* Analysis in progress */
                <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex items-center gap-4 mb-4">
                    {uploadedImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-primary/50">
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Dna className="w-5 h-5 text-primary animate-pulse" />
                        <p className="text-sm font-medium text-primary">{getAnalysisText()}</p>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Analysis steps */}
                  <div className="space-y-2 mt-4">
                    <div className={`flex items-center gap-2 text-sm ${analysisPhase !== 'uploading' ? 'text-success' : 'text-primary'}`}>
                      {analysisPhase !== 'uploading' ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Image processing</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      analysisPhase === 'matching' ? 'text-success' : 
                      analysisPhase === 'extracting' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {analysisPhase === 'matching' ? <Check className="w-4 h-4" /> : 
                       analysisPhase === 'extracting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       <Eye className="w-4 h-4" />}
                      <span>Analyzing Aesthetic DNA</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      analysisPhase === 'matching' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {analysisPhase === 'matching' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       <User className="w-4 h-4" />}
                      <span>Matching creator profiles</span>
                    </div>
                  </div>
                </div>
              ) : analysisPhase === 'complete' ? (
                /* Analysis complete */
                <div className="p-6 border-2 border-success/50 rounded-lg bg-success/5">
                  <div className="flex items-center gap-4">
                    {uploadedImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-success/50">
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="w-5 h-5 text-success" />
                        <p className="text-sm font-medium text-success">Analysis Complete!</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Found 5 creators with high visual match</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetAnalysis}>
                      Try Another
                    </Button>
                  </div>
                </div>
              ) : (
                /* Upload zone */
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 rounded-lg cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMoodBoardUpload}
                  />
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drop an image or video</p>
                  <p className="text-xs text-muted-foreground mt-1">AI will analyze and find matching creators</p>
                </label>
              )}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {creators.map((creator) => {
                const isSelected = selectedCreators.includes(creator.id);
                const visualMatchScore = Math.floor(creator.aesthetic_score * 100);

                return (
                  <div
                    key={creator.id}
                    onClick={() => toggleCreator(creator.id)}
                    className={`
                      glass-card p-4 cursor-pointer transition-all relative
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
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-3 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h4 className="font-medium text-foreground text-sm">{creator.name}</h4>
                      <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                    </div>

                    {/* Match Score */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Visual Match</span>
                        <span className={`text-sm font-mono font-bold ${
                          visualMatchScore > 90 ? 'text-success' : 'text-primary'
                        }`}>
                          {visualMatchScore}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            visualMatchScore > 90 ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ width: `${visualMatchScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Niche Tags */}
                    <div className="mt-3 flex flex-wrap gap-1 justify-center">
                      <Badge variant="secondary" className="text-[10px]">
                        {creator.niche}
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
        {creators.length === 0 && (analysisPhase === 'idle' || analysisPhase === 'uploading' || analysisPhase === 'extracting' || analysisPhase === 'matching') && !isSearching && analysisPhase === 'idle' && (
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
