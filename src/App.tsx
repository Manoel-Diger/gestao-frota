import React, { useState, useEffect } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { useToast } from "./components/ui/use-toast";
import { supabase } from "./integrations/supabase/client";

// Importe seus componentes de layout e páginas
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import FuelPage from "./pages/Fuel";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Logout realizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@exemplo.com",
        password: "123456",
      });
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Login de demonstração realizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Faça Login para Continuar</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="seuemail@exemplo.com" required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" name="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Ou, para uma demonstração:</p>
            <Button
              onClick={handleDemoLogin}
              variant="outline"
              className="w-full mt-2"
              disabled={loading}
            >
              Acessar com Usuário de Demonstração
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold">Gerenciador de Frota</h1>
              <div className="flex items-center space-x-2">
                <p className="hidden sm:block">Logado como: {user.email}</p>
                <Button variant="ghost" onClick={handleLogout} disabled={loading} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
              </div>
            </header>
          </div>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="fuel" element={<FuelPage />} />
              <Route path="reports" element={<Reports />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="settings" element={<Dashboard />} />
              <Route path="docs" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
