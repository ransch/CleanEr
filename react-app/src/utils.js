import {FLASK_APP_API_VAR_TO_TUPLE} from "../app/{utils}/utils";

const seedrandom = require('./seedrandom.min.js');

/**
 * @brief Extract all the variables from a provenance.
 *
 * @param  provenance  A k-DNF formula
 *
 * @returns Set The set of variables in the given provenance.
 */
export function extract_vars_from_provenance(provenance) {
    let ret = new Set();
    for (const term of provenance) {
        for (const variable of term) {
            ret.add(variable);
        }
    }

    return ret;
}

const random_seed = 0
const random_number_gen = seedrandom(random_seed);

const var_to_tuple_cache = new Map()

/**
 * @brief Get the tuple that corresponds to the given variable.
 *
 * @param variable A variable
 * @param db_name The name of the database
 *
 * @returns Array The name of the table and the tuple
 */
export function var_to_tuple(variable, db_name) {
    if (!var_to_tuple_cache.has(db_name)) {
        var_to_tuple_cache.set(db_name, new Map());
    }
    const cache = var_to_tuple_cache.get(db_name);

    if (cache.has(variable)) {
        return cache.get(variable);
    }

    const params = new URLSearchParams({
        "var": variable,
        "db_name": db_name,
    });

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${FLASK_APP_API_VAR_TO_TUPLE}?${params.toString()}`, false);
    xhr.send();
    if (xhr.status !== 200) {
        throw new Error(`xhr.status ${xhr.status}`);
    }

    const returnedJson = JSON.parse(xhr.response);
    returnedJson['tuple']['real_correctness'] = (random_number_gen.int32() % 2 === 0)

    cache.set(variable, [returnedJson['table'], returnedJson['tuple']]);
    return cache.get(variable);
}

/**
 * @brief Calculate the truth value of a given formula.
 *
 * @param  provenance  A k-DNF formula
 * @param  assignment  A possible partial assignment
 *
 * @returns boolean The truth value of the given formula, or null if it's undetermined.
 */
export function calc_truth_value(provenance, assignment) {
    let terms_truth_values = [];

    for (const term of provenance) {
        let term_truth_values = [];
        for (const variable of term) {
            term_truth_values.push(assignment.get(variable));
        }

        if (term_truth_values.every(val => val === true)) {
            terms_truth_values.push(true);
        } else if (term_truth_values.some(val => val === false)) {
            terms_truth_values.push(false);
        } else {
            terms_truth_values.push(null);
        }
    }

    if (terms_truth_values.every(val => val === false)) {
        return false;
    } else if (terms_truth_values.some(val => val === true)) {
        return true;
    }

    return null;
}

/**
 * @brief Extract all the variables from output tuples.
 *
 * @param  tuples  An array of output tuples
 *
 * @returns Set The set of variables in the given output tuples.
 */
export function extract_vars_from_tuples(tuples) {
    let ret = new Set();

    for (const tuple of tuples) {
        const vars = extract_vars_from_provenance(tuple.provenance);
        for (const variable of vars) {
            ret.add(variable);
        }
    }

    return ret;
}

/**
 * @brief Check if a variable is crucial for classification.
 *
 * @param  provenance  A k-DNF formula
 * @param  variable    A variable
 * @param  assignment  A possible partial assignment
 *
 * @returns boolean|null True if the variable is crucial for classification, false if it's not
 *          crucial, or null if it's undetermined.
 */
export function is_variable_crucial(provenance, variable, assignment) {
    const truth_value = calc_truth_value(provenance, assignment);
    if (truth_value == null || !assignment.has(variable)) {
        return null;
    }

    const variable_truth_value = assignment.get(variable);
    if (truth_value !== variable_truth_value) {
        return false;
    }

    let inverted_assignment = new Map(assignment);
    inverted_assignment.set(variable, !variable_truth_value);
    const inverted_truth_value = calc_truth_value(provenance, inverted_assignment);
    if (inverted_truth_value == null) {
        return true;
    }

    return truth_value !== inverted_truth_value;
}

function _mes_reaching_algorithm_step(output_tuple, assignment, input_probs, desired_score) {
    const truth_value = calc_truth_value(output_tuple.provenance, assignment);
    if (truth_value == null) {
        throw new Error("Truth value can't be determined");
    }

    if (truth_value === true) {
        // Pick a satisfied term with the smallest number of variables whose error probabilities are
        // above the desired .
        let ret = [];
        let ret_cost = Infinity;
        terms_loop:
            for (const term of output_tuple.provenance) {
                for (const variable of term) {
                    if (!assignment.get(variable)) {
                        continue terms_loop;
                    }
                }

                if (term.length < ret_cost) {
                    ret = term.filter(v => input_probs.get(v) > desired_score);
                    ret_cost = term.length;
                }

            }

        return ret;
    }

    // Return an unsatisfied variable with minimal probability from every term.
    let ret = [];
    for (const term of output_tuple.provenance) {
        let picked_var = undefined;
        let picked_var_prob = 1;
        for (const variable of term) {
            if (!assignment.get(variable)) {
                if (input_probs.get(variable) < picked_var_prob) {
                    picked_var = variable;
                    picked_var_prob = input_probs.get(variable);
                }
            }
        }
        ret.push(picked_var);
    }

    if (ret.length !== output_tuple.provenance.length) {
        throw new Error("Unexpected length");
    }

    ret = ret.filter(v => input_probs.get(v) > desired_score);

    return ret;
}


/**
 * @brief A single step in the MES reaching algorithm.
 *
 * @param  output_tuples  Output tuples
 * @param  mes_scores     The updated mes scores of `output_tuples` - don't use their `mes_score`
 *                        fields, only use this argument
 * @param  assignment     An assignment for which the truth value of the output tuple is determined
 * @param  input_probs    The error probabilities
 * @param  desired_score  The desired maximal MES value
 */
export function mes_reaching_algorithm_step(output_tuples, mes_scores, assignment, input_probs, desired_score) {
    const max_index = mes_scores.indexOf(Math.max(...mes_scores));

    const ret = _mes_reaching_algorithm_step(output_tuples[max_index], assignment,
        input_probs, desired_score)
    // Remove duplications.
    return [...new Set(ret)];
}
