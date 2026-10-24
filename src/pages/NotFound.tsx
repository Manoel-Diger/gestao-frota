import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Car } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elevated">
          <Car className="h-7 w-7 text-white" />
        </div>
        <p className="text-sm font-semibold text-primary">Erro 404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <a href="/" className={buttonVariants({ className: "mt-8" })}>
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
