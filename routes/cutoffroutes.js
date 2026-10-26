const {
    getcutoffs,
    getcutoffsById,
    getCutoffsByCourse,
    getCutoffsByCollege,
    getcutoffsByYear,
    getCutoffsByRound,
    getCutoffsByCategory,
    getCutoffsByExam,
    getCutoffsBySeatType,
    getCollegeCutoffsWithFilters,
    getCutoffsWithFilters
} = require('../controllers/cutoffcontroller');

const router = require('express').Router();

router.get('/cutoffs', getcutoffs);
router.get('/cutoffs/filters', getCutoffsWithFilters);
router.get("/cutoffs/course/:course", getCutoffsByCourse);
router.get("/cutoffs/college/:college", getCutoffsByCollege);
router.get("/cutoffs/college/:collegeCode/filter", getCollegeCutoffsWithFilters);
router.get("/cutoffs/year/:year", getcutoffsByYear);
router.get("/cutoffs/round/:round", getCutoffsByRound);
router.get("/cutoffs/category/:category", getCutoffsByCategory);
router.get("/cutoffs/exam/:exam", getCutoffsByExam);
router.get("/cutoffs/seat-type/:seatType", getCutoffsBySeatType);
router.get('/cutoffs/:id', getcutoffsById);

module.exports = router;
