'use client';

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightLeft,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  User,
  Menu,
  Warehouse as WarehouseIcon,
  Users,
  Truck,
  History,
  RefreshCw
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
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { seedDatabase } from "@/lib/seed";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [isDataSeeding, setIsDataSeeding] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const seedData = async () => {
      if (firestore && user?.uid) {
        setIsDataSeeding(true);
        try {
          // You might want a more robust way to check if seeding is needed
          // For this example, we'll just seed every time for simplicity
          await seedDatabase(firestore, user.uid);
        } catch (error) {
          console.error("Error seeding database: ", error);
        } finally {
          setIsDataSeeding(false);
        }
      }
    };
    
    if (firestore && user?.uid) {
        seedData();
    }
  }, [user?.uid, firestore]);

  const handleLogout = () => {
    if(auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };
  
  if (isUserLoading || isDataSeeding) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading and seeding data...</p>
        </div>
    );
  }

  if (!user) {
    return null; 
  }
  
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/receipts", label: "Receipts", icon: Package },
    { href: "/dashboard/deliveries", label: "Deliveries", icon: Truck },
    { href: "/dashboard/products", label: "Products", icon: Boxes },
    { href: "/dashboard/transfers", label: "Transfers", icon: ArrowRightLeft },
    { href: "/dashboard/adjustments", label: "Adjustments", icon: Settings },
    { href: "/dashboard/history", label: "Move History", icon: History },
    { href: "/dashboard/reordering", label: "Reordering", icon: RefreshCw },
  ];

  const settingsLinks = [
      { href: "/dashboard/settings/warehouses", label: "Warehouses", icon: WarehouseIcon },
      { href: "/dashboard/settings/suppliers", label: "Suppliers", icon: Users },
      { href: "/dashboard/settings/customers", label: "Customers", icon: Users },
  ]

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded" />
              <span className="">GreenGrocer IMS</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Settings
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {settingsLinks.map(link => (
                        <DropdownMenuItem key={link.href} asChild>
                            <Link href={link.href} className="flex items-center gap-2">
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded" />
                  <span className="sr-only">GreenGrocer IMS</span>
                </Link>
                {navLinks.map(link => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                  </Link>
                ))}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer">
                            <Settings className="h-5 w-5" />
                            Settings
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {settingsLinks.map(link => (
                            <DropdownMenuItem key={link.href} asChild>
                                <Link href={link.href} className="flex items-center gap-2">
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* You can add a search bar here if needed */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/seed/frog/40/40`} alt="User" />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
