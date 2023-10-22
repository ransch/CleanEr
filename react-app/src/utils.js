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

/**
 * @brief Get the tuple that corresponds to the given variable.
 *
 * @param  variable      A variable
 * @param  input_tables  The input tables
 *
 * @returns Array The tuple that is annotated by the given variable
 */
export function var_to_tuple(variable, input_tables) {
    for (const [table_name, tuples] of Object.entries(input_tables)) {
        for (const tuple of tuples) {
            if (tuple.variable === variable) {
                return [table_name, tuple];
            }
        }
    }

    throw new Error('Invalid variable');
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

/**
 * @brief A single step in the MES reaching algorithm.
 *
 * @param  output_tuple       An output tuple
 * @param  desired_mes_score  The desired MES value
 * @param  assignment         An assignment for which the truth value of the output tuple is
 *                            determined
 */
export function mes_reaching_algorithm_step(output_tuple, desired_mes_score, assignment) {
    const truth_value = calc_truth_value(output_tuple.provenance, assignment);
    if (truth_value == null) {
        throw new Error("Truth value can't be determined");
    }

    if (truth_value === true) {
        // Find a satisfied term.
        terms_loop:
            for (const term of output_tuple.provenance) {
                for (const variable of term) {
                    if (!assignment.get(variable)) {
                        continue terms_loop;
                    }
                }

                return [...term];
            }

        throw new Error("Unreachable code");
    }

    // Return an unsatisfied variable from every term.
    let ret = [];
    terms_loop:
        for (const term of output_tuple.provenance) {
            for (const variable of term) {
                if (!assignment.get(variable)) {
                    ret.push(variable);
                    continue terms_loop;
                }
            }
        }

    if (ret.length !== output_tuple.provenance.length) {
        throw new Error("Unexpected length");
    }

    // Remove duplications.
    return [...new Set(ret)];
}
