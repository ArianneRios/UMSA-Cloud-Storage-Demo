Create a professional web application UI for a university cloud storage system called “UMSA Cloud Storage”.

Project context:
We are developing “UMSA Cloud Storage”, a secure cloud storage web system for students of Universidad Mayor de San Andrés. Students can log in, upload academic files, organize them by category, view storage usage, and check the security status of each uploaded file.

The main purpose is not only file storage, but secure storage. Every uploaded file must pass through an automatic malware scanning workflow before becoming available.

Cloud security workflow:
Student → Web App → NestJS API → PostgreSQL → AWS S3 Input Bucket → AWS Lambda Scanner → VirusTotal → S3 Clean Bucket / S3 Quarantine Bucket → SNS Alerts → CloudWatch Logs.

Frontend stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Responsive design
- Dark mode by default

Backend expected:
- NestJS REST API
- PostgreSQL database
- AWS SDK
- AWS S3
- AWS Lambda
- VirusTotal API
- Amazon SNS
- Amazon CloudWatch

Important:
Generate the frontend with mock data for now, but structure the code so it can later connect to a real NestJS backend with PostgreSQL and AWS SDK.
Do not use real AWS credentials.
Do not display real secrets, passwords, API keys or tokens.
The system must look professional, polished, academic and enterprise-grade.
It must not look like a simple student project.

Main concept:
This is a secure university cloud storage platform for UMSA students. Malware scanning is a security layer applied automatically to every uploaded file.

Design style:
- Professional university cloud platform
- Modern cybersecurity and academic style
- Premium SaaS dashboard
- Dark mode by default
- Colors: deep navy, slate, cyan, emerald, amber, red, white and subtle UMSA-inspired accents
- Clean spacing
- Rounded cards
- Subtle gradients
- Glassmorphism details where appropriate
- Sidebar navigation
- Top navbar with user profile, notifications and storage status
- Clear status badges
- Professional tables with search and filters
- Loading states
- Empty states
- Error states
- Responsive for desktop and tablet
- Excellent UX and UI hierarchy

Pages required:

1. Login page
Create a professional login page for UMSA students.

Fields:
- Institutional email
- Password

Include:
- UMSA Cloud Storage logo/title
- Security message: “Secure academic cloud storage for UMSA students”
- Demo credentials section
- Button: Sign in
- Password visibility toggle
- Professional cloud/security illustration or icon
- After login, redirect to dashboard

2. Dashboard page
Show main statistic cards:
- Total uploaded files
- Clean files
- Quarantined files
- Files analyzing
- Storage used
- Registered students

Also include:
- Recent uploaded files table
- Recent security alerts
- Storage usage card
- Activity timeline
- System health card
- PostgreSQL summary card with this message:
  “PostgreSQL stores students, uploaded files, scan results, storage usage and audit logs.”

Include an architecture summary card showing:
Student → Web App → NestJS API → PostgreSQL → AWS S3 → Lambda → VirusTotal → Clean / Quarantine → SNS / CloudWatch

3. My Cloud Storage page
This is the main student file area.

Show files as a professional cloud drive interface.

Features:
- Grid view and table view
- File name
- File type
- Size
- Upload date
- Security status
- Folder/category
- Actions: View details, Download, Delete

Categories:
- Documents
- Assignments
- Research
- Presentations
- Images
- Spreadsheets
- Other

File statuses:
- UPLOADED
- ANALYZING
- CLEAN
- QUARANTINED
- ERROR

Status behavior:
- CLEAN files can be downloaded
- ANALYZING files are temporarily unavailable
- QUARANTINED files are blocked and isolated
- ERROR files show a warning message

4. Upload File page
Create a premium drag and drop upload interface.

Requirements:
- Accept PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG
- Show selected file name, size and type
- Select folder/category before upload
- Upload progress bar
- Simulated security process:
  UPLOADED → ANALYZING → CLEAN or QUARANTINED

Include these messages:
“Every file is scanned before becoming available in UMSA Cloud Storage.”
“Upload record is stored in PostgreSQL before being sent to AWS S3.”

UX details:
- Show validation if file type is not allowed
- Show upload progress
- Show scanning progress
- Show success message if file is clean
- Show danger alert if file is quarantined
- Show button to view upload history

5. File History page
Create a professional table with:

Columns:
- File name
- Student
- Type
- Size
- SHA-256 hash
- Status
- Folder/category
- Bucket destination
- Upload date
- Scan date
- Result
- Actions: View details

