/**
 * @brief A table of acquisitions of organizations.
 *
 * @note The real correctness is only displayed in the GUI for the demo.
 */
export const TABLE_ACQUISITIONS = [
    {
        values: {acquired: "A2Bdone", acquiring: "Zazzer", date: "7/11/2020"},
        variable: "a_0",
        real_correctness: false,
    },
    {
        values: {acquired: "microBarg", acquiring: "Fiffer", date: "1/5/2017"},
        variable: "a_1",
        real_correctness: true,
    },
    {
        values: {acquired: "fPharm", acquiring: "Fiffer", date: "1/2/2016"},
        variable: "a_2",
        real_correctness: false,
    },
    {
        values: {acquired: "Optobest", acquiring: "microBarg", date: "8/8/2015"},
        variable: "a_3",
        real_correctness: true,
    },
    {
        values: {acquired: "BHealthy", acquiring: "Fiffer", date: "4/3/2018"},
        variable: "a_4",
        real_correctness: true,
    },
    {
        values: {acquired: "NewHealth", acquiring: "BHealthy", date: "2/4/2017"},
        variable: "a_5",
        real_correctness: false,
    },
];

/**
 * @brief A table of roles of members of different organizations.
 *
 * @note The real correctness is only displayed in the GUI for the demo.
 */
export const TABLE_ROLES = [
    {
        values: {organization: "A2Bdone", role: "Founder", member: "Usha Koirala"},
        variable: "r_0",
        real_correctness: false,
    },
    {
        values: {organization: "A2Bdone", role: "Founding member", member: "Pavel Lebedev"},
        variable: "r_1",
        real_correctness: true,
    },
    {
        values: {organization: "A2Bdone", role: "Founding member", member: "Nana Alvi"},
        variable: "r_2",
        real_correctness: true,
    },
    {
        values: {organization: "microBarg", role: "Co-founder", member: "Nana Alvi"},
        variable: "r_3",
        real_correctness: true,
    },
    {
        values: {organization: "microBarg", role: "Co-founder", member: "Gao Yawen"},
        variable: "r_4",
        real_correctness: true,
    },
    {
        values: {organization: "microBarg", role: "CTO", member: "Amaal Kader"},
        variable: "r_5",
        real_correctness: false,
    },
    {
        values: {organization: "BHealthy", role: "Founder", member: "Amaal Kader"},
        variable: "r_6",
        real_correctness: true,
    },
    {
        values: {organization: "BHealthy", role: "Co-founder", member: "John Levi"},
        variable: "r_7",
        real_correctness: false,
    },
    {
        values: {organization: "BHealthy", role: "Co-founder", member: "Maor Roam"},
        variable: "r_8",
        real_correctness: true,
    },
    {

        values: {organization: "BHealthy", role: "Founding member", member: "Amir Rima"},
        variable: "r_9",
        real_correctness: true,
    },
    {

        values: {organization: "NewHealth", role: "Founder", member: "Nana Alvi"},
        variable: "r_10",
        real_correctness: false,
    },
    {

        values: {organization: "NewHealth", role: "Founder", member: "Amaal Kader"},
        variable: "r_11",
        real_correctness: false,
    },
    {

        values: {organization: "NewHealth", role: "Founder", member: "Usha Koirala"},
        variable: "r_12",
        real_correctness: true,
    },
    {

        values: {organization: "NewHealth", role: "Co-founder", member: "Amir Rima"},
        variable: "r_13",
        real_correctness: true,
    },
];

/**
 * @brief A table of the education of members of different organizations.
 *
 * @note The real correctness is only displayed in the GUI for the demo.
 */
export const TABLE_EDUCATION = [
    {
        values: {alumni: "Usha Koirala", institute: "U. Melbourne", year: 2017},
        variable: "e_0",
        real_correctness: false,
    },
    {
        values: {alumni: "Pavel Lebedev", institute: "U. Melbourne", year: 2017},
        variable: "e_1",
        real_correctness: true,
    },
    {
        values: {alumni: "Nana Alvi", institute: "U. Sau Paolo", year: 2010},
        variable: "e_2",
        real_correctness: true,
    },
    {
        values: {alumni: "Nana Alvi", institute: "U. Melbourne", year: 2017},
        variable: "e_3",
        real_correctness: true,
    },
    {
        values: {alumni: "Gao Yawen", institute: "U. Sau Paolo", year: 2010},
        variable: "e_4",
        real_correctness: true,
    },
    {
        values: {alumni: "Amaal Kader", institute: "U. Cape Town", year: 2005},
        variable: "e_5",
        real_correctness: false,
    },

    {
        values: {alumni: "Amaal Kader", institute: "NYU", year: 2006},
        variable: "e_6",
        real_correctness: true,
    },
    {
        values: {alumni: "John Levi", institute: "MIT", year: 2015},
        variable: "e_7",
        real_correctness: false,
    },
    {
        values: {alumni: "Amir Rima", institute: "MIT", year: 2014},
        variable: "e_8",
        real_correctness: true,
    },
    {
        values: {alumni: "Maor Roam", institute: "U. Columbia", year: 2015},
        variable: "e_9",
        real_correctness: true,
    },
    {
        values: {alumni: "Amir Rima", institute: "NYU", year: 2014},
        variable: "e_10",
        real_correctness: false,
    },
];

/**
 * @brief The tuples in the results table, along with their provenance.
 */
export const RESULTS_TABLE = [
    {
        values: {acquired: "A2Bdone", institute: "U. Melbourne"},
        provenance: [["a_0", "r_0", "e_0"], ["a_0", "r_1", "e_1"], ["a_0", "r_2", "e_3"]]
    },
    {
        values: {acquired: "A2Bdone", institute: "U. Sau Paolo"},
        provenance: [["a_0", "r_2", "e_2"]]
    },
    {
        values: {acquired: "microBarg", institute: "U. Melbourne"},
        provenance: [["a_1", "r_3", "e_3"]]
    },
    {
        values: {acquired: "microBarg", institute: "U. Sau Paolo"},
        provenance: [["a_1", "r_3", "e_2"], ["a_1", "r_4", "e_4"]]
    },
    {
        values: {acquired: "BHealthy", institute: "U. Cape Town"},
        provenance: [["a_4", "r_6", "e_5"]]
    },
    {
        values: {acquired: "BHealthy", institute: "NYU"},
        provenance: [["a_4", "r_6", "e_6"], ["a_4", "r_9", "e_10"]]
    },
    {
        values: {acquired: "BHealthy", institute: "MIT"},
        provenance: [["a_4", "r_7", "e_7"], ["a_4", "r_9", "e_8"]]
    },
    {
        values: {acquired: "BHealthy", institute: "U. Columbia"},
        provenance: [["a_4", "r_8", "e_9"]]
    },
    {
        values: {acquired: "NewHealth", institute: "U. Sau Paolo"},
        provenance: [["a_5", "r_10", "e_2"]]
    },
    {
        values: {acquired: "NewHealth", institute: "U. Melbourne"},
        provenance: [["a_5", "r_10", "e_3"], ["a_5", "r_12", "e_0"]]
    },
    {
        values: {acquired: "NewHealth", institute: "U. Cape Town"},
        provenance: [["a_5", "r_11", "e_5"]]
    },
    {
        values: {acquired: "NewHealth", institute: "NYU"},
        provenance: [["a_5", "r_11", "e_6"], ["a_5", "r_13", "e_10"]]
    },
    {
        values: {acquired: "NewHealth", institute: "MIT"},
        provenance: [["a_5", "r_13", "e_8"]]
    },
];
