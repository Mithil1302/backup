'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { Receipt } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Supplier } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function ReceiptsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const receiptsCollection = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'receipts');
    }, [firestore, user]);
    const { data: receipts, isLoading } = useCollection<Receipt>(receiptsCollection);

    const suppliersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const { data: suppliers } = useCollection<Supplier>(suppliersCollection);

    const getStatusVariant = (status: string) => {
        switch (status) {
          case "Done": return "default";
          case "Ready": return "secondary";
          case "Waiting": return "outline";
          case "Draft": return "outline";
          case "Canceled": return "destructive";
          default: return "default";
        }
    };
    
    const handleAddReceipt = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!receiptsCollection) return;
      const formData = new FormData(event.currentTarget);
      const supplierId = formData.get('supplierId') as string;
      
      if (!supplierId) {
        toast({
            variant: "destructive",
            title: "Supplier not selected",
            description: "Please select a supplier for the receipt.",
        });
        return;
      }
      
      addDocumentNonBlocking(receiptsCollection, {
        supplierId: supplierId,
        receiptDate: serverTimestamp(),
        status: 'Draft',
      }).then(() => {
        toast({
            title: "Receipt Created",
            description: "The new receipt has been saved in draft status.",
        });
        setIsSheetOpen(false);
      });
    };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Receipts">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  <span>New Receipt</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create a new receipt</SheetTitle>
                    <SheetDescription>Select a supplier to start a new stock receipt.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddReceipt} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select name="supplierId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Receipt</Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Incoming Stock Receipts</CardTitle>
          <CardDescription>Log and manage all incoming stock from vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>}
              {!isLoading && receipts?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No receipts found.</TableCell></TableRow>}
              {receipts && receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">RCPT-{receipt.id.substring(0, 6).toUpperCase()}</TableCell>
                  <TableCell>{suppliers?.find(s => s.id === receipt.supplierId)?.name || 'N/A'}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(receipt.status)}>{receipt.status}</Badge></TableCell>
                  <TableCell>{receipt.receiptDate?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Validate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
