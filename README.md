# 🛡️ Kerala Police - Cyber Crime Inquiry Portal (Palakkad)

> 🚀 **Status:** The portal is already hosted, live, and fully operational for public use. The setup instructions below are provided for local development, auditing, and police administration purposes.

A privacy-focused, secure, and modern web application that allows citizens of Palakkad district, Kerala, to file cybercrime incident reports anonymously or with optional contact details. The system generates unique, sequence-based case reference codes and allows citizens to follow up on their cases, leave feedback, and grade services within a secure 30-day window.

---

## 💡 The Problem, Idea & Solution

### 🛑 The Problem
Citizens experiencing cybercrimes often face friction when trying to report incidents immediately. Traditional reporting methods can be intimidating, complex, or require immediate disclosure of full personal details. This friction leads to delayed reporting or completely unreported crimes. In cybercrimes (such as financial fraud), the initial hours are critical; delays drastically reduce the chances of recovering lost funds or tracking perpetrators.

### 🧠 The Idea
The core idea is to establish a lightweight, privacy-first, "fire-and-forget" reporting system. By removing the initial barrier of forced registration and complex procedures, citizens can record incident details instantly, report from specific local regions (Taluks in Palakkad), specify financial losses, and choose whether to remain anonymous. 

### 🛡️ The Solution: Cyber Crime Inquiry Portal
This portal serves as the frictionless bridge. It provides a simple web form that works on any device. 
* **Frictionless Submission:** Citizens log their incidents instantly without creating accounts.
* **Accounting for Unregistered Crimes:** By offering an anonymous, friction-free reporting route, the portal successfully logs and accounts for minor or unregistered cyber crimes that would normally go unreported due to procedural hesitation.
* **Secured Receipts:** The database returns a unique tracking reference code (`INQ-YYYYMMDD-...`) which allows the citizen to follow up, view their status, or submit feedback within 30 days.
* **Privacy by Design:** Row-Level Security (RLS) and database-level `SECURITY DEFINER` functions ensure data is strictly sandboxed. Anonymous reports remain truly anonymous, and old reports automatically expire from public lookup after 30 days to prevent data leaks.
* **Pattern Analysis for Law Enforcement:** Every logged inquiry (including anonymous ones) is immediately accessible on the already-implemented **Officer Portal**. Officers can use various built-in filters (by date range, local area/taluk, crime category, money lost thresholds) and data analyzers to trace local crime trends, identify hotspots, and analyze regional threat patterns in Palakkad.

---

## 📈 Capture, Analytics & Pattern Tracking

This portal acts as an intelligence aggregator for the Palakkad Cyber Crime Cell, ensuring that unregistered and minor incidents are fully accounted for.

### 🛑 Capturing the "Dark Figure" of Cybercrime
In cybercrime, a large volume of incidents remains unreported (referred to as the "dark figure" of crime). Citizens often avoid filing official First Information Reports (FIRs) for low-value financial frauds, minor social engineering attempts, online impersonations, or phishing scams due to procedural friction or fear of social exposure. 
* By offering a **frictionless, anonymous reporting funnel**, this portal captures these under-reported incidents.
* Even without names or phone numbers, these logs represent raw indicators of compromise (IoCs) and regional threat vectors.

### 🔍 Pattern Detection in the Officer Portal
Every logged incident is automatically ingested and organized for analysis within the secure **Officer Portal**. The dashboard is equipped with advanced data processors and query filters:
* **Taluk-Level Heatmaps:** Detects geospatial hotspots (e.g., Alathur, Chittur, Mannarkkad) to see where specific scams are originating or targeting.
* **Financial Loss Thresholds:** Filters inquiries by the financial loss amount (`money_lost`), helping officers identify high-impact operations or serial scams.
* **Temporal Trend Analysis:** Identifies peaks in report filings to detect coordinated spam or phishing campaigns matching specific calendar events or seasonal patterns.
* **Category Clustering:** Groups complaints (e.g., Phishing, OTP Fraud, Sextortion) to monitor which methods are gaining popularity among local scammers.

### 🔐 Anonymization & Analytics Retention
* While the citizen's ability to pull up individual case details and submit feedback **expires after 30 days** to protect their privacy, the core metadata remains securely archived.
* This allows officers to conduct historical trend analyses over months or years, ensuring the police department can measure long-term improvements or track shifting scammer methodologies without compromising citizen privacy.

## ⚙️ How the Portal Works

The Cyber Crime Inquiry Portal simplifies the incident reporting and tracking process. Below is the step-by-step breakdown of how the citizen interacts with the system and how the backend processes each step.

### Step 1: Incident Submission
1. **Details Form:** The citizen fills in details about the incident, choosing a primary category and the local area where it originated. 
2. **Flexible Privacy:** A citizen can choose to remain completely anonymous. Filling in contact information (Name, Phone) or financial losses is fully optional.
3. **Database Insertion:** To guarantee maximum security, the frontend cannot directly access or modify the database tables. Instead, submissions are routed through secure, locked-down database functions.

### Step 2: Reference Code Generation
Upon submission, a database trigger automatically generates a secure case tracking reference:
* **Code Format:** `INQ-YYYYMMDD-Sequence-Salt` (e.g., `INQ-20260701-003-B4C9`).
* **Sequence Counter:** The system automatically counts today's submissions using Indian Standard Time (IST) to assign the daily sequential order.
* **Randomized Salt:** A 4-character random suffix is appended to prevent malicious users from guessing other active inquiry codes.

### Step 3: Receipt & Browser Recall
* **Receipt Screen:** A clean receipt card shows all reported details alongside a visual copy-to-clipboard button and a layout print option.
* **Recall Banner:** The portal caches the reference code in the user's browser local storage. When the user revisits the homepage, a quick-access recall banner appears, prompting them to view their receipt instantly.
* **URL Syncing:** The reference code matches the browser URL search query (`?ref=...`), enabling direct sharing or bookmarking.

### Step 4: Follow-up, Feedback & Expiration
* **Verification Lookup:** By inputting the reference code, the citizen can retrieve their case summary.
* **Portal Evaluation:** The citizen can rate their portal experience (1 to 5 stars) and write suggestions. The system locks the database row during update to ensure feedback is submitted only once.
* **30-Day Expiry:** To protect citizen details from remaining open to the public indefinitely, the database restricts case lookup access to **30 days**. Once a report exceeds 30 days, lookups are automatically deactivated.

---

## 💻 Tech Stack Summary
* **Frontend:** React 19, TypeScript, TailwindCSS v4, Framer Motion (Transitions), and Lucide React (Icons).
* **Backend Database:** Supabase & PostgreSQL (with locked tables, Row-Level Security, and Secure RPCs).

---

## 🚀 Setup & Local Development

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* A [Supabase](https://supabase.com/) project database instance

### Setup Steps
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Build Database Schema:**
   Run the SQL script located in [`plannings/seed.sql`](file:///c:/Users/shaha/OneDrive/Desktop/cybercrime-inquiry-portal/plannings/seed.sql) inside your Supabase project SQL Editor to initialize all tables, functions, and triggers.
3. **Add Environment Variables:**
   Configure a `.env` file in your root folder:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. **Start Application:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.


