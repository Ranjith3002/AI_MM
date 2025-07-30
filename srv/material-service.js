const cds = require('@sap/cds');
const aiService = require('./ai-service');
const exportService = require('./export-service');
require('dotenv').config();

module.exports = cds.service.impl(async function() {

  const { Materials, Suppliers, PurchaseOrders, StockMovements, MaterialUsageLogs, AIInsights } = this.entities;
  
  // Before READ Materials - calculate low stock flag
  this.before('READ', Materials, async (req) => {
    // This will be calculated in after READ
  });

  // After READ Materials - add computed fields
  this.after('READ', Materials, async (materials, req) => {
    if (Array.isArray(materials)) {
      materials.forEach(material => {
        material.lowStockFlag = (material.stockQty || 0) < (material.reorderLevel || 0);
      });
    } else if (materials) {
      materials.lowStockFlag = (materials.stockQty || 0) < (materials.reorderLevel || 0);
    }
  });

  // Before CREATE Materials - generate material ID
  this.before('CREATE', Materials, async (req) => {
    const { data } = req;
    if (!data.materialID) {
      const count = await SELECT.one`count(*) as count`.from(Materials);
      data.materialID = `MAT-${String(count.count + 1).padStart(4, '0')}`;
    }
  });

  // Before CREATE Suppliers - generate supplier ID
  this.before('CREATE', Suppliers, async (req) => {
    const { data } = req;
    if (!data.supplierID) {
      const count = await SELECT.one`count(*) as count`.from(Suppliers);
      data.supplierID = `SUP-${String(count.count + 1).padStart(4, '0')}`;
    }
  });

  // Before CREATE PurchaseOrder - generate IDs and calculate totals
  this.before('CREATE', PurchaseOrders, async (req) => {
    const { data } = req;

    // Generate PO ID and number
    const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
    data.poID = `PO-${String(count.count + 1).padStart(4, '0')}`;
    data.orderNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;

    // Calculate total amount
    if (data.quantity && data.unitPrice) {
      data.totalAmount = data.quantity * data.unitPrice;
    }

    // Set defaults
    data.currency = data.currency || 'USD';
    data.status = data.status || 'Draft';
    data.generatedByAI = data.generatedByAI || false;
  });
  
  // Before UPDATE PurchaseOrder - recalculate total
  this.before('UPDATE', PurchaseOrders, async (req) => {
    const { data } = req;
    if (data.quantity && data.unitPrice) {
      data.totalAmount = data.quantity * data.unitPrice;
    }
  });

  // ===== CORE ACTIONS =====

  // Action: Create Purchase Order
  this.on('createPurchaseOrder', async (req) => {
    const { material, supplier, quantity, unitPrice, deliveryDate, notes } = req.data;

    const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
    const poNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;

    const newPO = {
      poID: `PO-${String(count.count + 1).padStart(4, '0')}`,
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
      requestedBy: req.user.id || 'System',
      generatedByAI: false
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

    const po = await SELECT.one.from(PurchaseOrders).where({ ID: orderID });
    if (!po) {
      req.error(404, 'Purchase Order not found');
    }

    // Create stock movement
    const movement = {
      materialID: po.materialID,
      material: po.material,
      movementType: 'IN',
      quantity: receivedQuantity,
      unit: po.unit,
      reference: po.orderNumber,
      location: location || 'Main Warehouse',
      notes: `Received from PO ${po.orderNumber}`
    };

    const result = await INSERT.into(StockMovements).entries(movement);

    // Update material stock
    const material = await SELECT.one.from(Materials).where({ materialID: po.materialID });
    if (material) {
      await UPDATE(Materials)
        .set({ stockQty: (material.stockQty || 0) + receivedQuantity })
        .where({ materialID: po.materialID });
    }

    // Update PO status if fully received
    if (receivedQuantity >= po.quantity) {
      await UPDATE(PurchaseOrders)
        .set({ status: 'Delivered' })
        .where({ ID: orderID });
    }

    return await SELECT.one.from(StockMovements).where({ ID: result });
  });

  // ===== AI-POWERED ACTIONS =====

  // Action: Generate PO automatically for low stock materials
  this.on('generatePO', async (req) => {
    const { materialID } = req.data;

    try {
      // Get material details
      const material = await SELECT.one.from(Materials).where({ materialID });
      if (!material) {
        req.error(404, 'Material not found');
      }

      // Check if material is low stock
      if ((material.stockQty || 0) >= (material.reorderLevel || 0)) {
        return { message: 'Material stock is sufficient, no PO needed' };
      }

      // Get suppliers for this material
      const suppliers = await SELECT.from(Suppliers).where({ isActive: true });

      if (suppliers.length === 0) {
        req.error(400, 'No active suppliers found');
      }

      // Use AI to recommend best supplier
      const recommendation = await aiService.recommendSupplier(suppliers, material.name);
      const recommendedSupplier = suppliers.find(s => s.name === recommendation.supplier) || suppliers[0];

      // Calculate quantity (reorder to max stock or 2x reorder level)
      const targetQty = material.maxStock || (material.reorderLevel * 2);
      const orderQty = targetQty - (material.stockQty || 0);

      // Create PO
      const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
      const poNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;

      const newPO = {
        poID: `PO-${String(count.count + 1).padStart(4, '0')}`,
        orderNumber: poNumber,
        materialID: material.materialID,
        material: material.name,
        supplierID: recommendedSupplier.supplierID,
        supplier: recommendedSupplier.name,
        quantity: orderQty,
        unit: material.unit,
        unitPrice: recommendedSupplier.pricePerUnit || material.unitPrice,
        totalAmount: orderQty * (recommendedSupplier.pricePerUnit || material.unitPrice),
        currency: material.currency || 'USD',
        status: 'Draft',
        deliveryDate: new Date(Date.now() + (recommendedSupplier.deliveryTime || 7) * 24 * 60 * 60 * 1000),
        notes: `Auto-generated PO for low stock material. AI Recommendation: ${recommendation.reasoning}`,
        requestedBy: 'AI System',
        generatedByAI: true,
        aiRecommendation: JSON.stringify(recommendation)
      };

      const result = await INSERT.into(PurchaseOrders).entries(newPO);
      return await SELECT.one.from(PurchaseOrders).where({ ID: result });

    } catch (error) {
      console.error('Error in generatePO:', error);
      req.error(500, `Failed to generate PO: ${error.message}`);
    }
  });

  // Action: Recommend Supplier using AI
  this.on('recommendSupplier', async (req) => {
    const { materialID } = req.data;

    try {
      const material = await SELECT.one.from(Materials).where({ materialID });
      if (!material) {
        req.error(404, 'Material not found');
      }

      const suppliers = await SELECT.from(Suppliers).where({ isActive: true });
      if (suppliers.length === 0) {
        return 'No active suppliers found';
      }

      const recommendation = await aiService.recommendSupplier(suppliers, material.name);

      // Log AI insight
      await INSERT.into(AIInsights).entries({
        type: 'SUPPLIER_RECOMMENDATION',
        materialID: material.materialID,
        material: material.name,
        query: `Recommend supplier for ${material.name}`,
        insight: JSON.stringify(recommendation),
        confidence: 80.0,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      return JSON.stringify(recommendation);

    } catch (error) {
      console.error('Error in recommendSupplier:', error);
      return 'Failed to get supplier recommendation. Please select manually based on price and delivery time.';
    }
  });

  // Action: Analyze Usage Trends using AI
  this.on('analyzeUsageTrends', async (req) => {
    const { materialID } = req.data;

    try {
      const material = await SELECT.one.from(Materials).where({ materialID });
      if (!material) {
        req.error(404, 'Material not found');
      }

      // Get usage data from logs
      const usageLogs = await SELECT.from(MaterialUsageLogs)
        .where({ materialID })
        .orderBy('usedOn desc')
        .limit(12); // Last 12 entries

      if (usageLogs.length === 0) {
        return 'No usage data available for trend analysis';
      }

      // Group by month
      const monthlyUsage = {};
      usageLogs.forEach(log => {
        const month = new Date(log.usedOn).toISOString().substring(0, 7); // YYYY-MM
        monthlyUsage[month] = (monthlyUsage[month] || 0) + (log.usedQty || 0);
      });

      const usageData = Object.entries(monthlyUsage).map(([month, usage]) => ({ month, usage }));

      const analysis = await aiService.analyzeUsageTrends(usageData, material.name);

      // Log AI insight
      await INSERT.into(AIInsights).entries({
        type: 'USAGE_TREND',
        materialID: material.materialID,
        material: material.name,
        query: `Analyze usage trends for ${material.name}`,
        insight: analysis,
        confidence: 75.0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      return analysis;

    } catch (error) {
      console.error('Error in analyzeUsageTrends:', error);
      return 'Failed to analyze usage trends. Please review usage data manually.';
    }
  });

  // Action: Generate AI Suggestions for natural language queries
  this.on('generateAISuggestions', async (req) => {
    const { query } = req.data;

    try {
      // Get context data
      const totalMaterials = await SELECT.one`count(*) as count`.from(Materials);
      const lowStockMaterials = await SELECT.from(Materials).where`stockQty < reorderLevel`;
      const pendingPOs = await SELECT.from(PurchaseOrders).where({ status: 'Draft' });
      const topSuppliers = await SELECT.from(Suppliers)
        .where({ isActive: true })
        .orderBy('rating desc')
        .limit(3);

      const context = {
        totalMaterials: totalMaterials.count,
        lowStockItems: lowStockMaterials.length,
        pendingPOs: pendingPOs.length,
        topSuppliers: topSuppliers.map(s => s.name).join(', ')
      };

      const suggestions = await aiService.generateProcurementSuggestions(query, context);

      // Log AI insight
      await INSERT.into(AIInsights).entries({
        type: 'PROCUREMENT_SUGGESTION',
        query: query,
        insight: suggestions,
        confidence: 70.0,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      return suggestions;

    } catch (error) {
      console.error('Error in generateAISuggestions:', error);
      return 'Failed to generate AI suggestions. Please review your procurement data manually.';
    }
  });

  // ===== EXPORT ACTIONS =====

  // Action: Export Purchase Orders to PDF
  this.on('exportPOsPDF', async (req) => {
    try {
      const purchaseOrders = await SELECT.from(PurchaseOrders).orderBy('createdAt desc');
      const pdfBuffer = await exportService.generatePOPDF(purchaseOrders);

      // In a real implementation, you would save this to a file server or return a download URL
      // For now, we'll return a success message
      return 'PDF generated successfully. Download link would be provided in production.';

    } catch (error) {
      console.error('Error in exportPOsPDF:', error);
      req.error(500, 'Failed to generate PDF export');
    }
  });

  // Action: Export Purchase Orders to Excel
  this.on('exportPOsExcel', async (req) => {
    try {
      const purchaseOrders = await SELECT.from(PurchaseOrders).orderBy('createdAt desc');
      const excelBuffer = await exportService.generatePOExcel(purchaseOrders);

      // In a real implementation, you would save this to a file server or return a download URL
      return 'Excel file generated successfully. Download link would be provided in production.';

    } catch (error) {
      console.error('Error in exportPOsExcel:', error);
      req.error(500, 'Failed to generate Excel export');
    }
  });

  // Action: Export Materials to PDF
  this.on('exportMaterialsPDF', async (req) => {
    try {
      const materials = await SELECT.from(Materials).orderBy('name');
      const pdfBuffer = await exportService.generateMaterialsPDF(materials);

      return 'Materials PDF generated successfully. Download link would be provided in production.';

    } catch (error) {
      console.error('Error in exportMaterialsPDF:', error);
      req.error(500, 'Failed to generate Materials PDF export');
    }
  });

  // ===== UTILITY FUNCTIONS =====

  // Function: Get Low Stock Materials
  this.on('getLowStockMaterials', async (req) => {
    try {
      const materials = await SELECT.from(Materials).where`stockQty < reorderLevel`;
      return materials.map(m => ({
        ...m,
        lowStockFlag: true
      }));
    } catch (error) {
      console.error('Error in getLowStockMaterials:', error);
      return [];
    }
  });

  // Function: Get Usage Trends for a material
  this.on('getUsageTrends', async (req) => {
    const { materialID } = req.data;

    try {
      const usageLogs = await SELECT.from(MaterialUsageLogs)
        .where({ materialID })
        .orderBy('usedOn desc')
        .limit(12);

      // Group by month
      const monthlyUsage = {};
      usageLogs.forEach(log => {
        const month = new Date(log.usedOn).toISOString().substring(0, 7);
        monthlyUsage[month] = (monthlyUsage[month] || 0) + (log.usedQty || 0);
      });

      return JSON.stringify(monthlyUsage);

    } catch (error) {
      console.error('Error in getUsageTrends:', error);
      return '{}';
    }
  });

  // Function: Get Top Suppliers
  this.on('getTopSuppliers', async (req) => {
    try {
      const suppliers = await SELECT.from(Suppliers)
        .where({ isActive: true })
        .orderBy('rating desc', 'fulfillmentRate desc')
        .limit(5);

      return suppliers;
    } catch (error) {
      console.error('Error in getTopSuppliers:', error);
      return [];
    }
  });

});
