'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { InternalTransfer, Product, Warehouse } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function TransfersPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const transfersCollection = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'internalTransfers');
    }, [firestore, user?.uid]);
    const { data: transfers, isLoading: isTransfersLoading } = useCollection<InternalTransfer>(transfersCollection);

    const warehousesCollection = useMemo(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
    const { data: warehouses, isLoading: isWarehousesLoading } = useCollection<Warehouse>(warehousesCollection);

    const productsCollection = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
    const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);

    const [isSheetOpen, setIsSheetOpen] = useState(false);

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

    const handleAddTransfer = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!transfersCollection) return;
      const formData = new FormData(event.currentTarget);
      
      const fromWarehouseId = formData.get('fromWarehouseId') as string;
      const toWarehouseId = formData.get('toWarehouseId') as string;
      const productId = formData.get('productId') as string;
      const quantity = formData.get('quantity') as string;

      if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
          toast({
              variant: "destructive",
              title: "Missing Information",
              description: "Please fill out all fields to create a transfer.",
          });
          return;
      }
      
      if (fromWarehouseId === toWarehouseId) {
          toast({
              variant: "destructive",
              title: "Invalid Warehouses",
              description: "Source and destination warehouses cannot be the same.",
          });
          return;
      }

      const newTransfer = {
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity: Number(quantity),
        transferDate: serverTimestamp(),
        status: 'Draft',
      };
      addDocumentNonBlocking(transfersCollection, newTransfer).then(() => {
          toast({
              title: "Transfer Created",
              description: "The new internal transfer has been saved.",
          });
          setIsSheetOpen(false);
      });
    };

    const getWarehouseName = (id: string) => warehouses?.find(w => w.id === id)?.name || 'N/A';
    const getProductName = (id: string) => products?.find(p => p.id === id)?.name || 'N/A';

    if (isUserLoading || isWarehousesLoading || isProductsLoading || isTransfersLoading) {
      return <div>Loading...</div>;
    }
    
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Internal Transfers">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>New Transfer</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create New Internal Transfer</SheetTitle>
              <SheetDescription>Move stock between your warehouse locations.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddTransfer} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Source Warehouse</Label>
                <Select name="fromWarehouseId">
                  <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                  <SelectContent>{warehouses?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse</Label>
                <Select name="toWarehouseId">
                  <SelectTrigger><SelectValue placeholder="Select destination..." /></SelectTrigger>
                  <SelectContent>{warehouses?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label>Product</Label>
                <Select name="productId">
                  <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                  <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="0" required />
               </div>
              <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)}>Cancel</Button>                  
                  <Button type="submit">Create Transfer</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Internal Stock Movements</CardTitle>
          <CardDescription>Track the movement of stock between internal locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transfers && <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>}
              {transfers && transfers.length === 0 && <TableRow><TableCell colSpan={8} className="text-center">No transfers found.</TableCell></TableRow>}
              {transfers && transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">TR-{transfer.id.substring(0,6).toUpperCase()}</TableCell>                  
                  <TableCell>{getProductName(transfer.productId)}</TableCell>
                  <TableCell>{getWarehouseName(transfer.fromWarehouseId)}</TableCell>
                  <TableCell>{getWarehouseName(transfer.toWarehouseId)}</TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(transfer.status)}>{transfer.status}</Badge></TableCell>
                  <TableCell>{transfer.transferDate?.toDate().toLocaleDateString()}</TableCell>
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
