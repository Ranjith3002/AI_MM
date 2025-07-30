using ai.mm as mm from '../db/src/schema';

service MaterialService @(path: '/odata/v4/material') {
  
  @odata.draft.enabled
  entity Materials as projection on mm.Materials;
  
  @odata.draft.enabled  
  entity Suppliers as projection on mm.Suppliers;
  
  @odata.draft.enabled
  entity PurchaseOrders as projection on mm.PurchaseOrders;
  
  entity StockMovements as projection on mm.StockMovements;
  
  // Actions
  action createPurchaseOrder(
    material: String,
    supplier: String, 
    quantity: Integer,
    unitPrice: Decimal,
    deliveryDate: Date,
    notes: String
  ) returns PurchaseOrders;
  
  action approvePurchaseOrder(orderID: UUID) returns PurchaseOrders;
  
  action receiveMaterial(
    orderID: UUID,
    receivedQuantity: Integer,
    location: String
  ) returns StockMovements;
}
