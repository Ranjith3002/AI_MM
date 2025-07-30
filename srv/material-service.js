const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { Materials, Suppliers, PurchaseOrders, StockMovements } = this.entities;
  
  // Before CREATE PurchaseOrder - generate order number
  this.before('CREATE', PurchaseOrders, async (req) => {
    const { data } = req;
    
    // Generate PO number
    const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
    const poNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;
    data.orderNumber = poNumber;
    
    // Calculate total amount
    if (data.quantity && data.unitPrice) {
      data.totalAmount = data.quantity * data.unitPrice;
    }
    
    // Set default currency if not provided
    if (!data.currency) {
      data.currency = 'USD';
    }
    
    // Set default status
    if (!data.status) {
      data.status = 'Draft';
    }
  });
  
  // Before UPDATE PurchaseOrder - recalculate total
  this.before('UPDATE', PurchaseOrders, async (req) => {
    const { data } = req;
    
    if (data.quantity && data.unitPrice) {
      data.totalAmount = data.quantity * data.unitPrice;
    }
  });
  
  // Action: Create Purchase Order
  this.on('createPurchaseOrder', async (req) => {
    const { material, supplier, quantity, unitPrice, deliveryDate, notes } = req.data;
    
    // Generate PO number
    const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
    const poNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;
    
    const newPO = {
      orderNumber: poNumber,
      material,
      supplier,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      currency: 'USD',
      status: 'Draft',
      deliveryDate,
      notes,
      requestedBy: req.user.id || 'System'
    };
    
    const result = await INSERT.into(PurchaseOrders).entries(newPO);
    return await SELECT.one.from(PurchaseOrders).where({ ID: result });
  });
  
  // Action: Approve Purchase Order
  this.on('approvePurchaseOrder', async (req) => {
    const { orderID } = req.data;
    
    await UPDATE(PurchaseOrders)
      .set({
        status: 'Approved',
        approvedBy: req.user.id || 'System',
        approvedAt: new Date()
      })
      .where({ ID: orderID });
    
    return await SELECT.one.from(PurchaseOrders).where({ ID: orderID });
  });
  
  // Action: Receive Material
  this.on('receiveMaterial', async (req) => {
    const { orderID, receivedQuantity, location } = req.data;
    
    // Get the PO details
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: orderID });
    
    if (!po) {
      req.error(404, 'Purchase Order not found');
    }
    
    // Create stock movement
    const movement = {
      material: po.material,
      movementType: 'IN',
      quantity: receivedQuantity,
      unit: po.unit,
      reference: po.orderNumber,
      location: location || 'Main Warehouse',
      notes: `Received from PO ${po.orderNumber}`
    };
    
    const result = await INSERT.into(StockMovements).entries(movement);
    
    // Update PO status if fully received
    if (receivedQuantity >= po.quantity) {
      await UPDATE(PurchaseOrders)
        .set({ status: 'Delivered' })
        .where({ ID: orderID });
    }
    
    return await SELECT.one.from(StockMovements).where({ ID: result });
  });
  
});
