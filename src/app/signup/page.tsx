'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, initiateEmailSignUp, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";

export default function SignupPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if(auth && email && password) {
      initiateEmailSignUp(auth, email, password)
        .then(userCredential => {
            if(userCredential?.user) {
                return updateProfile(userCredential.user, {
                    displayName: name
                });
            }
        })
        .catch((error: FirebaseError) => {
            let title = "An error occurred";
            let description = "Please try again later.";

            if (error.code === 'auth/email-already-in-use') {
                title = "Sign-up Failed";
                description = "This email address is already in use by another account.";
            } else if (error.code === 'auth/weak-password') {
                title = "Sign-up Failed";
                description = "The password is too weak. Please choose a stronger password.";
            }
            
            toast({
                variant: "destructive",
                title: title,
                description: description,
            });
        });
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <div className="flex justify-center mb-4">
              <Image 
                src="/logo.png" 
                alt="StockFlow Pro Logo" 
                width={300} 
                height={300} 
                className="rounded-lg border-2 border-primary shadow-lg" 
              />
            </div>
            <h1 className="text-7xl font-bold">Create Account</h1>
            <p className="text-muted-foreground">
              Sign up to start managing your inventory
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSignUp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Full Name</Label>
                  <Input 
                    id="first-name" 
                    name="name" 
                    placeholder="John Doe" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password"
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>
                <Button type="submit" className="w-full mt-2">
                  Create Account
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                        Google
                    </Link>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
