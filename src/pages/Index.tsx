import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClientIntakeForm } from "@/components/ClientIntakeForm";
import { AuthNav } from "@/components/AuthNav";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email === import.meta.env.VITE_ADMIN_EMAIL) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user?.email === import.meta.env.VITE_ADMIN_EMAIL) return null;

  return (
    <>
      <AuthNav />
      <ClientIntakeForm />
    </>
  );
};

export default Index;
