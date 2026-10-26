const fs = require("fs");
const path = require("path");

// ======================================================
// 1. INPUT FILES & DIRECTORIES
// ======================================================

const jsonFolder = "./json";
const outputFolder = "./cleaned";

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// Find all cutoff json files in ./json
const inputFiles = fs.readdirSync(jsonFolder)
    .filter(file => file.endsWith(".json") && !file.includes("failed"))
    .sort()
    .map(file => path.join(jsonFolder, file));

console.log("========================================");
console.log(" Maharashtra CET Cutoff Data Cleaner");
console.log(" Reference: MahaEngineering Pipeline");
console.log(" Files to process:", inputFiles.length);
console.log("========================================\n");


// ======================================================
// 2. HELPER FUNCTIONS
// ======================================================

function cleanText(value) {
    if (value === null || value === undefined) {
        return null;
    }
    return String(value).replace(/\s+/g, " ").trim();
}

function extractCollegeCode(name) {
    if (!name) return null;
    const match = name.match(/^(\d{4,5})\s*-/);
    return match ? match[1] : null;
}

function cleanCollegeName(name) {
    if (!name) return null;
    return name
        .replace(/^\d{4,5}\s*-\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
}

// 3-digit course code from 9 or 10 digit choice code
// Example: 0100219110 -> 191 (Civil Engg)
// Example: 600624510  -> 245 (Computer Engg)
function getCourseCode(choiceCode) {
    if (!choiceCode) return null;
    const code = String(choiceCode).trim();
    if (code.length < 8) return null;
    return code.slice(-5, -2);
}


// ======================================================
// 3. READ ALL FILES
// ======================================================

let allRecords = [];

for (const file of inputFiles) {
    if (!fs.existsSync(file)) {
        console.log(`[WARNING] File not found: ${file}`);
        continue;
    }

    console.log(`Reading: ${file}`);
    const content = fs.readFileSync(file, "utf8");
    const json = JSON.parse(content);

    if (Array.isArray(json.records)) {
        allRecords.push(...json.records);
    } else if (Array.isArray(json)) {
        allRecords.push(...json);
    } else {
        console.log(`[WARNING] Unknown structure: ${file}`);
    }
}

console.log("\n=================================");
console.log("TOTAL RAW RECORDS:", allRecords.length);
console.log("=================================\n");


// ======================================================
// 4. BUILD CANONICAL COLLEGE NAME MAP
// ======================================================

const collegeMap = new Map();

for (const record of allRecords) {
    const rawName = cleanText(record.college_name || record.collegeName);
    let code = cleanText(record.college_code || record.collegeCode);

    if (!rawName) continue;

    if (!code) {
        code = extractCollegeCode(rawName);
    }

    if (!code) continue;

    const cleanName = cleanCollegeName(rawName);

    if (!collegeMap.has(code)) {
        collegeMap.set(code, new Map());
    }

    const nameCounts = collegeMap.get(code);
    nameCounts.set(cleanName, (nameCounts.get(cleanName) || 0) + 1);
}

const canonicalCollegeMap = new Map();

for (const [code, names] of collegeMap.entries()) {
    let bestName = null;
    let bestCount = 0;

    for (const [name, count] of names.entries()) {
        if (count > bestCount) {
            bestName = name;
            bestCount = count;
        }
    }

    canonicalCollegeMap.set(code, bestName);
}


// ======================================================
// 5. BUILD CANONICAL COURSE NAME MAP
// ======================================================

const courseMap = new Map();

for (const record of allRecords) {
    const choiceCode = cleanText(record.choice_code || record.courseCode);
    const courseName = cleanText(record.course_name || record.branch);

    if (!choiceCode || !courseName) continue;

    const courseCode = getCourseCode(choiceCode);
    if (!courseCode) continue;

    if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, new Map());
    }

    const courseCounts = courseMap.get(courseCode);
    courseCounts.set(courseName, (courseCounts.get(courseName) || 0) + 1);
}

const canonicalCourseMap = new Map();

for (const [code, courses] of courseMap.entries()) {
    let bestCourse = null;
    let bestCount = 0;

    for (const [course, count] of courses.entries()) {
        if (count > bestCount) {
            bestCourse = course;
            bestCount = count;
        }
    }

    canonicalCourseMap.set(code, bestCourse);
}


// ======================================================
// 6. CLEAN RECORDS
// ======================================================

let cleanedRecords = [];

let statistics = {
    totalRecords: allRecords.length,
    collegeCodeAdded: 0,
    collegeNameCleaned: 0,
    courseNameFixed: 0,
    courseNameAlreadyPresent: 0,
    unresolvedCollege: 0,
    unresolvedCourse: 0,
    invalidRecords: 0
};

