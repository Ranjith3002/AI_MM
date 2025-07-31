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
    const {
      material,
      supplier,
      quantity,
      unitPrice,
      deliveryDate,
      notes,
      materialID,
      supplierID,
      unit,
      currency,
      aiRecommendation,
      isConfirmed,
      confirmedBy
    } = req.data;

    const count = await SELECT.one`count(*) as count`.from(PurchaseOrders);
    const poNumber = `PO-${new Date().getFullYear()}-${String(count.count + 1).padStart(3, '0')}`;

    const newPO = {
      poID: `PO-${String(count.count + 1).padStart(4, '0')}`,
      orderNumber: poNumber,
      materialID: materialID || null,
      material,
      supplierID: supplierID || null,
      supplier,
      quantity,
      unit: unit || 'PC',
      unitPrice,
      totalAmount: quantity * unitPrice,
      currency: currency || 'USD',
      status: 'Draft',
      deliveryDate,
      notes,
      requestedBy: req.user.id || 'System',
      generatedByAI: Boolean(aiRecommendation),
      aiRecommendation: aiRecommendation || null,
      isConfirmed: Boolean(isConfirmed),
      confirmedBy: isConfirmed ? (confirmedBy || req.user.id || 'System') : null,
      confirmedAt: isConfirmed ? new Date() : null
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

  // ===== SMART PO SUGGESTIONS =====

  // Function: Get AI-powered PO suggestions
  this.on('getPOSuggestions', async (req) => {
    try {
      console.log('🤖 Generating smart PO suggestions...');

      // Get low stock materials
      const lowStockMaterials = await SELECT.from(Materials)
        .where`stockQty < reorderLevel OR stockQty <= ${10}`;

      if (lowStockMaterials.length === 0) {
        return JSON.stringify({
          success: true,
          message: 'No materials require restocking at this time.',
          suggestions: []
        });
      }

      // Get active suppliers
      const suppliers = await SELECT.from(Suppliers).where({ isActive: true });

      if (suppliers.length === 0) {
        return JSON.stringify({
          success: false,
          message: 'No active suppliers found. Please activate suppliers before generating suggestions.',
          suggestions: []
        });
      }

      // Get usage logs for better recommendations
      const usageLogs = await SELECT.from(MaterialUsageLogs)
        .where`usedOn >= ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}`; // Last 90 days

      // Generate AI-powered suggestions
      const suggestions = await aiService.generatePOSuggestions(
        lowStockMaterials,
        suppliers,
        usageLogs
      );

      // Log the AI insight
      if (suggestions.length > 0) {
        await INSERT.into(AIInsights).entries({
          type: 'PO_SUGGESTIONS',
          query: `Generated ${suggestions.length} smart PO suggestions for low stock materials`,
          insight: `AI recommended purchase orders for ${suggestions.length} materials with total estimated value of $${suggestions.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toFixed(2)}`,
          confidence: 85.0,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }

      return JSON.stringify({
        success: true,
        message: `Generated ${suggestions.length} smart PO suggestions`,
        suggestions: suggestions,
        metadata: {
          lowStockCount: lowStockMaterials.length,
          activeSuppliers: suppliers.length,
          generatedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error generating PO suggestions:', error);
      return JSON.stringify({
        success: false,
        message: 'Failed to generate PO suggestions. Please try again later.',
        suggestions: [],
        error: error.message
      });
    }
  });

  // ===== EXPORT ACTIONS =====

  // Action: Export Purchase Orders to PDF
  this.on('exportPOsPDF', async (req) => {
    try {
      const purchaseOrders = await SELECT.from(PurchaseOrders).orderBy('createdAt desc');
      console.log(`Exporting ${purchaseOrders.length} purchase orders to PDF`);

      let pdfBuffer;
      try {
        pdfBuffer = await exportService.generatePOPDF(purchaseOrders);
      } catch (exportError) {
        console.error('Export service error, generating fallback PDF:', exportError);
        // Generate a simple fallback PDF
        pdfBuffer = await this._generateFallbackPDF(purchaseOrders);
      }

      // Set response headers for file download
      req._.res.setHeader('Content-Type', 'application/pdf');
      req._.res.setHeader('Content-Disposition', `attachment; filename="PO_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
      req._.res.setHeader('Content-Length', pdfBuffer.length);

      // Send the PDF buffer
      req._.res.end(pdfBuffer);

      return; // Don't return JSON, we're sending binary data

    } catch (error) {
      console.error('Error in exportPOsPDF:', error);
      req.error(500, 'Failed to generate PDF export: ' + error.message);
    }
  });

  // Action: Export Purchase Orders to Excel
  this.on('exportPOsExcel', async (req) => {
    try {
      const purchaseOrders = await SELECT.from(PurchaseOrders).orderBy('createdAt desc');
      console.log(`Exporting ${purchaseOrders.length} purchase orders to Excel`);

      let excelBuffer;
      try {
        excelBuffer = await exportService.generatePOExcel(purchaseOrders);
      } catch (exportError) {
        console.error('Export service error, generating fallback Excel:', exportError);
        // Generate a simple fallback Excel
        excelBuffer = await this._generateFallbackExcel(purchaseOrders);
      }

      // Set response headers for file download
      req._.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      req._.res.setHeader('Content-Disposition', `attachment; filename="PO_Data_${new Date().toISOString().split('T')[0]}.xlsx"`);
      req._.res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel buffer
      req._.res.end(excelBuffer);

      return; // Don't return JSON, we're sending binary data

    } catch (error) {
      console.error('Error in exportPOsExcel:', error);
      req.error(500, 'Failed to generate Excel export: ' + error.message);
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

  // Fallback PDF generation
  this._generateFallbackPDF = async function(purchaseOrders) {
    console.log('Generating fallback PDF for', purchaseOrders.length, 'purchase orders');

    const content = `Purchase Orders Report
Generated on: ${new Date().toLocaleDateString()}

${purchaseOrders.map(po =>
  `PO: ${po.orderNumber || 'N/A'}
Material: ${po.material || 'N/A'}
Supplier: ${po.supplier || 'N/A'}
Quantity: ${po.quantity || 0} ${po.unit || ''}
Amount: ${po.totalAmount || 0} ${po.currency_code || 'USD'}
Status: ${po.status || 'Draft'}
---`
).join('\n')}

Total Purchase Orders: ${purchaseOrders.length}`;

    // Return a simple text buffer (in real implementation, you'd use a PDF library)
    return Buffer.from(content, 'utf8');
  };

  // Fallback Excel generation
  this._generateFallbackExcel = async function(purchaseOrders) {
    console.log('Generating fallback Excel for', purchaseOrders.length, 'purchase orders');

    const csvContent = `Order Number,Material,Supplier,Quantity,Unit,Unit Price,Total Amount,Currency,Status,Delivery Date
${purchaseOrders.map(po =>
  `"${po.orderNumber || 'N/A'}","${po.material || 'N/A'}","${po.supplier || 'N/A'}","${po.quantity || 0}","${po.unit || ''}","${po.unitPrice || 0}","${po.totalAmount || 0}","${po.currency_code || 'USD'}","${po.status || 'Draft'}","${po.deliveryDate || ''}"`
).join('\n')}`;

    // Return CSV as buffer (in real implementation, you'd generate actual Excel)
    return Buffer.from(csvContent, 'utf8');
  };

});
