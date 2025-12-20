import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Eye, Lock, Sparkles, ArrowLeft } from "lucide-react";

interface CPVCampaignFormProps {
  onSuccess?: (campaignId: string) => void;
}

export function CPVCampaignForm({ onSuccess }: CPVCampaignFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vibe_description: "",
    total_budget: 5000,
    cpv_rate: 5, // $5 per 1000 views
    viral_threshold: 100000,
    lockFullBudget: true,
  });

  const estimatedViews = formData.cpv_rate > 0 
    ? Math.floor((formData.total_budget / formData.cpv_rate) * 1000)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create a campaign");
        return;
      }

      const lockedBudget = formData.lockFullBudget ? formData.total_budget : formData.total_budget * 0.5;

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          agency_user_id: user.id,
          name: formData.name,
          vibe_description: formData.vibe_description,
          total_budget: formData.total_budget,
          remaining_budget: formData.total_budget,
          cpv_rate: formData.cpv_rate,
          locked_budget: lockedBudget,
          viral_threshold: formData.viral_threshold,
          is_cpv_campaign: true,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("CPV Campaign created successfully!");
      onSuccess?.(data.id);
      navigate(`/flight/${data.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Create CPV Campaign</CardTitle>
            <CardDescription>Pay creators based on actual video views</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              placeholder="Summer Product Launch"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign goals and target audience..."
              value={formData.vibe_description}
              onChange={(e) => setFormData({ ...formData, vibe_description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Budget & CPV Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Max Budget
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="budget"
                  type="number"
                  min={100}
                  step={100}
                  className="pl-8"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* CPV Rate */}
            <div className="space-y-2">
              <Label htmlFor="cpv" className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                CPV Rate (per 1,000 views)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="cpv"
                  type="number"
                  min={0.5}
                  step={0.5}
                  className="pl-8"
                  value={formData.cpv_rate}
                  onChange={(e) => setFormData({ ...formData, cpv_rate: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Viral Threshold */}
          <div className="space-y-2">
            <Label htmlFor="viral" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Viral Bonus Threshold (views)
            </Label>
            <Input
              id="viral"
              type="number"
              min={10000}
              step={10000}
              value={formData.viral_threshold}
              onChange={(e) => setFormData({ ...formData, viral_threshold: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Creators will receive a "Viral" badge when their content crosses this threshold
            </p>
          </div>

          {/* Lock Budget Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Lock Full Budget in Escrow</p>
                <p className="text-sm text-muted-foreground">
                  Secure the entire budget upfront for creator confidence
                </p>
              </div>
            </div>
            <Switch
              checked={formData.lockFullBudget}
              onCheckedChange={(checked) => setFormData({ ...formData, lockFullBudget: checked })}
            />
          </div>

          {/* Estimated Performance */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
            <h4 className="font-medium mb-3">Estimated Performance</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{estimatedViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Potential Views</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  ${formData.lockFullBudget ? formData.total_budget : formData.total_budget * 0.5}
                </p>
                <p className="text-xs text-muted-foreground">Locked in Escrow</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">${formData.cpv_rate}</p>
                <p className="text-xs text-muted-foreground">Per 1K Views</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" variant="glow" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Launch CPV Campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
