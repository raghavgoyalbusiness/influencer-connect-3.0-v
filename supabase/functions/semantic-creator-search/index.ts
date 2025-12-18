import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sample creator database for semantic matching
const creatorDatabase = [
  {
    id: "semantic-1",
    name: "Sophia Chen",
    handle: "sophiaminimal",
    niche: "Lifestyle",
    adjacentNiche: "Wellness",
    aesthetic_score: 0.96,
    base_rate: 2500,
    location: "New York",
    platform: "Instagram",
    followers: 125000,
    style: "Minimalist aesthetic with clean lines, neutral tones, and curated lifestyle content. Focus on intentional living and aesthetic simplicity.",
    demographics: "25-34 female audience, urban professionals interested in wellness and design",
  },
  {
    id: "semantic-2",
    name: "Marcus Rivera",
    handle: "marcusvisuals",
    niche: "Photography",
    adjacentNiche: "Travel",
    aesthetic_score: 0.94,
    base_rate: 3200,
    location: "Los Angeles",
    platform: "YouTube",
    followers: 89000,
    style: "Cinematic travel photography with moody color grading. High production value tech and camera reviews with dry, deadpan humor.",
    demographics: "18-34 male audience, tech enthusiasts and photography hobbyists",
  },
  {
    id: "semantic-3",
    name: "Aisha Patel",
    handle: "aisha.creates",
    niche: "Fashion",
    adjacentNiche: "Luxury",
    aesthetic_score: 0.91,
    base_rate: 4500,
    location: "London",
    platform: "Instagram",
    followers: 340000,
    style: "Quiet luxury aesthetic, old money vibes, film-grain photography. Sophisticated fashion with a focus on quality over quantity.",
    demographics: "25-44 female audience, high income, interested in sustainable luxury",
  },
  {
    id: "semantic-4",
    name: "Jake Thompson",
    handle: "jakethompson",
    niche: "Fitness",
    adjacentNiche: "Health Tech",
    aesthetic_score: 0.89,
    base_rate: 1800,
    location: "Austin",
    platform: "TikTok",
    followers: 560000,
    style: "High-energy gym content with minimalist gym aesthetic. Clean, modern fitness content focused on functional training.",
    demographics: "18-29 male audience, fitness enthusiasts, health-conscious millennials and Gen Z",
  },
  {
    id: "semantic-5",
    name: "Luna Martinez",
    handle: "lunacreative",
    niche: "Art",
    adjacentNiche: "Design",
    aesthetic_score: 0.87,
    base_rate: 2100,
    location: "Berlin",
    platform: "Instagram",
    followers: 78000,
    style: "Contemporary art meets digital design. Bold colors, abstract compositions, and experimental visual storytelling.",
    demographics: "22-35 creative professionals, art collectors, design enthusiasts",
  },
  {
    id: "semantic-6",
    name: "Emma Clarke",
    handle: "emmacottagecore",
    niche: "Home Decor",
    adjacentNiche: "Lifestyle",
    aesthetic_score: 0.92,
    base_rate: 1900,
    location: "Portland",
    platform: "Instagram",
    followers: 145000,
    style: "Cottagecore aesthetic with soft lighting, cozy home decor, vintage finds, and countryside living vibes.",
    demographics: "24-38 female audience, homeowners interested in DIY and vintage decor",
  },
  {
    id: "semantic-7",
    name: "Alex Kim",
    handle: "alexfoodie",
    niche: "Food",
    adjacentNiche: "Vegan",
    aesthetic_score: 0.88,
    base_rate: 2300,
    location: "San Francisco",
    platform: "TikTok",
    followers: 420000,
    style: "Plant-based cooking with artistic plating. Focuses on accessible vegan recipes with high engagement and tutorial-style content.",
    demographics: "20-35 health-conscious audience, vegan and vegetarian community",
  },
  {
    id: "semantic-8",
    name: "Priya Sharma",
    handle: "priyatechtalks",
    niche: "Tech",
    adjacentNiche: "Productivity",
    aesthetic_score: 0.90,
    base_rate: 3800,
    location: "Seattle",
    platform: "YouTube",
    followers: 215000,
    style: "Clean, professional tech reviews with focus on productivity tools and minimalist setups. Known for in-depth, honest reviews.",
    demographics: "25-40 professionals, tech workers, productivity enthusiasts",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create the system prompt for semantic matching
    const systemPrompt = `You are an expert influencer matching AI for InfluencerConnect.ai. 
Your job is to analyze a user's natural language search query and match it against a database of creators.

You will receive:
1. A user's search query describing their ideal influencer
2. A list of creator profiles with their attributes

For each matching creator, you must provide:
1. A match score (0-100) based on how well they fit the query
2. A detailed "reasoning" explaining WHY they match (be specific about visual style, aesthetic alignment, audience fit, etc.)

Return your response as a valid JSON object with this exact structure:
{
  "matches": [
    {
      "id": "creator_id",
      "score": 95,
      "reasoning": "High aesthetic alignment because..."
    }
  ],
  "searchInsights": "Brief summary of what the AI understood from the query"
}

Only return creators with a score of 60 or higher. Sort by score descending. Max 5 results.`;

    const userPrompt = `User Search Query: "${query}"

Creator Database:
${JSON.stringify(creatorDatabase, null, 2)}

Analyze the query and find the best matching creators. Be specific in your reasoning about visual style, aesthetic alignment, audience demographics, and any specific criteria mentioned.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the AI response - extract JSON from the response
    let parsedResult;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Enrich matches with full creator data
    const enrichedMatches = parsedResult.matches.map((match: any) => {
      const creator = creatorDatabase.find((c) => c.id === match.id);
      if (!creator) return null;
      
      return {
        ...creator,
        matchScore: match.score,
        reasoning: match.reasoning,
      };
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        creators: enrichedMatches,
        searchInsights: parsedResult.searchInsights,
        query: query,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Semantic search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Semantic search failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
