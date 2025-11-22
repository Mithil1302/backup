'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { Product, Warehouse } from "@/lib/types";
import React, { useMemo } from "react";
import { AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReorderSuggestion = {
  product: Product;
  currentStock: number;
  reorderLevel: number;
  suggestedQuantity: number;
};

export default function ReorderingPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const productsCollection = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);

  const warehousesCollection = useMemo(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
  const { data: warehouses } = useCollection<Warehouse>(warehousesCollection);

  const reorderSuggestions = useMemo((): ReorderSuggestion[] => {
    if (!products) return [];
    
    return products
      .filter(p => {
        const reorderLevel = p.reorderLevel || 10;
        return p.stock <= reorderLevel;
      })
      .map(p => {
        const reorderLevel = p.reorderLevel || 10;
        // Suggest ordering 2x the reorder level to have buffer
        const suggestedQuantity = Math.max((reorderLevel * 2) - p.stock, reorderLevel);
        
        return {
          product: p,
          currentStock: p.stock,
          reorderLevel,
          suggestedQuantity,
        };
      })
      .sort((a, b) => {
        // Sort by urgency: out of stock first, then by % below reorder level
        const aUrgency = a.currentStock === 0 ? 1000 : a.reorderLevel - a.currentStock;
        const bUrgency = b.currentStock === 0 ? 1000 : b.reorderLevel - b.currentStock;
        return bUrgency - aUrgency;
      });
  }, [products]);

  const handleCreatePurchaseOrder = async (suggestion: ReorderSuggestion) => {
    if (!firestore || !user?.uid) return;

    // In a real app, this would create a purchase order or receipt draft
    // For now, we'll just show a toast
    toast({
      title: "Purchase Order Created",
      description: `Created order for ${suggestion.suggestedQuantity} ${suggestion.product.unitOfMeasure} of ${suggestion.product.name}`,
    });
  };

  if (isUserLoading || isProductsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reordering Rules" />

      {reorderSuggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Stock Levels Good</h3>
            <p className="text-muted-foreground text-center">
              No products currently need reordering. All stock levels are above their reorder points.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Reorder Suggestions</CardTitle>
              </div>
              <CardDescription>
                Products that have reached or fallen below their reorder level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Suggested Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderSuggestions.map((suggestion) => (
                      <TableRow key={suggestion.product.id}>
                        <TableCell className="font-medium">{suggestion.product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{suggestion.product.sku}</TableCell>
                        <TableCell>
                          <span className={suggestion.currentStock === 0 ? "text-red-500 font-bold" : "text-yellow-600 font-bold"}>
                            {suggestion.currentStock} {suggestion.product.unitOfMeasure}
                          </span>
                        </TableCell>
                        <TableCell>{suggestion.reorderLevel} {suggestion.product.unitOfMeasure}</TableCell>
                        <TableCell className="font-semibold">
                          {suggestion.suggestedQuantity} {suggestion.product.unitOfMeasure}
                        </TableCell>
                        <TableCell>
                          {suggestion.currentStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                              Low Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleCreatePurchaseOrder(suggestion)}
                            className="flex items-center gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Create Order
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {reorderSuggestions.filter(s => s.currentStock === 0).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reorderSuggestions.filter(s => s.currentStock > 0).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Value Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reorderSuggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Units to order</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
