namespace ai.mm;

using { Currency, managed, cuid } from '@sap/cds/common';

entity Materials : cuid, managed {
  name        : String(100) @title: 'Material Name';
  description : String(500) @title: 'Description';
  category    : String(50)  @title: 'Category';
  unit        : String(10)  @title: 'Unit of Measure';
  unitPrice   : Decimal(15,2) @title: 'Unit Price';
  currency    : Currency @title: 'Currency';
  stockLevel  : Integer @title: 'Stock Level';
  minStock    : Integer @title: 'Minimum Stock';
  supplier    : String(100) @title: 'Default Supplier';
}

entity Suppliers : cuid, managed {
  name        : String(100) @title: 'Supplier Name';
  address     : String(500) @title: 'Address';
  contact     : String(100) @title: 'Contact Person';
  email       : String(100) @title: 'Email';
  phone       : String(50)  @title: 'Phone';
  rating      : Integer @title: 'Rating';
}

entity PurchaseOrders : cuid, managed {
  orderNumber   : String(20) @title: 'PO Number' @readonly;
  material      : String(100) @title: 'Material';
  supplier      : String(100) @title: 'Supplier';
  quantity      : Integer @title: 'Quantity';
  unit          : String(10) @title: 'Unit';
  unitPrice     : Decimal(15,2) @title: 'Unit Price';
  totalAmount   : Decimal(15,2) @title: 'Total Amount';
  currency      : Currency @title: 'Currency';
  status        : String(20) @title: 'Status' @default: 'Draft';
  deliveryDate  : Date @title: 'Delivery Date';
  notes         : String(500) @title: 'Notes';
  requestedBy   : String(100) @title: 'Requested By';
  approvedBy    : String(100) @title: 'Approved By';
  approvedAt    : DateTime @title: 'Approved At';
}

entity StockMovements : cuid, managed {
  material      : String(100) @title: 'Material';
  movementType  : String(20) @title: 'Movement Type'; // IN, OUT, TRANSFER
  quantity      : Integer @title: 'Quantity';
  unit          : String(10) @title: 'Unit';
  reference     : String(50) @title: 'Reference Document';
  location      : String(50) @title: 'Location';
  notes         : String(500) @title: 'Notes';
}
