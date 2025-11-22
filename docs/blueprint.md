# **App Name**: GreenGrocer IMS

## Core Features:

- User Authentication: Secure user sign-up/log-in with OTP-based password reset, redirecting to the Inventory Dashboard upon successful login.
- Inventory Dashboard: Provides a real-time snapshot of inventory operations, including total products, low/out-of-stock items, pending receipts/deliveries, and internal transfers. Displayed as KPIs.
- Product Management: Enables creating and updating product details with name, SKU, category, unit of measure, and optional initial stock. Displays stock availability per location and allows setting reordering rules.
- Receipts Management: Facilitates managing incoming stock from vendors, including creating receipts, adding suppliers and products, inputting received quantities, and automatic stock updates upon validation.
- Delivery Orders Management: Supports managing outgoing stock for customer shipments, with steps for picking, packing, and validating items. Automatically updates stock levels upon validation.
- Internal Transfers Management: Manages stock movement within the company, tracking location changes. All movements are logged in the ledger.
- Stock Adjustments Management: Allows fixing mismatches between recorded stock and physical counts by selecting a product/location, entering the counted quantity, and auto-updating the system with a logged adjustment.

## Style Guidelines:

- Primary color: Forest green (#388E3C) to convey freshness and organic quality, aligning with a grocery warehouse theme.
- Background color: Light green (#E8F5E9), a desaturated shade of forest green, provides a clean and fresh backdrop.
- Accent color: Yellow-green (#AEEA00) used for CTAs and important UI elements to add vibrancy and highlight key actions.
- Body and headline font: 'PT Sans', a humanist sans-serif for a modern, approachable feel. Its neutrality makes it suitable for both headings and body text, providing good readability across the application.
- Use green-themed icons representing product categories and warehouse operations, ensuring they are easily recognizable and clickable. Should evoke a sense of freshness and efficiency.
- Responsive and clickable design, optimized for various screen sizes, including mobile devices. Use of card-based layouts for displaying inventory data and product information to facilitate easy navigation.
- Subtle animations when loading new inventory data or adjusting stock levels to enhance the user experience without being intrusive.