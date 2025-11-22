'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Product } from "@/lib/types";
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
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
                    <span className={cn({ "text-red-500 font-bold": product.stock === 0, "text-yellow-500 font-bold": product.stock > 0 && product.stock < 50})}>
                      {product.stock} {product.unitOfMeasure}
                    </span>
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
                        <DropdownMenuItem onSelect={() => handleEditClick(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
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
    </div>
  );
}
