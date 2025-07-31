# AI-Powered Smart PO Suggestions Feature

## Overview
This feature adds intelligent Purchase Order (PO) suggestions to the Material Management system using Google Gemini AI. The system analyzes low stock materials, supplier ratings, delivery times, and fulfillment history to generate smart PO recommendations.

## Architecture

### Backend Components

#### 1. Database Schema Extensions
- **File**: `db/src/schema.cds`
- **Changes**: Added confirmation tracking fields to PurchaseOrders entity:
  - `isConfirmed`: Boolean flag for suggestions that were confirmed
  - `confirmedBy`: User who confirmed the suggestion
  - `confirmedAt`: Timestamp of confirmation

#### 2. Service Definition
- **File**: `srv/material-service.cds`
- **Changes**: Added `getPOSuggestions()` function endpoint

#### 3. AI Service Enhancement
- **File**: `srv/ai-service.js`
- **Changes**: 
  - Added Gemini AI API key configuration
  - Implemented `generatePOSuggestions()` method
  - Added intelligent supplier recommendation logic
  - Implemented priority calculation algorithm

#### 4. Material Service Implementation
- **File**: `srv/material-service.js`
- **Changes**:
  - Implemented `getPOSuggestions` endpoint handler
  - Enhanced `createPurchaseOrder` to handle confirmation fields
  - Added AI insights logging

### Frontend Components

#### 1. SuggestedPOs Controller
- **File**: `app/po-ui/webapp/controller/SuggestedPOs.controller.js`
- **Features**:
  - Loads AI-generated PO suggestions
  - Displays suggestions in table format
  - Handles PO confirmation and generation
  - Provides fallback sample data

#### 2. SuggestedPOs View
- **File**: `app/po-ui/webapp/view/SuggestedPOs.view.xml`
- **Features**:
  - Responsive table with suggestion details
  - Priority indicators and urgency states
  - Supplier ratings and risk assessment
  - Confirm & Generate PO buttons

#### 3. Navigation Integration
- **Files**: `app/po-ui/webapp/manifest.json`, `view/Main.view.xml`, `controller/Main.controller.js`
- **Changes**: Added routing and navigation for Suggested POs view

## API Endpoints

### GET /odata/v4/material/getPOSuggestions()
Returns AI-generated PO suggestions in JSON format.

**Response Structure**:
```json
{
  "success": true,
  "message": "Generated N smart PO suggestions",
  "suggestions": [
    {
      "materialID": "MAT-0001",
      "materialName": "Steel Rods 10mm",
      "category": "Raw Materials",
      "currentStock": 5,
      "reorderLevel": 50,
      "suggestedQuantity": 100,
      "unit": "PC",
      "supplierID": "SUP-0001",
      "supplierName": "MetalCorp Industries",
      "unitPrice": 12.50,
      "totalAmount": 1250.00,
      "currency": "USD",
      "deliveryDate": "2024-08-15",
      "deliveryTime": 7,
      "supplierRating": 4,
      "fulfillmentRate": 98,
      "aiReasoning": "Critical low stock situation...",
      "riskLevel": "low",
      "urgency": "High",
      "priority": 95
    }
  ],
  "metadata": {
    "lowStockCount": 3,
    "activeSuppliers": 5,
    "generatedAt": "2024-07-31T10:00:00Z",
    "validUntil": "2024-08-01T10:00:00Z"
  }
}
```

### POST /odata/v4/material/createPurchaseOrder
Enhanced to handle confirmation fields from AI suggestions.

**Request Body** (additional fields):
```json
{
  "materialID": "MAT-0001",
  "material": "Steel Rods 10mm",
  "supplierID": "SUP-0001",
  "supplier": "MetalCorp Industries",
  "quantity": 100,
  "unit": "PC",
  "unitPrice": 12.50,
  "currency": "USD",
  "deliveryDate": "2024-08-15",
  "notes": "AI-Generated PO from suggestion",
  "aiRecommendation": "Critical low stock situation...",
  "isConfirmed": true,
  "confirmedBy": "User"
}
```

## AI Logic

### Suggestion Generation Process
1. **Data Collection**: Retrieves low stock materials, active suppliers, and usage history
2. **Supplier Matching**: Finds suitable suppliers based on category, ratings, and history
3. **Quantity Calculation**: Uses smart algorithms considering:
   - Current stock vs reorder level
   - Maximum stock capacity
   - Average monthly usage
   - Safety stock requirements
4. **AI Analysis**: Uses Gemini AI to:
   - Select optimal suppliers
   - Generate reasoning explanations
   - Assess risk levels
5. **Priority Scoring**: Calculates urgency and priority based on:
   - Stock level criticality
   - Usage frequency
   - Category importance
   - Time since last order

### Fallback Logic
- Provides intelligent fallbacks when AI service is unavailable
- Uses rule-based supplier selection
- Maintains system functionality without AI dependency

## Configuration

### Environment Variables
```bash
GEMINI_API_KEY=AIzaSyAwIPGaUbMhqmTTNTKQEeI_buF2ehmXQ6k
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

## Usage

### Accessing the Feature
1. Navigate to the main dashboard
2. Click "Suggested POs" button
3. View AI-generated suggestions
4. Click "Confirm & Generate PO" for desired suggestions

### Testing
Run the test script to verify functionality:
```bash
node test-po-suggestions.js
```

## Future Enhancements
- Machine learning model training on historical data
- Advanced demand forecasting
- Seasonal adjustment algorithms
- Multi-criteria supplier optimization
- Integration with external market data
- Automated approval workflows

## Security Considerations
- API key management through environment variables
- User authentication for PO confirmation
- Audit trail for AI-generated decisions
- Data privacy compliance for supplier information
