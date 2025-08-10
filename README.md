AI-Based Smart Material Management & PO Generator
📌 Overview
This project is an AI-powered procurement management system designed to optimize material stock handling and automate purchase order (PO) generation.
Built using SAP UI5, SAP HANA Cloud, and SAP CAP Model, it integrates AI to recommend suppliers, predict stock shortages, and streamline procurement workflows.

🚀 Features
Stock Level Monitoring – Track inventory in real-time.

AI-Powered Supplier Recommendation – Suggests suppliers based on rating, price, and delivery performance.

Automatic PO Generation – Creates purchase orders for low-stock materials.

Multi-Select PO Deletion – Manage multiple POs at once from the dashboard.

PDF & Excel Export – Download PO lists in multiple formats.

Material Usage Analytics – View trends and usage patterns via charts.

AI Fallback Logic – Ensures functionality even when AI services are unavailable.

🏗 Architecture
Frontend: SAP UI5
Backend: SAP CAP Model (Node.js)
Database: SAP HANA Cloud
AI Integration: REST API (Gemini AI / Fallback Logic)
<img width="1468" height="821" alt="Screenshot 2025-08-10 165459" src="https://github.com/user-attachments/assets/105c7082-c56b-41ee-8b21-2f450c4bdd54" />


📊 Workflow:

scss
Copy
Edit
User (SAP UI5 Dashboard) 
     → Backend (CAP Services) 
          → SAP HANA Cloud (Material & PO Data) 
          → AI API (Stock Prediction / Supplier Recommendation)
🛠 Tech Stack
Frontend: SAP UI5

Backend: SAP CAP Model (Node.js)

Database: SAP HANA Cloud

Programming Languages: JavaScript, SQL

Tools: Git, GitHub, PDF/Excel Export

📷 Screenshots
<img width="1916" height="873" alt="Screenshot 2025-08-10 165714" src="https://github.com/user-attachments/assets/f0cba37c-cf93-40eb-a5c0-f6e958421cfc" />
<img width="1917" height="877" alt="Screenshot 2025-08-10 165841" src="https://github.com/user-attachments/assets/60eec9b2-d4a3-4ab1-8438-a2f46af4ec18" />
<img width="1919" height="862" alt="Screenshot 2025-08-10 165926" src="https://github.com/user-attachments/assets/c81ed0e4-a73b-4f36-8ca5-31447e50fff5" />



📄 Installation & Setup
Clone the repository:

bash
Copy
Edit
git clone https://github.com/YourUsername/YourRepoName.git
Install dependencies:

bash
Copy
Edit
npm install
Configure .env file with database & API keys.

Run the project:

bash
Copy
Edit
npm start
📬 Author
Ranjith Kumar R
📧 Email: ranjithramesh9228@gmail.com
🔗 GitHub: Ranjith3002
