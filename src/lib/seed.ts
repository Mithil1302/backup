import { collection, writeBatch, Firestore, Timestamp } from 'firebase/firestore';

const mockProducts = [
    { name: 'Organic Bananas', sku: 'FR-BAN-001', categoryId: 'Fruits', stock: 1500, unitOfMeasure: 'kg' },
    { name: 'Fresh Tomatoes', sku: 'VG-TOM-001', categoryId: 'Vegetables', stock: 250, unitOfMeasure: 'kg' },
    { name: 'Whole Milk 1L', sku: 'DR-MLK-001', categoryId: 'Dairy', stock: 800, unitOfMeasure: 'units' },
    { name: 'Sourdough Bread', sku: 'BK-BRD-001', categoryId: 'Bakery', stock: 75, unitOfMeasure: 'units' },
    { name: 'Chicken Breast', sku: 'MT-CHK-001', categoryId: 'Meat', stock: 120, unitOfMeasure: 'kg' },
    { name: 'Avocado', sku: 'FR-AVO-001', categoryId: 'Fruits', stock: 45, unitOfMeasure: 'units' },
    { name: 'Cheddar Cheese', sku: 'DR-CHS-001', categoryId: 'Dairy', stock: 35, unitOfMeasure: 'kg' },
    { name: 'Organic Apples', sku: 'FR-APP-001', categoryId: 'Fruits', stock: 300, unitOfMeasure: 'kg' },
    { name: 'Carrots', sku: 'VG-CAR-001', categoryId: 'Vegetables', stock: 150, unitOfMeasure: 'kg' },
    { name: 'Free-Range Eggs', sku: 'DR-EGG-001', categoryId: 'Dairy', stock: 500, unitOfMeasure: 'dozens' },
];

const mockCategories = [
    { name: 'Fruits' },
    { name: 'Vegetables' },
    { name: 'Dairy' },
    { name: 'Bakery' },
    { name: 'Meat' },
];

const mockWarehouses = [
    { name: 'Main Warehouse', location: '123 Industrial Rd, City A', capacity: 10000 },
    { name: 'Cold Storage Unit', location: '456 Cold St, City A', capacity: 5000 },
    { name: 'Retail Backroom', location: '789 Market St, City B', capacity: 2000 },
];

const mockSuppliers = [
    { name: 'Global Fresh Produce', contactEmail: 'contact@globalfresh.com' },
    { name: 'Dairy Best Farms', contactEmail: 'sales@dairybest.com' },
    { name: 'Artisan Breads Co.', contactEmail: 'orders@artisanbreads.com' },
    { name: 'Quality Meats Inc.', contactEmail: 'sales@qualitymeats.com' },
];

const mockCustomers = [
    { name: 'Corner Cafe', shippingAddress: '101 Maple St, City A', contactEmail: 'purchase@cornercafe.com' },
    { name: 'The Grand Bistro', shippingAddress: '202 Oak Ave, City B', contactEmail: 'chef@grandbistro.com' },
    { name: 'Healthy Eats Grocer', shippingAddress: '303 Pine Ln, City A', contactEmail: 'stock@healthyeats.com' },
];

export const seedDatabase = async (db: Firestore, userId: string) => {
  const batch = writeBatch(db);

  // Helper to get a random document ID from a seeded collection
  const getRandomId = (collection: {id: string}[]) => {
    return collection[Math.floor(Math.random() * collection.length)].id;
  };
  
  const seededProducts: {id: string, [key:string]: any}[] = [];
  const productsCol = collection(db, 'products');
  mockProducts.forEach(product => {
    const docRef = collection(productsCol).doc();
    batch.set(docRef, product);
    seededProducts.push({ ...product, id: docRef.id });
  });

  const seededWarehouses: {id: string, [key:string]: any}[] = [];
  const warehousesCol = collection(db, 'warehouses');
  mockWarehouses.forEach(warehouse => {
    const docRef = collection(warehousesCol).doc();
    batch.set(docRef, warehouse);
    seededWarehouses.push({ ...warehouse, id: docRef.id });
  });

  const seededSuppliers: {id: string, [key:string]: any}[] = [];
  const suppliersCol = collection(db, 'suppliers');
  mockSuppliers.forEach(supplier => {
    const docRef = collection(suppliersCol).doc();
    batch.set(docRef, supplier);
    seededSuppliers.push({ ...supplier, id: docRef.id });
  });

  const seededCustomers: {id: string, [key:string]: any}[] = [];
  const customersCol = collection(db, 'customers');
  mockCustomers.forEach(customer => {
    const docRef = collection(customersCol).doc();
    batch.set(docRef, customer);
    seededCustomers.push({ ...customer, id: docRef.id });
  });

  const categoriesCol = collection(db, 'categories');
  mockCategories.forEach(category => {
    const docRef = collection(categoriesCol).doc();
    batch.set(docRef, category);
  });

  // Seed user-specific data
  const userPath = `users/${userId}`;

  const receiptsCol = collection(db, userPath, 'receipts');
  const mockReceipts = [
    { supplierId: getRandomId(seededSuppliers), receiptDate: Timestamp.fromDate(new Date('2024-05-20')), status: 'Done' },
    { supplierId: getRandomId(seededSuppliers), receiptDate: Timestamp.fromDate(new Date('2024-05-22')), status: 'Ready' },
  ];
  mockReceipts.forEach(receipt => {
      const docRef = collection(receiptsCol).doc();
      batch.set(docRef, receipt);
  });

  const deliveriesCol = collection(db, userPath, 'deliveryOrders');
  const mockDeliveries = [
    { customerId: getRandomId(seededCustomers), deliveryDate: Timestamp.fromDate(new Date('2024-05-21')), status: 'Done' },
    { customerId: getRandomId(seededCustomers), deliveryDate: Timestamp.fromDate(new Date('2024-05-23')), status: 'Waiting' },
  ];
  mockDeliveries.forEach(delivery => {
      const docRef = collection(deliveriesCol).doc();
      batch.set(docRef, delivery);
  });
  
  const transfersCol = collection(db, userPath, 'internalTransfers');
  const mockTransfers = [
    { fromWarehouseId: seededWarehouses[0].id, toWarehouseId: seededWarehouses[1].id, productId: seededProducts[0].id, quantity: 100, transferDate: Timestamp.fromDate(new Date('2024-05-19')), status: 'Done' },
  ];
  mockTransfers.forEach(transfer => {
      const docRef = collection(transfersCol).doc();
      batch.set(docRef, transfer);
  });
  
  const adjustmentsCol = collection(db, userPath, 'stockAdjustments');
  const mockAdjustments = [
      { warehouseId: seededWarehouses[0].id, productId: seededProducts[1].id, countedQuantity: 245, adjustmentDate: Timestamp.fromDate(new Date('2024-05-18')) }
  ];
  mockAdjustments.forEach(adj => {
      const docRef = collection(adjustmentsCol).doc();
      batch.set(docRef, adj);
  })

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database: ', error);
  }
};
