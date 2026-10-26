# Maharashtra Engineering CET Cutoff API & Data Pipeline

This project processes, cleans, and serves Maharashtra Engineering MHT-CET Cutoff data, modeled on the **MahaEngineering** reference architecture.

---

## 1. Directory Structure

```
CollegePre/
├── json/                                # 11 CET Parsed Cutoff JSON files
│   ├── 2024-25_1.json
│   ├── 2024-25_2.json
│   ├── 2024-25_3.json
│   ├── 2025-26_1.json
│   ├── 2025-26_2.json
│   ├── 2025-26_3.json
│   ├── 2025-26_4.json
│   ├── 2026-27_1.json
│   ├── 2026-27_2.json
│   ├── 2026-27_3.json
│   └── 2026-27_4.json
├── cleaned/                             # Unified cleaned dataset & audit
│   ├── cleaned_cutoffs.json             # 280,402 normalized, deduplicated records
│   └── cleaning_report.json             # Cleaning metrics & repair report
├── model/
│   └── cutoffSchema.js                  # Mongoose schema for CET cutoffs
├── controllers/
│   └── cutoffcontroller.js              # REST API controllers & multi-filters
├── routes/
│   └── cutoffroutes.js                  # Express endpoints
├── cleandata.js                         # Cleaning & canonicalization script
├── seed.js                              # MongoDB import script
├── server.js                            # Express backend server
└── pdftojson (1).py                     # PDF extractor
```

---

## 2. Comparison: JEE (Reference) vs CET

| Field | JEE (All India) | CET (Maharashtra State & Minority) |
|---|---|---|
| `exam` | `"JEE(Main)"` | `"MHT-CET"` |
| `merit_rank` | `all_india_merit` | `merit_rank` (State General Merit No) |
| `seat_level` | N/A | `Home University`, `Other Than Home University`, `State Level` |
| `seat_category` | `AI` | `GOPENS`, `GSCS`, `GSTS`, `TFWS`, `EWS`, `LOPENH`, etc. |
| `stage` | N/A | `I`, `II`, etc. |
| `college_status` | N/A | `Government Autonomous`, `Un-Aided`, etc. |
| `home_university`| N/A | `Autonomous Institute`, `Sant Gadge Baba Amravati University`, etc. |
| `choice_code` | 9-digit | 9-digit / 10-digit |

---

## 3. Data Cleaning Pipeline (`cleandata.js`)

Run data cleaning:
```bash
node --max-old-space-size=4096 cleandata.js
```

What it does:
1. **Canonical College Mapping**: Normalizes 390 colleges, removes numerical prefixes from names, and ensures consistent spelling.
2. **Canonical Course Mapping**: Extracts the 3-digit course code from each choice code (e.g. `191` $\rightarrow$ `Civil Engineering`, `245` $\rightarrow$ `Computer Engineering`) and unifies variations across years.
3. **Deduplication & Sorting**: Removes duplicate records and sorts by college code, course name, year, and round.

---

## 4. API Endpoints

Start the server:
```bash
npm run dev
```

| API Endpoint | Description | Example |
|---|---|---|
| `GET /cutoffs` | Get all cutoff documents | `/cutoffs` |
| `GET /cutoffs/:id` | Get cutoff document by ID | `/cutoffs/6620...` |
| `GET /cutoffs/course/:course` | Filter by branch/course | `/cutoffs/course/Computer%20Engineering` |
| `GET /cutoffs/college/:college` | Filter by college code | `/cutoffs/college/1002` |
| `GET /cutoffs/year/:year` | Filter by academic year | `/cutoffs/year/2024-25` |
| `GET /cutoffs/round/:round` | Filter by CAP round | `/cutoffs/round/I` |
| `GET /cutoffs/category/:category` | Filter by category | `/cutoffs/category/GOPENS` |
| `GET /cutoffs/seat-type/:seatType` | Filter by seat type | `/cutoffs/seat-type/TFWS` |
| `GET /cutoffs/filters` | Multi-filter query | `/cutoffs/filters?year=2024-25&course=Civil%20Engineering&stage=I` |
| `GET /cutoffs/college/:collegeCode/filter` | College-specific multi-filter | `/cutoffs/college/1002/filter?year=2024-25&round=I` |
