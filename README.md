# UMSA Cloud Storage Demo

## Project Overview

**UMSA Cloud Storage Demo** is an academic web-based prototype designed to demonstrate the workflow of a cloud storage system for file management.

The project focuses on file upload, file organization, storage workflow, and user interaction through a structured web interface. It was developed as a functional demo to present how a cloud-based storage platform can support digital document management in an educational or institutional environment.

---

## Purpose

The main purpose of this project is to showcase the core behavior of a cloud storage solution, including how users can interact with a platform to upload, manage, and organize files.

This project is intended for academic demonstration and portfolio presentation. It is not presented as a production-ready system, but as a functional prototype focused on system behavior, interface structure, and technical learning.

---

## General Flow & Architecture

```text
Student → Web App → NestJS API → PostgreSQL → AWS S3 Input Bucket → AWS Lambda Scanner → VirusTotal → S3 Clean Bucket / S3 Quarantine Bucket → SNS Alerts → CloudWatch Logs
```

> [!IMPORTANT]
> The malware analysis is performed asynchronously using an external AWS Lambda. If the Lambda is inactive, the file will remain in `ANALYZING` or `PENDING` status.

---

## Main Features

* File upload workflow
* File management interface
* Organized storage structure
* Frontend interface for user interaction
* Backend structure for storage-related operations
* Academic simulation of a cloud storage platform
* Clean project organization for technical presentation
* SHA-256 file hashing and virus/malware detection simulation

---

## Security

The system considers two types of hashes:

1. **Password Hash**:
   - In the real backend, passwords will be stored as a `password_hash`.
   - It is recommended to use bcrypt or Argon2.
   - Plain text passwords must never be stored.

2. **File Hash**:
   - Each uploaded file generates a SHA-256 hash.
   - This hash acts as a digital fingerprint of the file.
   - In the real integration, it will be used to query VirusTotal.

---

## Demo Mode

Currently, the system runs in demo mode using LocalStorage.
This means:
- There is no real connection to PostgreSQL yet.
- There is no real connection to AWS S3 yet.
- There is no real query to VirusTotal yet.
- The scan workflow is simulated.
- Data is saved locally in the browser.

---

## Technologies Used

### Frontend
- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- LocalStorage for demo mode

### Backend Expected
- NestJS
- PostgreSQL
- AWS SDK
- AWS S3
- AWS Lambda
- VirusTotal API
- Amazon SNS
- Amazon CloudWatch

---

## Project Structure

```text
UMSA-Cloud-Storage-Demo/
├── backend/
├── guidelines/
├── src/
├── .env.example
├── .gitignore
├── ATTRIBUTIONS.md
├── README.md
├── default_shadcn_theme.css
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
└── vite.config.ts
```

---

## Installation and Setup

To run this project locally, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/ArianneRios/UMSA-Cloud-Storage-Demo.git
```

### 2. Enter the project folder

```bash
cd UMSA-Cloud-Storage-Demo
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run the development server

```bash
pnpm dev
```

### 5. Open the project in the browser

```text
http://localhost:5173
```

### 6. Backend Setup (Optional/Backend Folder)

To set up the backend locally:

```bash
cd backend
npm install
npm run start:dev
```

---

## Environment Variables

This project includes an `.env.example` file as a reference for environment configuration.

Before running the project, create a local `.env` file if required and configure the necessary variables according to the project setup.

> Important: real credentials, tokens, passwords, or private keys should never be uploaded to GitHub.

---

## Learning Outcomes

Through this project, I strengthened my knowledge in:

* Cloud storage concepts
* File management workflows
* Frontend and backend project organization
* Web application structure
* Local development workflow
* Git and GitHub version control
* Technical documentation for academic projects

---

## Project Status

Academic demo project completed for presentation and portfolio purposes.

---

## Author

**Arianne Rios Llanos**
Data Science and Artificial Intelligence Student
La Paz, Bolivia