for (const record of allRecords) {
    if (!record || typeof record !== "object") {
        statistics.invalidRecords++;
        continue;
    }

    // College code
    let collegeCode = cleanText(record.college_code || record.collegeCode);
    const rawCollegeName = cleanText(record.college_name || record.collegeName);

    if (!collegeCode && rawCollegeName) {
        collegeCode = extractCollegeCode(rawCollegeName);
        if (collegeCode) statistics.collegeCodeAdded++;
    }

    // College name
    let collegeName = null;
    if (collegeCode && canonicalCollegeMap.has(collegeCode)) {
        collegeName = canonicalCollegeMap.get(collegeCode);
    } else if (rawCollegeName) {
        collegeName = cleanCollegeName(rawCollegeName);
    }

    if (!collegeName) {
        statistics.unresolvedCollege++;
    } else if (rawCollegeName && collegeName !== rawCollegeName) {
        statistics.collegeNameCleaned++;
    }

    // Course
    const choiceCode = cleanText(record.choice_code || record.courseCode);
    const courseCode = getCourseCode(choiceCode);
    let courseName = cleanText(record.course_name || record.branch);

    if (courseCode && canonicalCourseMap.has(courseCode)) {
        const canonicalCourse = canonicalCourseMap.get(courseCode);
        if (!courseName) {
            courseName = canonicalCourse;
            statistics.courseNameFixed++;
        } else if (courseName !== canonicalCourse) {
            courseName = canonicalCourse;
            statistics.courseNameFixed++;
        } else {
            statistics.courseNameAlreadyPresent++;
        }
    }

    if (!courseName) {
        statistics.unresolvedCourse++;
    }

    const cleanRecord = {
        academic_year: cleanText(record.academic_year || record.academicYear),
        round: cleanText(record.round || record.capRound),
        seat_category: cleanText(record.seat_category || record.category),
        seat_type: cleanText(record.seat_type || record.category),
        seat_level: cleanText(record.seat_level || record.seatLevel),
        choice_code: choiceCode,
        college_code: collegeCode,
        college_name: collegeName,
        course_name: courseName,
        college_status: cleanText(record.college_status || record.collegeStatus),
        home_university: cleanText(record.home_university || record.homeUniversity),
        stage: cleanText(record.stage),
        merit_rank: record.merit_rank !== undefined ? record.merit_rank : (record.meritRank ?? null),
        percentile: record.percentile !== undefined ? record.percentile : null,
        exam: cleanText(record.exam) || "MHT-CET",
        source_page: record.source_page || record.sourcePage || null
    };

    cleanedRecords.push(cleanRecord);
}


// ======================================================
// 7. REMOVE EXACT DUPLICATES
// ======================================================

const uniqueRecords = [];
const seen = new Set();

for (const record of cleanedRecords) {
    const key = (
        record.academic_year + "|" +
        record.round + "|" +
        record.college_code + "|" +
        record.choice_code + "|" +
        record.seat_level + "|" +
        record.seat_category + "|" +
        record.stage + "|" +
        record.merit_rank + "|" +
        record.percentile
    );

    if (!seen.has(key)) {
        seen.add(key);
        uniqueRecords.push(record);
    }
}

const duplicatesRemoved = cleanedRecords.length - uniqueRecords.length;


// ======================================================
// 8. SORT RECORDS
// ======================================================

uniqueRecords.sort((a, b) => {
    return (
        String(a.college_code || "").localeCompare(String(b.college_code || "")) ||
        String(a.course_name || "").localeCompare(String(b.course_name || "")) ||
        String(a.academic_year || "").localeCompare(String(b.academic_year || "")) ||
        String(a.round || "").localeCompare(String(b.round || ""))
    );
});


// ======================================================
// 9. FINAL OUTPUT
// ======================================================

const finalData = {
    total_records: uniqueRecords.length,
    duplicates_removed: duplicatesRemoved,
    records: uniqueRecords
};


// ======================================================
// 10. SAVE CLEAN DATA
// ======================================================

console.log("Saving cleaned records to ./cleaned/cleaned_cutoffs.json ...");

fs.writeFileSync(
    path.join(outputFolder, "cleaned_cutoffs.json"),
    JSON.stringify(finalData, null, 2),
    "utf8"
);


// ======================================================
// 11. SAVE CLEANING REPORT
// ======================================================

statistics.finalRecords = uniqueRecords.length;
statistics.duplicatesRemoved = duplicatesRemoved;

fs.writeFileSync(
    path.join(outputFolder, "cleaning_report.json"),
    JSON.stringify(statistics, null, 2),
    "utf8"
);


// ======================================================
// 12. DISPLAY RESULT
// ======================================================

console.log("\n=================================");
console.log(" CLEANING COMPLETED");
console.log("=================================");
console.log("Raw records:             ", statistics.totalRecords);
console.log("Final records:           ", statistics.finalRecords);
console.log("College codes added:     ", statistics.collegeCodeAdded);
console.log("College names cleaned:   ", statistics.collegeNameCleaned);
console.log("Course names fixed:      ", statistics.courseNameFixed);
console.log("Unresolved colleges:     ", statistics.unresolvedCollege);
console.log("Unresolved courses:      ", statistics.unresolvedCourse);
console.log("Duplicates removed:      ", statistics.duplicatesRemoved);
console.log("\nFiles created:");
console.log("✓ cleaned/cleaned_cutoffs.json");
console.log("✓ cleaned/cleaning_report.json");
console.log("=================================\n");
