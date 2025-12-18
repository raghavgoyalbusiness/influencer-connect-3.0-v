import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FlightControl from "./pages/FlightControl";
import Discovery from "./pages/Discovery";
import CreatorPortal from "./pages/CreatorPortal";
import Payments from "./pages/Payments";
import ThankYou from "./pages/ThankYou";
import Admin from "./pages/Admin";
import CampaignCreate from "./pages/CampaignCreate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/flight-control/:campaignId" element={<FlightControl />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/creator" element={<CreatorPortal />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/campaign/new" element={<CampaignCreate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
