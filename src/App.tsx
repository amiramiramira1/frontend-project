import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BrowseBoxes from "./pages/BrowseBoxes";
import BoxDetail from "./pages/BoxDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import SubscribeBox from "./pages/SubscribeBox";
import ManageSubscription from "./pages/ManageSubscription";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import OrderHistory from "./pages/OrderHistory";
import Subscriptions from "./pages/Subscriptions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBoxes from "./pages/admin/AdminBoxes";
import AdminBoxForm from "./pages/admin/AdminBoxForm";
import AdminIngredients from "./pages/admin/AdminIngredients";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/boxes" element={<BrowseBoxes />} />
          <Route path="/box/:slug" element={<BoxDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/subscribe/:slug" element={<SubscribeBox />} />
          <Route path="/manage-subscription/:id" element={<ManageSubscription />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<div className="text-foreground"><h1 className="text-3xl font-bold font-['Poppins']">Orders Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            <Route path="subscriptions" element={<div className="text-foreground"><h1 className="text-3xl font-bold font-['Poppins']">Subscriptions Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            <Route path="boxes" element={<AdminBoxes />} />
            <Route path="boxes/new" element={<AdminBoxForm />} />
            <Route path="boxes/:id/edit" element={<AdminBoxForm />} />
            <Route path="meals" element={<div className="text-foreground"><h1 className="text-3xl font-bold font-['Poppins']">Meals Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            <Route path="ingredients" element={<AdminIngredients />} />
            <Route path="users" element={<div className="text-foreground"><h1 className="text-3xl font-bold font-['Poppins']">Users Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            <Route path="settings" element={<div className="text-foreground"><h1 className="text-3xl font-bold font-['Poppins']">Admin Settings</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
