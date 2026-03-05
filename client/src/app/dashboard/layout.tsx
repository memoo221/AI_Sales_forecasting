"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Upload, MessageSquare, LogOut, TrendingUp } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/upload", label: "Upload CSV", icon: Upload },
  { href: "/dashboard/chat", label: "AI Assistant", icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-card flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-6 h-16 border-b">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Sales AI Platform</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  asChild={false}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />
        <div className="px-3 py-4 flex flex-col gap-2">
          <p className="px-3 text-xs text-muted-foreground truncate">{user.email}</p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={() => { logout(); router.push("/login"); }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}