Filters:
- Search by file name
- Filter by status
- Filter by student
- Filter by file type
- Filter by category
- Filter by date

Status badges:
- UPLOADED = gray
- ANALYZING = blue
- CLEAN = green
- QUARANTINED = red
- ERROR = amber

6. File Details page
Show a professional details view with:

File metadata:
- PostgreSQL record ID
- Student who uploaded it
- Original file name
- File type
- Size
- Folder/category
- SHA-256 hash
- Current security status
- VirusTotal result summary
- Destination bucket
- Upload date
- Scan date

Timeline:
- Record created in PostgreSQL
- File uploaded to S3 input bucket
- Lambda scanner triggered
- SHA-256 hash calculated
- VirusTotal consulted
- File classified
- PostgreSQL record updated
- File moved to clean storage or quarantine
- SNS alert sent if malicious
- CloudWatch log generated

If status is QUARANTINED, show a strong red alert panel:
“This file was isolated because a possible threat was detected.”

If status is CLEAN, show a green success panel:
“This file passed the security scan and is available for download.”

7. Students page
Create an admin page with a professional table.

Columns:
- Student ID
- Name
- Institutional email
- Career
- Role
- Storage used
- Created date
- Status

Roles:
- ADMIN
- STUDENT
- TECHNICAL

Include:
- Search by name or email
- Filter by role
- Filter by status
- Storage usage badge

8. Logs page
Create an audit logs table.

Columns:
- Log ID
- Action
- User
- File
- Status
- Source
- Created date

Example actions:
- LOGIN_SUCCESS
- FILE_UPLOADED
- FILE_SENT_TO_S3
- LAMBDA_TRIGGERED
- VIRUSTOTAL_CHECKED
- FILE_CLEAN
- FILE_QUARANTINED
- SNS_ALERT_SENT
- CLOUDWATCH_LOG_CREATED

Sources:
- WEB_APP
- NESTJS_API
- POSTGRESQL
- AWS_S3
- AWS_LAMBDA
- VIRUSTOTAL
- SNS
- CLOUDWATCH

9. Settings page
Create a professional settings page with placeholder sections:

Sections:
- PostgreSQL connection placeholder
- AWS S3 buckets placeholder
- Lambda function placeholder
- VirusTotal API placeholder
- SNS topic placeholder
- CloudWatch logs placeholder
- Storage limits placeholder
- Security rules placeholder

Important:
Use placeholders only.
Never request or show real passwords, secrets, AWS keys, API keys or tokens.

Sidebar navigation:
- Dashboard
- My Cloud Storage
- Upload File
- File History
- Students
- Logs
- Settings

Top navbar:
- Search input
- Notifications icon
- System status badge
- Current user profile
- Storage usage indicator

Future NestJS API endpoints:
Prepare an API client file ready for these endpoints:

POST /auth/login
GET /auth/me
GET /dashboard/stats
POST /files/upload
GET /files
GET /files/:id
DELETE /files/:id
GET /students
GET /logs
GET /settings

PostgreSQL database models:

Student:
- id
- name
- email
- password_hash
- career
- role
- status
- storage_used
- created_at

UploadedFile:
- id
- student_id
- original_name
- file_type
- size
- category
- status
- sha256
- s3_input_key
- bucket_destination
- uploaded_at
- scanned_at
- result
- virustotal_summary

AuditLog:
- id
- student_id
- file_id
- action
- description
- source
- created_at

StorageUsage:
- id
- student_id
- total_files
- used_space
- max_space
- updated_at

Mock data requirements:
Use realistic mock data with UMSA student names, institutional emails, academic file names and different file statuses.

Example file names:
- investigacion_cloud_computing.pdf
- tarea_base_de_datos.docx
- presentacion_seguridad.pptx
- laboratorio_redes.xlsx
- informe_final_sistemas.pdf

Example students:
- Jose Luis Quispe Vargas
- Fiorela Katherine Vasquez Condori
- Wilbert Sunavi Kapa

Use mock data now, but organize everything so mock data can easily be replaced by real REST API calls to a NestJS backend connected to PostgreSQL.

Code quality:
- Clean component structure
- Reusable components
- Clear API client file
- Separate mock data file
- TypeScript interfaces for Student, UploadedFile, AuditLog and StorageUsage
- Professional naming
- Good responsive layout
- No hardcoded secrets
- No real AWS credentials

Generate the full working frontend with all pages, components, routing, mock data, reusable components and polished professional UI.