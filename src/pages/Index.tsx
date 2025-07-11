import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LibraryView } from "@/components/LibraryView";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <LibraryView />
      </div>
    </SidebarProvider>
  );
};

export default Index;