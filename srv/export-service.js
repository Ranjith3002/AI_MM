const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExportService {
  
  /**
   * Generate PDF for Purchase Orders
   * @param {Array} purchaseOrders - Array of PO data
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generatePOPDF(purchaseOrders) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        
        // Header
        doc.fontSize(20).text('Purchase Orders Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);
        
        // Table headers
        const startY = doc.y;
        const colWidths = [80, 120, 100, 80, 80, 80];
        const headers = ['PO Number', 'Material', 'Supplier', 'Quantity', 'Amount', 'Status'];
        
        let currentX = 50;
        headers.forEach((header, i) => {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(header, currentX, startY, { width: colWidths[i], align: 'left' });
          currentX += colWidths[i];
        });
        
        doc.moveDown();
        
        // Table data
        purchaseOrders.forEach((po, index) => {
          const rowY = doc.y;
          currentX = 50;
          
          const rowData = [
            po.orderNumber || 'N/A',
            po.material || 'N/A',
            po.supplier || 'N/A',
            `${po.quantity || 0} ${po.unit || ''}`,
            `${po.totalAmount || 0} ${po.currency_code || 'USD'}`,
            po.status || 'Draft'
          ];
          
          rowData.forEach((data, i) => {
            doc.fontSize(9).font('Helvetica')
               .text(data.toString(), currentX, rowY, { 
                 width: colWidths[i], 
                 align: 'left',
                 height: 20
               });
            currentX += colWidths[i];
          });
          
          doc.moveDown(0.5);
          
          // Add page break if needed
          if (doc.y > 700) {
            doc.addPage();
          }
        });
        
        // Footer
        doc.fontSize(8).text(`Total Purchase Orders: ${purchaseOrders.length}`, 50, doc.page.height - 50);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Generate Excel for Purchase Orders
   * @param {Array} purchaseOrders - Array of PO data
   * @returns {Promise<Buffer>} - Excel buffer
   */
  async generatePOExcel(purchaseOrders) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Orders');
    
    // Set column headers
    worksheet.columns = [
      { header: 'PO Number', key: 'orderNumber', width: 15 },
      { header: 'Material', key: 'material', width: 25 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Currency', key: 'currency_code', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Requested By', key: 'requestedBy', width: 15 },
      { header: 'AI Generated', key: 'generatedByAI', width: 12 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add data rows
    purchaseOrders.forEach(po => {
      worksheet.addRow({
        orderNumber: po.orderNumber,
        material: po.material,
        supplier: po.supplier,
        quantity: po.quantity,
        unit: po.unit,
        unitPrice: po.unitPrice,
        totalAmount: po.totalAmount,
        currency_code: po.currency_code,
        status: po.status,
        deliveryDate: po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '',
        createdAt: po.createdAt ? new Date(po.createdAt).toLocaleString() : '',
        requestedBy: po.requestedBy,
        generatedByAI: po.generatedByAI ? 'Yes' : 'No'
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 10);
    });
    
    // Add summary row
    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = 'SUMMARY';
    summaryRow.getCell(1).font = { bold: true };
    
    const totalAmount = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    summaryRow.getCell(7).value = totalAmount;
    summaryRow.getCell(7).font = { bold: true };
    
    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Generate Materials Report PDF
   * @param {Array} materials - Array of material data
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateMaterialsPDF(materials) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        
        // Header
        doc.fontSize(20).text('Materials Inventory Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);
        
        // Summary statistics
        const lowStockCount = materials.filter(m => m.lowStockFlag).length;
        const totalValue = materials.reduce((sum, m) => sum + ((m.stockQty || 0) * (m.unitPrice || 0)), 0);
        
        doc.fontSize(12).font('Helvetica-Bold').text('Summary:', 50);
        doc.fontSize(10).font('Helvetica')
           .text(`Total Materials: ${materials.length}`)
           .text(`Low Stock Items: ${lowStockCount}`)
           .text(`Total Inventory Value: $${totalValue.toFixed(2)}`)
           .moveDown(2);
        
        // Table headers
        const startY = doc.y;
        const colWidths = [100, 80, 80, 80, 80];
        const headers = ['Material', 'Stock Qty', 'Reorder Level', 'Unit Price', 'Status'];
        
        let currentX = 50;
        headers.forEach((header, i) => {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(header, currentX, startY, { width: colWidths[i], align: 'left' });
          currentX += colWidths[i];
        });
        
        doc.moveDown();
        
        // Table data
        materials.forEach((material) => {
          const rowY = doc.y;
          currentX = 50;
          
          const rowData = [
            material.name || 'N/A',
            `${material.stockQty || 0}`,
            `${material.reorderLevel || 0}`,
            `$${material.unitPrice || 0}`,
            material.lowStockFlag ? 'LOW STOCK' : 'OK'
          ];
          
          rowData.forEach((data, i) => {
            const color = (i === 4 && material.lowStockFlag) ? 'red' : 'black';
            doc.fontSize(9).font('Helvetica').fillColor(color)
               .text(data.toString(), currentX, rowY, { 
                 width: colWidths[i], 
                 align: 'left',
                 height: 20
               });
            currentX += colWidths[i];
          });
          
          doc.fillColor('black'); // Reset color
          doc.moveDown(0.5);
          
          // Add page break if needed
          if (doc.y > 700) {
            doc.addPage();
          }
        });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ExportService();
