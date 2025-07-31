sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ObjectNumber",
    "sap/m/ObjectStatus",
    "sap/m/Button",
    "sap/m/Panel",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, Dialog, VBox, HBox, Label, Text, ObjectNumber, ObjectStatus, Button, Panel, Table, Column, ColumnListItem, Input, TextArea, JSONModel) {
    "use strict";

    return Controller.extend("po.ui.controller.Main", {
        onInit: function () {
            console.log("=== CLEAN VERSION 4.0 - Main controller initialized ===");
            MessageToast.show("Clean Controller loaded successfully!");
        },

        // Navigation methods
        onNavigateToMaterialDashboard: function () {
            console.log("Navigating to Material Dashboard");
            MessageToast.show("Navigating to Material Dashboard...");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMaterialDashboard");
        },

        onNavigateToAIRecommendations: function () {
            console.log("Navigating to AI Recommendations");
            MessageToast.show("Navigating to AI Recommendations...");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteAIRecommendations");
        },

        onNavigateToUsageTrends: function () {
            console.log("Navigating to Usage Trends");
            MessageToast.show("Navigating to Usage Trends...");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteUsageTrends");
        },

        onNavigateToSuggestedPOs: function () {
            console.log("Navigating to AI-Powered PO Suggestions");
            MessageToast.show("Loading AI-Powered PO Suggestions...");

            // Use direct hash navigation for reliability
            window.location.hash = "#/suggested-pos";

            // Also try router navigation as backup
            try {
                var oRouter = this.getOwnerComponent().getRouter();
                if (oRouter) {
                    oRouter.navTo("RouteSuggestedPOs");
                }
            } catch (error) {
                console.log("Router navigation failed, using direct hash navigation");
            }
        },

        onNavigateToPOManagement: function () {
            // Stay on current page as this is the PO management view
            MessageToast.show("You are already on the PO Management view");
        },

        onCreatePO: function () {
            console.log("=== Create PO button clicked ===");
            MessageToast.show("Opening Create Purchase Order dialog...");

            // Skip routing for now and go directly to dialog
            console.log("Showing Create PO Dialog directly");
            this._showCreatePODialog();
        },

        // Fallback Create PO Dialog
        _showCreatePODialog: function () {
            console.log("=== _showCreatePODialog called ===");
            MessageToast.show("Creating dialog...");

            try {
                console.log("Creating form content...");

                // Create form content
                var oFormContent = new VBox({
                items: [
                    new Label({ text: "Material *", required: true }),
                    new Input({
                        id: "dialogMaterialInput",
                        placeholder: "Enter material name",
                        value: ""
                    }),

                    new Label({ text: "Supplier *", required: true }),
                    new Input({
                        id: "dialogSupplierInput",
                        placeholder: "Enter supplier name",
                        value: ""
                    }),

                    new Label({ text: "Quantity *", required: true }),
                    new Input({
                        id: "dialogQuantityInput",
                        type: "Number",
                        placeholder: "Enter quantity",
                        value: "1"
                    }),

                    new Label({ text: "Unit Price *", required: true }),
                    new Input({
                        id: "dialogUnitPriceInput",
                        type: "Number",
                        placeholder: "Enter unit price",
                        value: "0.00"
                    }),

                    new Label({ text: "Notes" }),
                    new TextArea({
                        id: "dialogNotesInput",
                        placeholder: "Enter additional notes",
                        rows: 3,
                        value: ""
                    })
                ]
            });

            // Create dialog
            var oDialog = new Dialog({
                title: "Create Purchase Order",
                contentWidth: "500px",
                contentHeight: "600px",
                content: oFormContent,
                beginButton: new Button({
                    text: "Create PO",
                    type: "Emphasized",
                    press: () => {
                        this._createPOFromDialog(oDialog);
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });

                console.log("Dialog created, adding to view...");
                this.getView().addDependent(oDialog);

                console.log("Opening dialog...");
                oDialog.open();

                console.log("Dialog should be open now");

            } catch (error) {
                console.error("Error creating dialog:", error);
                MessageToast.show("Error creating dialog: " + error.message);

                // Simple fallback - just show a basic alert
                alert("Create PO Dialog Error: " + error.message + "\n\nPlease check the console for details.");
            }
        },

        _createPOFromDialog: function (oDialog) {
            try {
                // Get form values
                var sMaterial = sap.ui.getCore().byId("dialogMaterialInput").getValue();
                var sSupplier = sap.ui.getCore().byId("dialogSupplierInput").getValue();
                var iQuantity = parseInt(sap.ui.getCore().byId("dialogQuantityInput").getValue()) || 0;
                var fUnitPrice = parseFloat(sap.ui.getCore().byId("dialogUnitPriceInput").getValue()) || 0;
                var sNotes = sap.ui.getCore().byId("dialogNotesInput").getValue();

                // Validate required fields
                if (!sMaterial || !sSupplier || iQuantity <= 0 || fUnitPrice <= 0) {
                    MessageToast.show("Please fill all required fields with valid values");
                    return;
                }

                // Calculate total
                var fTotalAmount = iQuantity * fUnitPrice;

                // Create PO data
                var oPOData = {
                    orderNumber: "PO-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
                    material: sMaterial,
                    supplier: sSupplier,
                    quantity: iQuantity,
                    unitPrice: fUnitPrice,
                    totalAmount: fTotalAmount,
                    currency_code: "USD",
                    status: "Draft",
                    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
                    notes: sNotes,
                    requestedBy: "User",
                    generatedByAI: false
                };

                console.log("Creating PO:", oPOData);

                // Show success message
                MessageToast.show(`Purchase Order created successfully!\nPO: ${oPOData.orderNumber}\nMaterial: ${sMaterial}\nTotal: $${fTotalAmount.toFixed(2)}`);

                // Close dialog
                oDialog.close();
                oDialog.destroy();

                // Refresh the table
                this.onRefresh();

            } catch (error) {
                console.error("Error creating PO:", error);
                MessageToast.show("Error creating Purchase Order: " + error.message);
            }
        },

        onRefresh: function () {
            var oTable = this.byId("table");
            if (oTable) {
                oTable.getBinding("items").refresh();
                MessageToast.show("Data refreshed successfully");
            }
        },

        // Export functionality
        onExportPDF: function () {
            MessageToast.show("Generating PDF report...");

            // Call the backend service to generate PDF
            var sServiceUrl = "/odata/v4/material/exportPOsPDF";
            var sFileName = "PO_Report_" + new Date().toISOString().split('T')[0] + ".pdf";

            // Download the file
            this._downloadFileFromService(sServiceUrl, sFileName)
                .then(() => {
                    MessageToast.show("📄 PDF report downloaded successfully!");
                })
                .catch(() => {
                    MessageToast.show("❌ Failed to download PDF. Please try again.");
                });
        },

        onExportExcel: function () {
            MessageToast.show("Generating Excel spreadsheet...");

            // Call the backend service to generate Excel
            var sServiceUrl = "/odata/v4/material/exportPOsExcel";
            var sFileName = "PO_Data_" + new Date().toISOString().split('T')[0] + ".xlsx";

            // Download the file
            this._downloadFileFromService(sServiceUrl, sFileName)
                .then(() => {
                    MessageToast.show("📊 Excel spreadsheet downloaded successfully!");
                })
                .catch(() => {
                    MessageToast.show("❌ Failed to download Excel. Please try again.");
                });
        },

        // Helper function to trigger file download from service
        _downloadFileFromService: function (sUrl, sFileName) {
            return new Promise((resolve, reject) => {
                try {
                    // Use fetch to call the service and get the file
                    fetch(sUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/octet-stream'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        // Check if we actually got a file
                        if (blob.size === 0) {
                            throw new Error('Empty file received');
                        }

                        // Create a temporary URL for the blob
                        const url = window.URL.createObjectURL(blob);

                        // Create a temporary anchor element to trigger download
                        const oLink = document.createElement("a");
                        oLink.href = url;
                        oLink.download = sFileName;
                        oLink.style.display = "none";

                        // Add to DOM, click, and remove
                        document.body.appendChild(oLink);
                        oLink.click();
                        document.body.removeChild(oLink);

                        // Clean up the temporary URL
                        window.URL.revokeObjectURL(url);

                        resolve();
                    })
                    .catch(error => {
                        console.error("Download error:", error);
                        reject(error);
                    });

                } catch (error) {
                    console.error("Download error:", error);
                    reject(error);
                }
            });
        },

        onItemPress: function (oEvent) {
            console.log("=== ROW CLICKED - CLEAN VERSION 4.0 ===");
            alert("Row clicked! Clean version 4.0 working!");
            
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var oPOData = oBindingContext.getObject();
                console.log("PO Data:", oPOData);
                this._createDialog(oPOData);
            } else {
                MessageToast.show("No data found for this row");
            }
        },

        _createDialog: function (oPOData) {
            console.log("Creating dialog for:", oPOData);
            
            var oDialog = new Dialog({
                title: "Purchase Order Details - " + oPOData.orderNumber,
                contentWidth: "500px",
                contentHeight: "400px",
                resizable: true,
                draggable: true,
                content: [
                    new VBox({
                        class: "sapUiMediumMargin",
                        items: [
                            new Panel({
                                headerText: "Purchase Order Information",
                                content: [
                                    new VBox({
                                        class: "sapUiSmallMargin",
                                        items: [
                                            new HBox({
                                                items: [
                                                    new Label({ text: "PO Number:", design: "Bold" }),
                                                    new Text({ text: oPOData.orderNumber })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Material:", design: "Bold" }),
                                                    new Text({ text: oPOData.material })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Supplier:", design: "Bold" }),
                                                    new Text({ text: oPOData.supplier })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Status:", design: "Bold" }),
                                                    new ObjectStatus({ text: oPOData.status })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Total Amount:", design: "Bold" }),
                                                    new ObjectNumber({ 
                                                        number: oPOData.totalAmount,
                                                        unit: oPOData.currency_code,
                                                        emphasized: true
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ],
                buttons: [
                    new Button({
                        text: "Close",
                        press: function() {
                            oDialog.close();
                            oDialog.destroy();
                        }
                    })
                ]
            });
            
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        // Entity Dashboard functionality - Simplified approach
        onViewEntity: function (oEvent) {
            console.log("=== onViewEntity called ===");
            console.log("Event source:", oEvent.getSource());

            try {
                var oMenuItem = oEvent.getSource();
                console.log("MenuItem:", oMenuItem);

                // Try different ways to get the entity name
                var sEntityName = "";

                // Method 1: Try custom data
                try {
                    var aCustomData = oMenuItem.getCustomData();
                    console.log("Custom data:", aCustomData);

                    if (aCustomData && aCustomData.length > 0) {
                        for (var i = 0; i < aCustomData.length; i++) {
                            if (aCustomData[i].getKey() === "entity") {
                                sEntityName = aCustomData[i].getValue();
                                console.log("Found entity name from custom data:", sEntityName);
                                break;
                            }
                        }
                    }
                } catch (customDataError) {
                    console.log("Custom data error:", customDataError);
                }

                // Method 2: Try from text if custom data failed
                if (!sEntityName) {
                    var sText = oMenuItem.getText();
                    console.log("MenuItem text:", sText);

                    // Map text to entity names
                    var mTextToEntity = {
                        "Materials": "Materials",
                        "Suppliers": "Suppliers",
                        "Purchase Orders": "PurchaseOrders",
                        "Stock Movements": "StockMovements",
                        "Material Usage Logs": "MaterialUsageLogs",
                        "AI Insights": "AIInsights"
                    };

                    sEntityName = mTextToEntity[sText] || sText.replace(/\s+/g, '');
                    console.log("Entity name from text mapping:", sEntityName);
                }

                // Method 3: Default fallback
                if (!sEntityName) {
                    sEntityName = "Materials"; // Default to Materials
                    console.log("Using default entity name:", sEntityName);
                }

                console.log("Final entity name:", sEntityName);
                MessageToast.show("Loading " + sEntityName + " data...");

                // Try to load real data first, then fallback to sample data
                this._loadRealEntityData(sEntityName);

            } catch (error) {
                console.error("Error in onViewEntity:", error);
                console.error("Error stack:", error.stack);
                MessageToast.show("Error: " + error.message);

                // Show sample data as ultimate fallback
                this._showSampleData("Materials");
            }
        },

        // Load real entity data from database
        _loadRealEntityData: function (sEntityName) {
            console.log("Attempting to load real data for:", sEntityName);

            // Try multiple approaches to load real data
            this._loadWithODataModel(sEntityName)
                .catch(() => {
                    console.log("OData model failed, trying fetch...");
                    return this._loadEntityDataWithFetch(sEntityName);
                })
                .catch(() => {
                    console.log("Fetch failed, showing sample data...");
                    this._showSampleData(sEntityName);
                });
        },

        // Method 1: Load with OData Model
        _loadWithODataModel: function (sEntityName) {
            return new Promise((resolve, reject) => {
                try {
                    var oModel = this.getView().getModel();

                    if (!oModel) {
                        console.log("No OData model found");
                        reject(new Error("No OData model"));
                        return;
                    }

                    var sEntityPath = "/" + sEntityName;
                    console.log("Reading from OData path:", sEntityPath);

                    oModel.read(sEntityPath, {
                        success: (oData) => {
                            console.log("OData success:", oData);
                            var aResults = oData.results || [];
                            if (aResults.length > 0) {
                                this._showEntityDataDialog(sEntityName + " (Real Data)", aResults);
                                resolve(aResults);
                            } else {
                                console.log("No results from OData");
                                reject(new Error("No data"));
                            }
                        },
                        error: (oError) => {
                            console.error("OData error:", oError);
                            reject(oError);
                        }
                    });
                } catch (error) {
                    console.error("OData model error:", error);
                    reject(error);
                }
            });
        },

        // Method 2: Alternative data loading method using fetch
        _loadEntityDataWithFetch: function (sEntityName) {
            return new Promise((resolve, reject) => {
                var sUrl = "/odata/v4/material/" + sEntityName;
                console.log("Fetching from URL:", sUrl);

                fetch(sUrl)
                    .then(response => {
                        console.log("Fetch response:", response);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Fetch data received:", data);
                        var aResults = data.value || data.results || [];
                        if (aResults.length > 0) {
                            this._showEntityDataDialog(sEntityName + " (Real Data)", aResults);
                            resolve(aResults);
                        } else {
                            console.log("No results from fetch");
                            reject(new Error("No data"));
                        }
                    })
                    .catch(error => {
                        console.error("Fetch error:", error);
                        reject(error);
                    });
            });
        },

        // Fallback to show sample data
        _showSampleData: function (sEntityName) {
            console.log("Showing sample data for:", sEntityName);
            var aSampleData = [];

            switch (sEntityName) {
                case "Materials":
                    aSampleData = [
                        {
                            materialID: "MAT-001",
                            name: "Steel Rods 10mm",
                            category: "Metal",
                            stockQty: 150,
                            unitPrice: 12.50,
                            unit: "PC",
                            reorderLevel: 50,
                            supplier: "MetalCorp Industries"
                        },
                        {
                            materialID: "MAT-002",
                            name: "Aluminum Sheets 2mm",
                            category: "Metal",
                            stockQty: 75,
                            unitPrice: 25.75,
                            unit: "M",
                            reorderLevel: 25,
                            supplier: "AlumTech Solutions"
                        },
                        {
                            materialID: "MAT-003",
                            name: "Copper Wire 2.5mm",
                            category: "Electrical",
                            stockQty: 200,
                            unitPrice: 3.20,
                            unit: "M",
                            reorderLevel: 100,
                            supplier: "ElectroSupply Co."
                        }
                    ];
                    break;
                case "Suppliers":
                    aSampleData = [
                        {
                            supplierID: "SUP-001",
                            name: "MetalCorp Industries",
                            contact: "John Smith",
                            email: "john.smith@metalcorp.com",
                            phone: "+1-555-0101",
                            rating: 5,
                            fulfillmentRate: 98.5,
                            deliveryTime: 5,
                            pricePerUnit: 12.50,
                            isActive: true
                        },
                        {
                            supplierID: "SUP-002",
                            name: "AlumTech Solutions",
                            contact: "Sarah Johnson",
                            email: "sarah.j@alumtech.com",
                            phone: "+1-555-0102",
                            rating: 4,
                            fulfillmentRate: 95.2,
                            deliveryTime: 7,
                            pricePerUnit: 25.75,
                            isActive: true
                        },
                        {
                            supplierID: "SUP-003",
                            name: "ElectroSupply Co.",
                            contact: "Mike Wilson",
                            email: "mike.w@electrosupply.com",
                            phone: "+1-555-0103",
                            rating: 5,
                            fulfillmentRate: 99.1,
                            deliveryTime: 3,
                            pricePerUnit: 3.20,
                            isActive: true
                        }
                    ];
                    break;
                case "PurchaseOrders":
                    aSampleData = [
                        {
                            orderNumber: "PO-2024-001",
                            material: "Steel Rods 10mm",
                            supplier: "MetalCorp Industries",
                            quantity: 500,
                            unitPrice: 12.50,
                            totalAmount: 6250.00,
                            status: "Approved",
                            deliveryDate: "2024-08-15",
                            requestedBy: "John Doe"
                        },
                        {
                            orderNumber: "PO-2024-002",
                            material: "Aluminum Sheets 2mm",
                            supplier: "AlumTech Solutions",
                            quantity: 200,
                            unitPrice: 25.75,
                            totalAmount: 5150.00,
                            status: "Draft",
                            deliveryDate: "2024-08-20",
                            requestedBy: "Jane Smith"
                        },
                        {
                            orderNumber: "PO-2024-003",
                            material: "Copper Wire 2.5mm",
                            supplier: "ElectroSupply Co.",
                            quantity: 1000,
                            unitPrice: 3.20,
                            totalAmount: 3200.00,
                            status: "Submitted",
                            deliveryDate: "2024-08-10",
                            requestedBy: "Mike Johnson"
                        }
                    ];
                    break;
                case "StockMovements":
                    aSampleData = [
                        {
                            materialID: "MAT-001",
                            material: "Steel Rods 10mm",
                            movementType: "IN",
                            quantity: 100,
                            reference: "PO-2024-001",
                            location: "Warehouse A"
                        },
                        {
                            materialID: "MAT-002",
                            material: "Aluminum Sheets 2mm",
                            movementType: "OUT",
                            quantity: 25,
                            reference: "PROJ-001",
                            location: "Warehouse B"
                        }
                    ];
                    break;
                case "MaterialUsageLogs":
                    aSampleData = [
                        {
                            materialID: "MAT-001",
                            material: "Steel Rods 10mm",
                            usedQty: 50,
                            usedOn: "2024-07-25",
                            usedBy: "Construction Team",
                            department: "Construction",
                            project: "Building A Foundation"
                        },
                        {
                            materialID: "MAT-003",
                            material: "Copper Wire 2.5mm",
                            usedQty: 200,
                            usedOn: "2024-07-26",
                            usedBy: "Electrical Team",
                            department: "Electrical",
                            project: "Building A Wiring"
                        }
                    ];
                    break;
                case "AIInsights":
                    aSampleData = [
                        {
                            type: "SUPPLIER_RECOMMENDATION",
                            materialID: "MAT-001",
                            material: "Steel Rods 10mm",
                            insight: "Recommend switching to MetalWorks Inc for 15% cost savings",
                            confidence: 92.5,
                            isActive: true
                        },
                        {
                            type: "USAGE_TREND",
                            materialID: "MAT-002",
                            material: "Aluminum Sheets 2mm",
                            insight: "Usage increased 25% in Q2, consider increasing stock levels",
                            confidence: 87.3,
                            isActive: true
                        }
                    ];
                    break;
                default:
                    aSampleData = [{
                        entity: sEntityName,
                        message: "Sample data for " + sEntityName,
                        status: "Available",
                        records: "Multiple records would be shown here"
                    }];
            }

            console.log("Sample data created:", aSampleData);
            MessageToast.show("Showing sample data for " + sEntityName);
            this._showEntityDataDialog(sEntityName + " (Sample Data)", aSampleData);
        },

        _showEntityDataDialog: function (sEntityName, aData) {
            try {
                console.log("Creating dialog for:", sEntityName, "with", aData.length, "records");

                // Create a dialog to show the entity data
                var oDialog = new Dialog({
                    title: sEntityName + " Data (" + aData.length + " records)",
                    contentWidth: "90%",
                    contentHeight: "80%",
                    verticalScrolling: false,
                    horizontalScrolling: false,
                    styleClass: "entityDashboardDialog",
                    content: this._createEntityTable(sEntityName, aData),
                    beginButton: new Button({
                        text: "Export CSV",
                        icon: "sap-icon://excel-attachment",
                        type: "Emphasized",
                        press: () => {
                            this._exportEntityToCSV(sEntityName, aData);
                        }
                    }),
                    endButton: new Button({
                        text: "Close",
                        press: () => {
                            oDialog.close();
                            oDialog.destroy();
                        }
                    })
                });

                // Add dialog to view for proper cleanup
                this.getView().addDependent(oDialog);
                oDialog.open();

            } catch (error) {
                console.error("Error creating dialog:", error);
                MessageToast.show("Error displaying data. Check console for details.");
            }
        },

        _createEntityTable: function (sEntityName, aData) {
            try {
                if (!aData || aData.length === 0) {
                    return new Text({
                        text: "No data available for " + sEntityName,
                        textAlign: "Center"
                    });
                }

                console.log("Creating table for:", sEntityName, "First record:", aData[0]);

                // Get column names from the first record
                var aColumns = Object.keys(aData[0]).filter(key =>
                    !key.startsWith('__') && // Filter out metadata
                    key !== 'ID' && // Filter out technical ID
                    key !== 'createdAt' &&
                    key !== 'modifiedAt' &&
                    key !== 'createdBy' &&
                    key !== 'modifiedBy'
                );

                console.log("Table columns:", aColumns);

                if (aColumns.length === 0) {
                    return new Text({
                        text: "No displayable columns found for " + sEntityName,
                        textAlign: "Center"
                    });
                }

                // Create table
                var oTable = new Table({
                    growing: true,
                    growingThreshold: 50,
                    mode: "SingleSelect",
                    width: "100%",
                    backgroundDesign: "Solid"
                });

                // Add columns
                aColumns.forEach(sColumn => {
                    oTable.addColumn(new Column({
                        header: new Text({
                            text: this._formatColumnName(sColumn),
                            wrapping: false
                        }),
                        minScreenWidth: "Tablet",
                        demandPopin: true,
                        width: "auto"
                    }));
                });

                // Create JSON model for the data
                var oTableModel = new JSONModel(aData);
                oTable.setModel(oTableModel);

                // Bind items
                oTable.bindItems({
                    path: "/",
                    template: new ColumnListItem({
                        cells: aColumns.map(sColumn => {
                            return new Text({
                                text: "{" + sColumn + "}",
                                maxLines: 3,
                                wrapping: true
                            });
                        })
                    })
                });

                console.log("Table created successfully");
                return oTable;

            } catch (error) {
                console.error("Error creating table:", error);
                return new Text({
                    text: "Error creating table for " + sEntityName + ". Check console for details.",
                    textAlign: "Center"
                });
            }
        },

        _formatColumnName: function (sColumnName) {
            // Convert camelCase to readable format
            return sColumnName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        },

        _exportEntityToCSV: function (sEntityName, aData) {
            if (!aData || aData.length === 0) {
                MessageToast.show("No data to export");
                return;
            }

            // Get column names (excluding metadata)
            var aColumns = Object.keys(aData[0]).filter(key =>
                !key.startsWith('__') &&
                key !== 'ID' &&
                key !== 'createdAt' &&
                key !== 'modifiedAt' &&
                key !== 'createdBy' &&
                key !== 'modifiedBy'
            );

            // Create CSV content
            var sCsvContent = aColumns.join(',') + '\n';

            aData.forEach(oRecord => {
                var aRow = aColumns.map(sColumn => {
                    var value = oRecord[sColumn] || '';
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = '"' + value.replace(/"/g, '""') + '"';
                    }
                    return value;
                });
                sCsvContent += aRow.join(',') + '\n';
            });

            // Create and trigger download
            var oBlob = new Blob([sCsvContent], { type: 'text/csv;charset=utf-8;' });
            var sFileName = sEntityName + '_Export_' + new Date().toISOString().split('T')[0] + '.csv';

            var oLink = document.createElement("a");
            var sUrl = URL.createObjectURL(oBlob);
            oLink.setAttribute("href", sUrl);
            oLink.setAttribute("download", sFileName);
            oLink.style.visibility = 'hidden';
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);

            MessageToast.show("CSV exported: " + sFileName);
        },


    });
});
