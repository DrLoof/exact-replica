import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PlanProvider } from "@/hooks/usePlan";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import GuestProposalPreview from "./pages/GuestProposalPreview";
import Dashboard from "./pages/Dashboard";
import Proposals from "./pages/Proposals";
import ProposalNew from "./pages/ProposalNew";
import ProposalEditor from "./pages/ProposalEditor";
import PublicProposal from "./pages/PublicProposal";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Bundles from "./pages/Bundles";
import Packages from "./pages/Packages";
import Settings from "./pages/Settings";
import SettingsAgency from "./pages/SettingsAgency";
import SettingsBranding from "./pages/SettingsBranding";
import SettingsPricing from "./pages/SettingsPricing";
import SettingsTestimonials from "./pages/SettingsTestimonials";
import SettingsDifferentiators from "./pages/SettingsDifferentiators";
import SettingsPortfolio from "./pages/SettingsPortfolio";
import SettingsTeam from "./pages/SettingsTeam";
import SettingsBilling from "./pages/SettingsBilling";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AcceptInvite from "./pages/AcceptInvite";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { CookieConsent } from "./components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlanProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/p/:shareId" element={<PublicProposal />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
              <Route path="/proposals/preview" element={<GuestProposalPreview />} />
              <Route path="/proposals/new" element={<ProposalNew />} />
              <Route path="/proposals/:id" element={<ProtectedRoute><ProposalEditor /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
              <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
              <Route path="/bundles" element={<ProtectedRoute><Bundles /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/agency" element={<ProtectedRoute><SettingsAgency /></ProtectedRoute>} />
              <Route path="/settings/branding" element={<ProtectedRoute><SettingsBranding /></ProtectedRoute>} />
              <Route path="/settings/pricing" element={<ProtectedRoute><SettingsPricing /></ProtectedRoute>} />
              <Route path="/settings/billing" element={<ProtectedRoute><SettingsBilling /></ProtectedRoute>} />
              <Route path="/settings/testimonials" element={<ProtectedRoute><SettingsTestimonials /></ProtectedRoute>} />
              <Route path="/settings/differentiators" element={<ProtectedRoute><SettingsDifferentiators /></ProtectedRoute>} />
              <Route path="/settings/portfolio" element={<ProtectedRoute><SettingsPortfolio /></ProtectedRoute>} />
              <Route path="/settings/team" element={<ProtectedRoute><SettingsTeam /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </PlanProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
