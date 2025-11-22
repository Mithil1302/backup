'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { Product, Warehouse, StockAdjustment } from "@/lib/types";
import React, { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdjustmentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [countedQty, setCountedQty] = useState<number | string>('');

  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products } = useCollection<Product>(productsCollection);

  const warehousesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
  const { data: warehouses } = useCollection<Warehouse>(warehousesCollection);

  const adjustmentsCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'stockAdjustments');
  }, [firestore, user?.uid]);
  const { data: adjustments, isLoading } = useCollection<StockAdjustment>(adjustmentsCollection);

  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const difference = useMemo(() => {
    if (selectedProduct && countedQty !== '' && typeof selectedProduct.stock === 'number') {
      return Number(countedQty) - selectedProduct.stock;
    }
    return 0;
  }, [selectedProduct, countedQty]);

  const handleApplyAdjustment = () => {
    if (!adjustmentsCollection || !selectedWarehouseId || !selectedProductId || countedQty === '') return;
    
    addDocumentNonBlocking(adjustmentsCollection, {
      warehouseId: selectedWarehouseId,
      productId: selectedProductId,
      countedQuantity: Number(countedQty),
      adjustmentDate: serverTimestamp(),
    }).then(() => {
        toast({
            title: "Adjustment Applied",
            description: "The stock level has been recorded.",
        });
        setSelectedProductId(null);
        setCountedQty('');
    });
  };

  const getProductName = (productId: string) => products?.find(p => p.id === productId)?.name || 'Unknown Product';
  const getWarehouseName = (warehouseId: string) => warehouses?.find(w => w.id === warehouseId)?.name || 'Unknown Warehouse';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stock Adjustments" />
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory Adjustment</CardTitle>
          <CardDescription>Correct stock levels by performing a physical count.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">1. Select Product & Location</h3>
                    <div className="space-y-2">
                        <Label>Select Warehouse</Label>
                        <Select onValueChange={setSelectedWarehouseId} value={selectedWarehouseId || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a warehouse..." />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Select Product</Label>
                        <Select onValueChange={setSelectedProductId} value={selectedProductId || ''} disabled={!selectedWarehouseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a product..." />
                            </SelectTrigger>
                            <SelectContent>
                                {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">2. Enter Counted Quantity</h3>
                     <div className="space-y-2">
                        <Label htmlFor="counted-qty">Counted Quantity</Label>
                        <Input 
                          id="counted-qty" 
                          type="number" 
                          placeholder="Enter the physical count"
                          value={countedQty}
                          onChange={e => setCountedQty(e.target.value)}
                          disabled={!selectedProductId}
                        />
                    </div>
                    {selectedProduct && (
                      <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Recorded Quantity: <span className="font-bold text-foreground">{(selectedProduct.stock || 0)} {selectedProduct.unitOfMeasure}</span></p>
                          <p className="text-sm text-muted-foreground">Difference: <span className={`font-bold ${difference > 0 ? 'text-green-500' : difference < 0 ? 'text-red-500' : ''}`}>{difference} {selectedProduct.unitOfMeasure}</span></p>
                      </div>
                    )}
                    <Button onClick={handleApplyAdjustment} disabled={!difference}>Apply Adjustment</Button>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">Recent Adjustments</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Counted Qty</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
                        {!isLoading && adjustments?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No adjustments found.</TableCell></TableRow>}
                        {adjustments?.map(adj => (
                           <TableRow key={adj.id}>
                                <TableCell>{getProductName(adj.productId)}</TableCell>
                                <TableCell>{getWarehouseName(adj.warehouseId)}</TableCell>
                                <TableCell>{adj.countedQuantity}</TableCell>
                                <TableCell>{adj.adjustmentDate?.toDate().toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}