const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
    {
        academic_year: String,
        round: String,
        seat_category: String,
        seat_type: String,
        seat_level: String,
        sr_no: String,
        merit_rank: Number,
        percentile: Number,
        choice_code: String,
        college_code: String,
        college_name: String,
        course_name: String,
        college_status: String,
        home_university: String,
        stage: String,
        exam: String,
        source_page: Number
    },
    { _id: false }
);

const CET_cutoffs = new mongoose.Schema({
    source_file: String,
    document_type: String,
    academic_year: String,
    round: String,
    total_records: Number,
    records: [recordSchema]
});

module.exports = mongoose.model("Cutoff", CET_cutoffs, "CET_cutoffs");
