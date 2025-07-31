using ai.mm as mm from '../db/src/schema';

service MaterialService @(path: '/odata/v4/material') {

  @odata.draft.enabled
  entity Materials as projection on mm.Materials;

  @odata.draft.enabled
  entity Suppliers as projection on mm.Suppliers;

  @odata.draft.enabled
  entity PurchaseOrders as projection on mm.PurchaseOrders;

  entity StockMovements as projection on mm.StockMovements;
  entity MaterialUsageLogs as projection on mm.MaterialUsageLogs;
  entity AIInsights as projection on mm.AIInsights;

  // Core Actions
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

  // AI-Powered Actions
  action generatePO(materialID: String) returns PurchaseOrders;
  action recommendSupplier(materialID: String) returns String;
  action analyzeUsageTrends(materialID: String) returns String;
  action generateAISuggestions(query: String) returns String;

  // Smart PO Suggestions
  function getPOSuggestions() returns String;

  // Export Actions
  action exportPOsPDF() returns String;
  action exportPOsExcel() returns String;
  action exportMaterialsPDF() returns String;

  // Utility Functions
  function getLowStockMaterials() returns array of Materials;
  function getUsageTrends(materialID: String) returns String;
  function getTopSuppliers() returns array of Suppliers;
}
