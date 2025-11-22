'use client';

import Link from "next/link";
import {
  ArrowRightLeft,
  Boxes,
  Building,
  Contact,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  SlidersHorizontal,
  Truck,
  User,
  Warehouse,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { seedDatabase } from "@/lib/seed";
import { collection } from "firebase/firestore";
import type { Product } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [hasSeeded, setHasSeeded] = useState(false);

  // Check if data exists to prevent re-seeding
  const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading: productsIsLoading } = useCollection<Product>(productsQuery);

  useEffect(() => {
    if (!productsIsLoading && products?.length === 0 && !hasSeeded) {
      console.log('No products found, seeding database...');
      seedDatabase(firestore).then(() => {
        setHasSeeded(true);
        console.log('Database seeded successfully.');
      });
    } else if (products && products.length > 0) {
      // If data already exists, mark as seeded to prevent future attempts
      if (!hasSeeded) setHasSeeded(true);
    }
  }, [productsIsLoading, products, firestore, hasSeeded]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    if(auth) {
      signOut(auth);
    }
    router.push('/');
  };

  if (isUserLoading || !user || !hasSeeded) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">GreenGrocer IMS</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products">
                <Link href="/dashboard/products">
                  <Boxes />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                 <SidebarMenuItem>
                    <SidebarMenuButton className="justify-start" tooltip="Operations">
                      <Package />
                      <span>Operations</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </CollapsibleTrigger>
              <CollapsibleContent>
                 <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/receipts"><Truck /> Receipts</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/deliveries"><Package /> Deliveries</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/transfers"><ArrowRightLeft /> Transfers</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/adjustments"><SlidersHorizontal /> Adjustments</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="w-full" defaultOpen>
              <CollapsibleTrigger asChild>
                 <SidebarMenuItem>
                    <SidebarMenuButton className="justify-start" tooltip="Settings">
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </CollapsibleTrigger>
              <CollapsibleContent>
                 <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/settings/warehouses"><Warehouse /> Warehouses</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/settings/suppliers"><Building /> Suppliers</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                            <Link href="/dashboard/settings/customers"><Contact /> Customers</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <Separator className="my-2" />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/user/40/40`} alt="User" />
                            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-medium text-sm">{user.displayName || 'User'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                         <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Can add breadcrumbs or page title here if needed */}
          </div>
          <div className="flex items-center gap-4">
             {/* Can add global search or other header items here */}
          </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
