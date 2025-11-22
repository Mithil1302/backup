'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, AlertTriangle, Warehouse as WarehouseIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Product, Warehouse } from "@/lib/types";
import React, { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const productsCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsCollection);
  
  const warehousesCollection = useMemo(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
  const { data: warehouses } = useCollection<Warehouse>(warehousesCollection);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingStockProduct, setViewingStockProduct] = useState<Product | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) return;

    const formData = new FormData(event.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      categoryId: formData.get('category') as string,
      unitOfMeasure: formData.get('uom') as string,
      stock: Number(formData.get('stock') || 0),
      reorderLevel: Number(formData.get('reorderLevel') || 10),
    };

    if (editingProduct) {
      // Update existing product
      const productDoc = doc(firestore, 'products', editingProduct.id);
      updateDocumentNonBlocking(productDoc, productData);
      toast({
        title: "Product Updated",
        description: `${productData.name} has been updated.`,
      });
    } else {
      // Add new product
      if (!productsCollection) return;
      addDocumentNonBlocking(productsCollection, productData).then(() => {
        toast({
            title: "Product Added",
            description: `${productData.name} has been added to your inventory.`,
        });
      });
    }

    handleSheetClose();
  };

  const handleDeleteProduct = (productId: string) => {
    if (!firestore) return;
    const productDoc = doc(firestore, 'products', productId);
    deleteDocumentNonBlocking(productDoc);
    toast({
        variant: "destructive",
        title: "Product Deleted",
        description: "The product has been removed from your inventory.",
    });
  };
  
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  }

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingProduct(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
             <Button size="sm" className="flex items-center gap-2" onClick={handleAddNewClick}>
              <PlusCircle className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingProduct ? 'Edit Product' : 'Add a new product'}</SheetTitle>
              <SheetDescription>
                {editingProduct ? 'Update the details of your product.' : 'Fill in the details below to create a new product in your inventory.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" defaultValue={editingProduct?.name} placeholder="Organic Bananas" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sku" className="text-right">SKU/Code</Label>
                <Input name="sku" id="sku" defaultValue={editingProduct?.sku} placeholder="FR-BAN-001" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category ID</Label>
                <Input name="category" id="category" defaultValue={editingProduct?.categoryId} placeholder="FRUITS" className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uom" className="text-right">Unit of Measure</Label>
                <Input name="uom" id="uom" defaultValue={editingProduct?.unitOfMeasure} placeholder="kg" className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Initial Stock</Label>
                <Input name="stock" id="stock" type="number" defaultValue={editingProduct?.stock || 0} placeholder="0" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reorderLevel" className="text-right">Reorder Level</Label>
                <Input name="reorderLevel" id="reorderLevel" type="number" defaultValue={editingProduct?.reorderLevel || 10} placeholder="10" className="col-span-3" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" type="button" onClick={handleSheetClose}>Cancel</Button>
                <Button type="submit">{editingProduct ? 'Save Changes' : 'Create Product'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>Manage your products and their stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
              {!isLoading && products.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No products found.</TableCell></TableRow>}
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell><Badge variant="outline">{product.categoryId}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn({ 
                        "text-red-500 font-bold": product.stock === 0, 
                        "text-yellow-600 font-bold": product.stock > 0 && product.stock <= (product.reorderLevel || 10)
                      })}>
                        {product.stock} {product.unitOfMeasure}
                      </span>
                      {product.stock === 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {product.stock > 0 && product.stock <= (product.reorderLevel || 10) && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingStockProduct(product)}>
                          View Stock by Warehouse
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warehouse Stock Dialog */}
      <Dialog open={!!viewingStockProduct} onOpenChange={() => setViewingStockProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarehouseIcon className="h-5 w-5" />
              Stock by Warehouse: {viewingStockProduct?.name}
            </DialogTitle>
            <DialogDescription>
              View stock levels across all warehouses for this product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses && warehouses.length > 0 ? (
                    warehouses.map((warehouse) => {
                      const stockInWarehouse = viewingStockProduct?.warehouseStock?.[warehouse.id] || 0;
                      return (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-medium">{warehouse.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{warehouse.location}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn({
                              "text-red-500 font-bold": stockInWarehouse === 0,
                              "text-yellow-600 font-bold": stockInWarehouse > 0 && stockInWarehouse <= (viewingStockProduct?.reorderLevel || 10) / warehouses.length,
                            })}>
                              {stockInWarehouse} {viewingStockProduct?.unitOfMeasure}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No warehouses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Stock:</span>
              <span className="font-bold text-lg">
                {viewingStockProduct?.stock} {viewingStockProduct?.unitOfMeasure}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
