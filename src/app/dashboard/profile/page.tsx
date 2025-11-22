'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { useFirestore, useUser } from "@/firebase";
import { seedDatabase } from "@/lib/seed";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Database } from "lucide-react";

export default function ProfilePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    if (!firestore || !user?.uid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please ensure you are logged in.",
      });
      return;
    }

    setIsSeeding(true);
    try {
      await seedDatabase(firestore, user.uid);
      toast({
        title: "Database Seeded!",
        description: "Sample data has been added to your database.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "There was an error seeding the database.",
      });
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Profile" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="john.doe@example.com" disabled />
                    </div>
                    <Button>Save Changes</Button>
                </form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password. Make sure it's a strong one.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                </form>
            </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Developer Tools
          </CardTitle>
          <CardDescription>
            Seed the database with sample data for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSeedDatabase} 
            disabled={isSeeding}
            variant="outline"
          >
            {isSeeding ? "Seeding..." : "Seed Database"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will add sample products, categories, warehouses, suppliers, customers, and transactions to your database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
