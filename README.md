# VScanner

**VScanner** is a lightweight web vulnerability scanning platform built for fast security triage.  
It allows users to submit a target URL, run asynchronous security checks in the background, and review findings through a modern dashboard with severity breakdowns, risk scoring, scan history, and remediation guidance.

---

## Why VScanner?

Security teams and builders often need a quick first-pass view of a public-facing target before deeper manual assessment. VScanner is designed for that exact moment.

It helps answer:

- Is HTTPS properly enforced?
- Are important security headers missing?
- Are sensitive endpoints exposed?
- Is user input reflected unsafely?
- Are there signs of injection vulnerabilities?
- Are core web ports reachable?

VScanner transforms these checks into a structured, queue-driven workflow with clear and actionable output.

---

## Core Value Proposition

VScanner combines three essential qualities:

- **Speed** → Queue scans instantly and process asynchronously  
- **Clarity** → Convert raw checks into findings, severity counts, and risk bands  
- **Usability** → Clean UI for submission, monitoring, and reporting  

---

## Key Features

### Security Checks

VScanner runs multiple automated checks:

#### Injection Check
- Tests query parameters with basic payloads  
- Detects SQL-like error patterns in responses  

#### Security Header Check
Detects missing headers such as:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`

#### HTTPS Check
- Verifies HTTPS availability  
- Detects downgrade behavior  
- Checks HTTP → HTTPS redirection  

#### Sensitive Path Discovery
Probes common endpoints:
- `/admin`
- `/login`
- `/.env`
- `/config`
- `/debug`

#### Reflection Check
- Detects if user-controlled input is echoed back  

#### Port Reachability Check
- Tests accessibility of ports `80` and `443`

---

## Scan Workflow

1. User submits a URL via dashboard  
2. Backend validates and normalizes the URL  
3. Scan is created with `queued` status  
4. Job is pushed to Redis via BullMQ  
5. Worker picks job → status becomes `running`  
6. Scanner modules execute in parallel  
7. Findings are aggregated  
8. Risk score and summary generated  
9. Scan marked `done` or `failed`  
10. Frontend polls and displays results  

---

## Reporting & Risk Scoring

Each scan generates:

- **Score**: out of `100`
- **Risk Bands**:
  - `Low`
  - `Medium`
  - `High`
  - `Critical`
- **Severity Counts**:
  - `critical`
  - `high`
  - `medium`
  - `low`
  - `info`
- Human-readable summary  
- Evidence per finding  
- Remediation guidance  

---

## Product Architecture

### Frontend
- React  
- Vite  
- Tailwind CSS  

**Features:**
- Target submission form  
- API health indicator  
- Live scan status polling  
- Scan history  
- Finding cards (evidence + remediation)  
- Module outcome matrix  

---

### Backend
- Node.js  
- Express  
- MongoDB (Mongoose)  
- Redis  
- BullMQ  

**Responsibilities:**
- URL validation & normalization  
- Scan creation  
- Queue management  
- Worker execution  
- Result persistence  
- Scan history & detail retrieval  

---

## API Endpoints

### `POST /scan`
Queue a new scan.

**Request:**
```json
{
  "url": "https://example.com"
}
```

---

### `GET /scan/history`
Fetch recent scans.

---

### `GET /scan/:id`
Fetch full scan result.

---

### `GET /health`
API health check.

---

## Safety Controls

To prevent unsafe scanning:

- Only `http` and `https` URLs allowed  
- `localhost` is rejected  
- `127.0.0.1` is rejected  
- Private IPv4 ranges are blocked  

---

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express

**Queue System**
- BullMQ

**Cache / Broker**
- Redis

**Database**
- MongoDB (Mongoose)

---

## Local Setup

### Prerequisites

- Node.js  
- MongoDB  
- Redis  

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

**Environment Variables:**

```env
PORT=6050
Db_Url=mongodb://localhost:27017/vscanner
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
CORS_ORIGINS=http://localhost:5173
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Optional:**

```env
VITE_API_BASE_URL=http://localhost:6050
```

---

## What Makes This Hackathon-Ready

- Clear problem statement  
- Full-stack architecture  
- Async processing with queues  
- Real-world security use case  
- Strong demo flow (input → scan → results)  
- Easily extensible scanner modules  

---

## Final Note

VScanner is built for **speed, clarity, and extensibility**.  
It’s not trying to replace enterprise scanners… it’s the sharp, fast scout that tells you *where to look next*.
