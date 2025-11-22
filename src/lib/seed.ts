import { collection, writeBatch, Firestore } from 'firebase/firestore';

const mockProducts = [
    { id: '1', name: 'Organic Bananas', sku: 'FR-BAN-001', categoryId: 'Fruits', stock: 1500, unitOfMeasure: 'kg' },
    { id: '2', name: 'Fresh Tomatoes', sku: 'VG-TOM-001', categoryId: 'Vegetables', stock: 250, unitOfMeasure: 'kg' },
    { id: '3', name: 'Whole Milk 1L', sku: 'DR-MLK-001', categoryId: 'Dairy', stock: 800, unitOfMeasure: 'units' },
    { id: '4', name: 'Sourdough Bread', sku: 'BK-BRD-001', categoryId: 'Bakery', stock: 75, unitOfMeasure: 'units' },
    { id: '5', name: 'Chicken Breast', sku: 'MT-CHK-001', categoryId: 'Meat', stock: 120, unitOfMeasure: 'kg' },
    { id: '6', name: 'Avocado', sku: 'FR-AVO-001', categoryId: 'Fruits', stock: 45, unitOfMeasure: 'units' },
    { id: '7', name: 'Cheddar Cheese', sku: 'DR-CHS-001', categoryId: 'Dairy', stock: 35, unitOfMeasure: 'kg' },
];

const mockWarehouses = [
    { id: '1', name: 'Main Warehouse', location: '123 Industrial Rd, City A', capacity: 10000 },
    { id: '2', name: 'Cold Storage Unit', location: '456 Cold St, City A', capacity: 5000 },
    { id: '3', name: 'Retail Backroom', location: '789 Market St, City B', capacity: 2000 },
];

const mockSuppliers = [
    { id: '1', name: 'Global Fresh Produce', contactEmail: 'contact@globalfresh.com' },
    { id: '2', name: 'Dairy Best Farms', contactEmail: 'sales@dairybest.com' },
    { id: '3', name: 'Artisan Breads Co.', contactEmail: 'orders@artisanbreads.com' },
];

const mockCustomers = [
    { id: '1', name: 'Corner Cafe', shippingAddress: '101 Maple St, City A', contactEmail: 'purchase@cornercafe.com' },
    { id: '2', name: 'The Grand Bistro', shippingAddress: '202 Oak Ave, City B', contactEmail: 'chef@grandbistro.com' },
    { id: '3', name: 'Healthy Eats Grocer', shippingAddress: '303 Pine Ln, City A', contactEmail: 'stock@healthyeats.com' },
];

export const seedDatabase = async (db: Firestore) => {
  const batch = writeBatch(db);

  // Seed Products
  const productsCol = collection(db, 'products');
  mockProducts.forEach(product => {
    const docRef = collection(productsCol).doc(); // Auto-generate ID
    batch.set(docRef, product);
  });

  // Seed Warehouses
  const warehousesCol = collection(db, 'warehouses');
  mockWarehouses.forEach(warehouse => {
    const docRef = collection(warehousesCol).doc(); // Auto-generate ID
    batch.set(docRef, warehouse);
  });

  // Seed Suppliers
  const suppliersCol = collection(db, 'suppliers');
  mockSuppliers.forEach(supplier => {
    const docRef = collection(suppliersCol).doc(); // Auto-generate ID
    batch.set(docRef, supplier);
  });

  // Seed Customers
  const customersCol = collection(db, 'customers');
  mockCustomers.forEach(customer => {
    const docRef = collection(customersCol).doc(); // Auto-generate ID
    batch.set(docRef, customer);
  });

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database: ', error);
  }
};
