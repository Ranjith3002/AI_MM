const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = process.env.GEMINI_API_URL;
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Generate content using Gemini AI
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<string>} - AI generated response
   */
  async generateContent(prompt) {
    try {
      console.log('🤖 Calling Gemini AI with prompt:', prompt.substring(0, 100) + '...');
      
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
          ]
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
      return 'Material usage shows consistent patterns. Monitor stock levels regularly and consider seasonal variations in demand. Recommend maintaining safety stock levels.';
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
}

module.exports = new AIService();
