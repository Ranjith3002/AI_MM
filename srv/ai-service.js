const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC8yBMwSj3ipoM03yWPNyLYDUMcsbLKN4k';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.timeout = 15000; // 15 seconds timeout
    this.maxRetries = 2;
  }

  /**
   * Generate content using Gemini AI
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<string>} - AI generated response
   */
  async generateContent(prompt, retryCount = 0) {
    try {
      console.log('🤖 Calling Gemini AI with prompt:', prompt.substring(0, 100) + '...');

      // Validate API key
      if (!this.apiKey || this.apiKey === 'your-api-key-here') {
        throw new Error('Invalid or missing Gemini API key');
      }

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log('✅ Gemini AI response received:', aiResponse.substring(0, 100) + '...');
        return aiResponse;
      } else {
        throw new Error('Invalid response format from Gemini AI');
      }
    } catch (error) {
      console.error('❌ Gemini AI Error:', error.message);

      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }

      // Retry logic
      if (retryCount < this.maxRetries && error.response?.status !== 403) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.generateContent(prompt, retryCount + 1);
      }

      console.log('🔄 Using fallback response for prompt type');
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Get fallback response when AI fails
   * @param {string} prompt - Original prompt
   * @returns {string} - Fallback response
   */
  getFallbackResponse(prompt) {
    console.log('🔄 Using fallback response for prompt type');
    
    if (prompt.includes('supplier') || prompt.includes('recommendation')) {
      return 'Based on historical data, I recommend selecting the supplier with the best balance of price, delivery time, and fulfillment rate. Consider suppliers with fulfillment rates above 90% and competitive pricing.';
    }
    
    if (prompt.includes('usage') || prompt.includes('trend')) {
      return 'Material usage analysis shows consistent consumption patterns. Monitor stock levels regularly and consider seasonal variations in demand. Recommend maintaining optimal inventory levels based on historical usage data.';
    }
    
    if (prompt.includes('procurement') || prompt.includes('purchase')) {
      return 'For optimal procurement, consider bulk purchasing for frequently used materials, negotiate better terms with reliable suppliers, and maintain adequate safety stock levels.';
    }
    
    return 'AI analysis temporarily unavailable. Please review the data manually and make decisions based on historical patterns and business requirements.';
  }

  /**
   * Analyze material usage trends
   * @param {Array} usageData - Material usage data
   * @param {string} materialName - Material name
   * @returns {Promise<string>} - Usage trend analysis
   */
  async analyzeUsageTrends(usageData, materialName) {
    const prompt = `
    Analyze the following material usage data for "${materialName}":
    
    ${usageData.map(item => `Month: ${item.month}, Usage: ${item.usage} units`).join('\n')}
    
    Please provide:
    1. Overall trend (increasing/decreasing/stable)
    2. Percentage change from previous periods
    3. Seasonal patterns if any
    4. Recommendations for stock management
    
    Keep the response concise and actionable (max 200 words).
    `;
    
    return await this.generateContent(prompt);
  }

  /**
   * Recommend best supplier based on criteria
   * @param {Array} suppliers - List of suppliers with their data
   * @param {string} materialName - Material name
   * @returns {Promise<Object>} - Supplier recommendation with reasoning
   */
  async recommendSupplier(suppliers, materialName) {
    const prompt = `
    Recommend the best supplier for "${materialName}" from the following options:
    
    ${suppliers.map((s, i) => `
    Supplier ${i + 1}: ${s.name}
    - Price per unit: $${s.pricePerUnit}
    - Delivery time: ${s.deliveryTime} days
    - Fulfillment rate: ${s.fulfillmentRate}%
    - Rating: ${s.rating}/5
    `).join('\n')}
    
    Consider price, delivery time, fulfillment rate, and rating. 
    Provide:
    1. Recommended supplier name
    2. Brief reasoning (max 100 words)
    3. Risk assessment
    
    Format as JSON: {"supplier": "name", "reasoning": "text", "riskLevel": "low/medium/high"}
    `;
    
    const response = await this.generateContent(prompt);
    
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse JSON, using fallback');
    }
    
    // Fallback: recommend supplier with best overall score
    const bestSupplier = suppliers.reduce((best, current) => {
      const currentScore = (current.fulfillmentRate * 0.4) + 
                          ((100 - current.deliveryTime) * 0.3) + 
                          (current.rating * 20 * 0.2) + 
                          ((1 / current.pricePerUnit) * 100 * 0.1);
      const bestScore = (best.fulfillmentRate * 0.4) + 
                       ((100 - best.deliveryTime) * 0.3) + 
                       (best.rating * 20 * 0.2) + 
                       ((1 / best.pricePerUnit) * 100 * 0.1);
      return currentScore > bestScore ? current : best;
    });
    
    return {
      supplier: bestSupplier.name,
      reasoning: `Selected based on optimal balance of fulfillment rate (${bestSupplier.fulfillmentRate}%), delivery time (${bestSupplier.deliveryTime} days), and competitive pricing.`,
      riskLevel: bestSupplier.fulfillmentRate > 95 ? 'low' : bestSupplier.fulfillmentRate > 85 ? 'medium' : 'high'
    };
  }

  /**
   * Generate procurement suggestions based on query
   * @param {string} query - Natural language query
   * @param {Object} context - Additional context data
   * @returns {Promise<string>} - AI generated suggestions
   */
  async generateProcurementSuggestions(query, context = {}) {
    const prompt = `
    As a procurement AI assistant, answer this query: "${query}"

    Context data available:
    - Total materials: ${context.totalMaterials || 'N/A'}
    - Low stock items: ${context.lowStockItems || 'N/A'}
    - Pending POs: ${context.pendingPOs || 'N/A'}
    - Top suppliers: ${context.topSuppliers || 'N/A'}

    Provide actionable insights and recommendations in a professional tone.
    Keep response under 300 words.
    `;

    return await this.generateContent(prompt);
  }

  /**
   * Generate smart PO suggestions based on low stock materials and supplier data
   * @param {Array} lowStockMaterials - Materials with low stock
   * @param {Array} suppliers - Available suppliers
   * @param {Array} usageLogs - Historical usage data
   * @returns {Promise<Array>} - Array of PO suggestions
   */
  async generatePOSuggestions(lowStockMaterials, suppliers, usageLogs = []) {
    try {
      console.log('🤖 Generating AI-powered PO suggestions...');

      if (!lowStockMaterials || lowStockMaterials.length === 0) {
        return [];
      }

      const suggestions = [];

      for (const material of lowStockMaterials) {
        // Find suitable suppliers for this material
        const suitableSuppliers = suppliers.filter(s =>
          s.isActive &&
          (s.name.toLowerCase().includes(material.category?.toLowerCase() || '') ||
           material.supplier?.toLowerCase().includes(s.name.toLowerCase()) ||
           s.rating >= 3)
        );

        if (suitableSuppliers.length === 0) continue;

        // Calculate suggested quantity
        const currentStock = material.stockQty || 0;
        const reorderLevel = material.reorderLevel || 10;
        const maxStock = material.maxStock || 100;
        const avgUsage = material.avgMonthlyUsage || 5;

        // Smart quantity calculation: fill to 80% of max stock or 3 months of usage
        const targetQty = Math.min(
          Math.floor(maxStock * 0.8),
          avgUsage * 3,
          maxStock
        );
        const suggestedQty = Math.max(targetQty - currentStock, reorderLevel);

        // Use AI to select best supplier and generate reasoning
        const supplierRecommendation = await this.recommendSupplierWithAI(
          material,
          suitableSuppliers,
          usageLogs
        );

        const bestSupplier = suitableSuppliers.find(s =>
          s.name === supplierRecommendation.supplier
        ) || suitableSuppliers[0];

        // Calculate delivery date
        const deliveryDays = bestSupplier.deliveryTime || 7;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

        // Create suggestion
        const suggestion = {
          materialID: material.materialID,
          materialName: material.name,
          category: material.category,
          currentStock: currentStock,
          reorderLevel: reorderLevel,
          suggestedQuantity: suggestedQty,
          unit: material.unit || 'PC',
          supplierID: bestSupplier.supplierID,
          supplierName: bestSupplier.name,
          unitPrice: bestSupplier.pricePerUnit || material.unitPrice || 0,
          totalAmount: suggestedQty * (bestSupplier.pricePerUnit || material.unitPrice || 0),
          currency: material.currency || 'USD',
          deliveryDate: deliveryDate.toISOString().split('T')[0],
          deliveryTime: deliveryDays,
          supplierRating: bestSupplier.rating || 3,
          fulfillmentRate: bestSupplier.fulfillmentRate || 95,
          aiReasoning: supplierRecommendation.reasoning,
          riskLevel: supplierRecommendation.riskLevel,
          priority: this.calculatePriority(material, currentStock, reorderLevel, avgUsage),
          urgency: currentStock <= (reorderLevel * 0.5) ? 'High' : currentStock <= reorderLevel ? 'Medium' : 'Low'
        };

        suggestions.push(suggestion);
      }

      // Sort by priority and urgency
      suggestions.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          const urgencyOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return b.priority - a.priority;
      });

      console.log(`✅ Generated ${suggestions.length} AI-powered PO suggestions`);
      return suggestions;

    } catch (error) {
      console.error('❌ Error generating PO suggestions:', error);
      return this.getFallbackPOSuggestions(lowStockMaterials, suppliers);
    }
  }

  /**
   * Recommend supplier using AI analysis
   * @param {Object} material - Material data
   * @param {Array} suppliers - Available suppliers
   * @param {Array} usageLogs - Usage history
   * @returns {Promise<Object>} - Supplier recommendation with reasoning
   */
  async recommendSupplierWithAI(material, suppliers, usageLogs) {
    const prompt = `
    As a procurement AI, recommend the best supplier for "${material.name}" (Category: ${material.category || 'N/A'}).

    Available suppliers:
    ${suppliers.map(s => `
    - ${s.name}: Rating ${s.rating}/5, Delivery ${s.deliveryTime} days, Fulfillment ${s.fulfillmentRate}%, Price $${s.pricePerUnit || 'N/A'}
    `).join('')}

    Material details:
    - Current stock: ${material.stockQty || 0}
    - Reorder level: ${material.reorderLevel || 10}
    - Average monthly usage: ${material.avgMonthlyUsage || 'N/A'}

    Consider: delivery time, fulfillment rate, price, rating, and reliability.

    Respond in JSON format:
    {
      "supplier": "supplier_name",
      "reasoning": "detailed_explanation_under_100_words",
      "riskLevel": "low|medium|high"
    }
    `;

    const response = await this.generateContent(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse AI supplier recommendation, using fallback');
    }

    // Fallback logic
    const bestSupplier = suppliers.reduce((best, current) => {
      const bestScore = (best.rating || 0) * 0.3 + (best.fulfillmentRate || 0) * 0.4 + (10 - (best.deliveryTime || 10)) * 0.3;
      const currentScore = (current.rating || 0) * 0.3 + (current.fulfillmentRate || 0) * 0.4 + (10 - (current.deliveryTime || 10)) * 0.3;
      return currentScore > bestScore ? current : best;
    });

    return {
      supplier: bestSupplier.name,
      reasoning: `Selected based on optimal balance of rating (${bestSupplier.rating}/5), fulfillment rate (${bestSupplier.fulfillmentRate}%), and delivery time (${bestSupplier.deliveryTime} days).`,
      riskLevel: bestSupplier.fulfillmentRate > 95 ? 'low' : bestSupplier.fulfillmentRate > 85 ? 'medium' : 'high'
    };
  }

  /**
   * Calculate priority score for material
   * @param {Object} material - Material data
   * @param {number} currentStock - Current stock level
   * @param {number} reorderLevel - Reorder threshold
   * @param {number} avgUsage - Average monthly usage
   * @returns {number} - Priority score (higher = more urgent)
   */
  calculatePriority(material, currentStock, reorderLevel, avgUsage) {
    let priority = 0;

    // Stock level urgency (0-40 points)
    const stockRatio = currentStock / (reorderLevel || 1);
    if (stockRatio <= 0.5) priority += 40;
    else if (stockRatio <= 0.8) priority += 30;
    else if (stockRatio <= 1.0) priority += 20;
    else priority += 10;

    // Usage frequency (0-30 points)
    if (avgUsage > 50) priority += 30;
    else if (avgUsage > 20) priority += 20;
    else if (avgUsage > 5) priority += 10;

    // Category importance (0-20 points)
    const criticalCategories = ['safety', 'electrical', 'raw materials'];
    if (criticalCategories.some(cat =>
      material.category?.toLowerCase().includes(cat) ||
      material.name?.toLowerCase().includes(cat)
    )) {
      priority += 20;
    }

    // Time since last order (0-10 points)
    if (material.lastUsed) {
      const daysSinceLastUse = (new Date() - new Date(material.lastUsed)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse > 30) priority += 10;
      else if (daysSinceLastUse > 14) priority += 5;
    }

    return Math.min(priority, 100);
  }

  /**
   * Fallback PO suggestions when AI fails
   * @param {Array} lowStockMaterials - Materials with low stock
   * @param {Array} suppliers - Available suppliers
   * @returns {Array} - Basic PO suggestions
   */
  getFallbackPOSuggestions(lowStockMaterials, suppliers) {
    console.log('🔄 Using fallback PO suggestion logic');

    return lowStockMaterials.slice(0, 5).map(material => {
      const suitableSuppliers = suppliers.filter(s => s.isActive);
      const bestSupplier = suitableSuppliers.reduce((best, current) => {
        const bestScore = (best.rating || 0) + (best.fulfillmentRate || 0) / 10;
        const currentScore = (current.rating || 0) + (current.fulfillmentRate || 0) / 10;
        return currentScore > bestScore ? current : best;
      }, suitableSuppliers[0] || {});

      const suggestedQty = Math.max(
        (material.maxStock || 100) - (material.stockQty || 0),
        material.reorderLevel || 10
      );

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + (bestSupplier.deliveryTime || 7));

      return {
        materialID: material.materialID,
        materialName: material.name,
        category: material.category,
        currentStock: material.stockQty || 0,
        reorderLevel: material.reorderLevel || 10,
        suggestedQuantity: suggestedQty,
        unit: material.unit || 'PC',
        supplierID: bestSupplier.supplierID || 'SUP-0001',
        supplierName: bestSupplier.name || 'Default Supplier',
        unitPrice: bestSupplier.pricePerUnit || material.unitPrice || 10,
        totalAmount: suggestedQty * (bestSupplier.pricePerUnit || material.unitPrice || 10),
        currency: material.currency || 'USD',
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        deliveryTime: bestSupplier.deliveryTime || 7,
        supplierRating: bestSupplier.rating || 3,
        fulfillmentRate: bestSupplier.fulfillmentRate || 95,
        aiReasoning: 'Fallback recommendation based on supplier rating and fulfillment rate.',
        riskLevel: 'medium',
        priority: 50,
        urgency: (material.stockQty || 0) <= (material.reorderLevel || 10) ? 'High' : 'Medium'
      };
    });
  }
}

module.exports = new AIService();
