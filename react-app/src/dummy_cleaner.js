import {calc_truth_value, extract_vars_from_tuples} from "/src/utils";

/**
 * @brief A dummy underlying data cleaner.
 */
export class DummyCleaner {
    #tuples;
    #tuples_truth_values;
    #vars_truth_values = new Map();

    /**
     * @brief Recalculate this.#tuples_truth_values.
     */
    #calc_tuples_truth_values() {
        for (let i = 0; i < this.#tuples.length; ++i) {
            this.#tuples_truth_values[i] = calc_truth_value(this.#tuples[i].provenance,
                this.#vars_truth_values);
        }
    }

    /**
     * @param  output_tuples  An array of output tuples that should be cleaned
     */
    constructor(output_tuples) {
        this.#tuples = output_tuples;
        this.#tuples_truth_values = new Array(output_tuples.length).fill(null);
        const vars = extract_vars_from_tuples(output_tuples);
        for (const variable of vars) {
            this.#vars_truth_values.set(variable, null);
        }
    }

    /**
     * @brief Check whether the cleaning process has been finished.
     *
     * @returns boolean True iff the cleaning process has been finished.
     */
    has_cleaning_finished() {
        return this.#tuples_truth_values.every(val => val != null);
    }

    /**
     * @brief Get the next variable to clean.
     *
     * @returns string The next variable to clean.
     */
    get_next_var_to_clean() {
        const unclassified_tuples = this.#tuples.filter((tuple, index) =>
            this.#tuples_truth_values [index] == null);
        const variables = extract_vars_from_tuples(unclassified_tuples);
        for (const variable of variables) {
            if (this.#vars_truth_values.get(variable) == null) {
                return variable;
            }
        }

        throw new Error("Cannot find next variable");
    }

    /**
     * @brief Update a variable's truth value.
     *
     * @param  variable     A variable
     * @param  truth_value  The variable's truth value
     */
    set_var_truth_value(variable, truth_value) {
        if (!this.#vars_truth_values.has(variable)) {
            throw new Error("The given variable does not exist");
        }

        this.#vars_truth_values.set(variable, truth_value);

        this.#calc_tuples_truth_values();
    }

    /**
     * @brief Get the truth values defined for variables.
     *
     * @returns Map The truth values defined for variables.
     */
    get_vars_truth_values() {
        let ret = new Map();

        for (const [variable, truth_value] of this.#vars_truth_values) {
            if (truth_value != null) {
                ret.set(variable, truth_value);
            }
        }

        return ret;
    }

    /**
     * @brief Get the correct output tuples.
     */
    get_correct_tuples() {
        return this.#tuples.filter((tuple, index) => this.#tuples_truth_values [index]);
    }

    /**
     * @brief Get the incorrect output tuples.
     */
    get_incorrect_tuples() {
        return this.#tuples.filter((tuple, index) => !this.#tuples_truth_values [index]);
    }
}
