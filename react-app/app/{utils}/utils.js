import styles from "/style/utils.module.css";
import {extract_vars_from_provenance} from "/src/utils";

/**
 * @brief The base URL of the Flask application.
 */
const FLASK_APP_API_BASE_URL = "http://localhost:5000";

/**
 * @brief The URL of the Flask application used for calculating MES values.
 */
export const FLASK_APP_API_CALC_MES_SCORE_URL = `${FLASK_APP_API_BASE_URL}/calc_max_misclass_prob`;

/**
 * @brief The URL of the Flask application used for checking if a variable is risky for precision.
 */
export const FLASK_APP_API_IS_VAR_RISKY_URL =
    `${FLASK_APP_API_BASE_URL}/is_var_risky_for_precision`;

/**
 * @brief The base URL of the Node application.
 */
const NODE_APP_API_BASE_URL = "/api";

/**
 * @brief The URL of the Node application used for fetching the input tables.
 */
export const NODE_APP_API_INPUT_TABLES = `${NODE_APP_API_BASE_URL}/database/tables`;

/**
 * @brief The URL of the Node application used for fetching the query results.
 */
export const NODE_APP_API_QUERY_RESULTS = `${NODE_APP_API_BASE_URL}/database/query`;

/**
 * @brief A loading spinner element.
 */
export const LOADING_SPINNER = (
    <div className={`spinner-border text-primary ${styles.loading_spinner}`} role="status">
    </div>
);

/**
 * @brief The number of digits after decimal point for presentation.
 */
export const DIGITS_AFTER_POINT = 3;

/**
 * @brief The step size in probability inputs.
 */
export const PROBS_STEP = .01;

/**
 * @brief The default maximal basic probability.
 */
export const DEFAULT_MAX_PROB = .25;

/**
 * @brief The minimal value of the maximal basic probability.
 */
export const MIN_MAX_PROB = PROBS_STEP;

/**
 * @brief The maximal value of the maximal basic probability.
 */
export const MAX_MAX_PROB = .5 - PROBS_STEP;

/**
 * @brief Capitalize the first letter of the given string.
 *
 * @param  str  A string
 *
 * @returns string A copy of the first string with the first letter capitalized.
 */
export function capitalize_first_letter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * @brief Fetch the MES value from the Flask app.
 *
 * @param  output_tuple  An output tuple
 * @param  assignment    An assignment
 * @param  input_probs   The input tuple probabilities
 *
 * @returns double The maximal probability of misclassifying the given tuple.
 */
export async function fetch_mes_score(output_tuple, assignment, input_probs) {
    const vars = extract_vars_from_provenance(output_tuple.provenance);
    let assignment_object = {};
    let probs = {};
    let are_all_zeros = true;
    for (const variable of vars) {
        assignment_object[variable] = assignment.get(variable);
        probs[variable] = input_probs.get(variable);
        if (probs[variable] !== 0) {
            are_all_zeros = false;
        }
    }

    if (are_all_zeros) {
        return 0;
    }

    const params = new URLSearchParams({
        "formula": JSON.stringify(output_tuple.provenance),
        "assignment": JSON.stringify(assignment_object),
        "probs": JSON.stringify(probs)
    });
    let api_res = await fetch(`${FLASK_APP_API_CALC_MES_SCORE_URL}?${params.toString()}`);
    if (!api_res.ok) {
        throw new Error('Failed to fetch MES values');
    }
    const api_res_json = await api_res.json();

    return api_res_json.max_prob;
}
