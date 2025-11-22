'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import type { InternalTransfer, Product, Warehouse } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ArrowRightLeft, Warehouse as WarehouseIcon, Package } from "lucide-react";

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
    const [selectedTransfer, setSelectedTransfer] = useState<InternalTransfer | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

    const handleValidateTransfer = (transferId: string) => {
      if (!firestore || !user?.uid) return;
      const transferDoc = doc(firestore, 'users', user.uid, 'internalTransfers', transferId);
      updateDocumentNonBlocking(transferDoc, { status: 'Done' });
      toast({
        title: "Transfer Validated",
        description: "The transfer has been completed.",
      });
    };

    const handleCancelTransfer = (transferId: string) => {
      if (!firestore || !user?.uid) return;
      const transferDoc = doc(firestore, 'users', user.uid, 'internalTransfers', transferId);
      updateDocumentNonBlocking(transferDoc, { status: 'Canceled' });
      toast({
        variant: "destructive",
        title: "Transfer Canceled",
        description: "The transfer has been canceled.",
      });
    };

    const handleViewDetails = (transferId: string) => {
      const transfer = transfers?.find(t => t.id === transferId);
      if (transfer) {
        setSelectedTransfer(transfer);
        setIsDetailDialogOpen(true);
      }
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Internal Transfer Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this stock transfer
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Reference Number</Label>
                  <p className="text-lg font-semibold">TR-{selectedTransfer.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedTransfer.status)} className="text-sm">
                      {selectedTransfer.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Information
                </h3>
                {products?.find(p => p.id === selectedTransfer.productId) && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Product Name</Label>
                      <p className="font-medium">{getProductName(selectedTransfer.productId)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">SKU</Label>
                      <p className="text-sm">{products.find(p => p.id === selectedTransfer.productId)?.sku}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Quantity</Label>
                      <p className="text-lg font-semibold">{selectedTransfer.quantity} {products.find(p => p.id === selectedTransfer.productId)?.unitOfMeasure}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <WarehouseIcon className="h-4 w-4" />
                  Warehouse Movement
                </h3>
                <div className="grid grid-cols-2 gap-6 pl-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">From (Source)</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{getWarehouseName(selectedTransfer.fromWarehouseId)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {warehouses?.find(w => w.id === selectedTransfer.fromWarehouseId)?.location}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">To (Destination)</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{getWarehouseName(selectedTransfer.toWarehouseId)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {warehouses?.find(w => w.id === selectedTransfer.toWarehouseId)?.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transfer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Transfer Date</Label>
                    <p className="font-medium">{selectedTransfer.transferDate?.toDate().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransfer.transferDate?.toDate().toLocaleTimeString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Document ID</Label>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedTransfer.id}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
                {selectedTransfer.status !== 'Done' && selectedTransfer.status !== 'Canceled' && (
                  <Button onClick={() => {
                    handleValidateTransfer(selectedTransfer.id);
                    setIsDetailDialogOpen(false);
                  }}>
                    Validate Transfer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
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
                        <DropdownMenuItem onClick={() => handleViewDetails(transfer.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleValidateTransfer(transfer.id)}>Validate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleCancelTransfer(transfer.id)}>Cancel</DropdownMenuItem>
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
