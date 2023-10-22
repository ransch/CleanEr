"use client";

import {extract_vars_from_provenance, var_to_tuple, is_variable_crucial} from "/src/utils";
import {
    capitalize_first_letter,
    FLASK_APP_API_IS_VAR_RISKY_URL,
} from "/app/{utils}/utils";
import styles from '/style/dashboard/output_tuple_details.module.css';
import {useState, useEffect} from 'react'

/**
 * @brief The ID of the modal that shows details about an output tuple.
 */
export const OUTPUT_TUPLE_DETAILS_ID = "output_tuple_details_modal";

/**
 * @brief The icon of a crucial variable.
 */
const CRUCIAL_VAR_ICON = <i className="bi bi-exclamation-circle"></i>;

/**
 * @brief The icon of a risky variable.
 */
const RISKY_VAR_ICON = <i className="bi bi-exclamation-triangle"></i>;

/**
 * @brief The icon of a correct variable.
 */
const CORRECT_VAR_ICON = <i className="bi bi-check-circle"></i>;

/**
 * @brief The icon of an incorrect variable.
 */
const INCORRECT_VAR_ICON = <i className="bi bi-x-circle"></i>;

/**
 * @brief THe icon of an unclassified variable.
 */
const UNCLASSIFIED_VAR_ICON = <i className="bi bi-question-circle"></i>;

/**
 * @brief A component that shows the input tuples related to an output tuple.
 *
 * @param  outputTuple          An output tuple
 * @param  inputTables          The input tables
 * @param  assignment           The (possible partial) assignment created by the experts
 * @param  inputProbs           The input tuple probabilities
 * @param  onClickInputTuple    A callback that is called when the user clicks on an input tuple
 * @param  showCorrectTuples    Whether correct tuples should be presented
 * @param  showIncorrectTuples  Whether incorrect tuples should be presented
 * @param  showUnknownTuples    Whether tuples whose correctness is unknown should be presented
 * @param  showCrucialTuples    Whether crucial tuples should be presented
 * @param  showRiskyTuples      Whether risky tuples should be presented
 */
function RelatedInputTuples({
                                outputTuple,
                                inputTables,
                                assignment,
                                inputProbs,
                                onClickInputTuple,
                                showCorrectTuples,
                                showIncorrectTuples,
                                showUnknownTuples,
                                showCrucialTuples,
                                showRiskyTuples
                            }) {
    /**
     * @brief Get the tuples that corresponds to the given variables, grouped by the tables.
     *
     * @param  input_vars  A set of variables
     *
     * @returns Map An map of sets of input tuples.
     */
    function input_vars_to_tuples(input_vars) {
        const ret = new Map();
        for (const input_var of input_vars) {
            const [table_name, input_tuple] = var_to_tuple(input_var, inputTables);
            const new_element = {variable: input_var, tuple: input_tuple};

            if (ret.has(table_name)) {
                ret.get(table_name).add(new_element)
            } else {
                ret.set(table_name, new Set([new_element]));
            }
        }

        return ret;
    }

    /**
     * @brief Get the classname of the table row that presents the given input variable.
     *
     * @param  input_var          The input variable presented in the row
     * @param  crucial_variables  The set of crucial variables
     * @param  risky_vars         The set of risky variables
     *
     * @returns string The classname of the table row that presents the given input variable.
     */
    function get_row_classname(input_var, crucial_variables, risky_vars) {
        if ((crucial_variables.has(input_var) && !showCrucialTuples) ||
            (risky_vars.has(input_var) && !showRiskyTuples)) {
            return styles.hidden_tuple;
        }

        if (!assignment.has(input_var)) {
            // The tuple's correctness is unknown.
            if (!showUnknownTuples) {
                return styles.hidden_tuple;
            }

            return "";
        }

        // The tuple's correctness is known.

        const is_satisfied = assignment.get(input_var)

        if (is_satisfied) {
            if (!showCorrectTuples) {
                return styles.hidden_tuple;
            }

            return "bg-success-subtle";
        }

        // The tuple is not satisfied.

        if (!showIncorrectTuples) {
            return styles.hidden_tuple;
        }

        return "bg-danger-subtle";
    }

    // The input variables in the output tuple's provenance.
    const input_vars = extract_vars_from_provenance(outputTuple.provenance);
    // The tuples that correspond to the variables in input_vars.
    const input_tuples = input_vars_to_tuples(input_vars);
    // The set of risky variables for precision.
    const [risky_vars, setRiskyVars] = useState(new Set());
    // The set of crucial variables.
    let crucial_variables = new Set();
    for (const variable of input_vars) {
        if (is_variable_crucial(outputTuple.provenance, variable, assignment)) {
            crucial_variables.add(variable)
        }
    }

    // Check if the input variables are risky.
    useEffect(() => {
        const data_fetch = async () => {
            let local_risky_vars = new Set();
            let assignment_object = {};
            let probs = {};
            let are_all_zeros = true;
            for (const variable of input_vars) {
                assignment_object[variable] = assignment.get(variable)
                probs[variable] = inputProbs.get(variable);
                if (probs[variable] !== 0) {
                    are_all_zeros = false;
                }
            }

            if (are_all_zeros) {
                return;
            }

            for (const input_var of input_vars) {
                if (assignment_object[input_var] == null || probs[input_var] === 0) {
                    continue;
                }

                const params = new URLSearchParams({
                    "formula": JSON.stringify(outputTuple.provenance),
                    "assignment": JSON.stringify(assignment_object),
                    "probs": JSON.stringify(probs),
                    "variable": input_var
                });
                let api_res = await fetch(`${FLASK_APP_API_IS_VAR_RISKY_URL}?${params.toString()}`);
                if (!api_res.ok) {
                    throw new Error('Failed to check if a variable is risky');
                }
                const api_res_json = await api_res.json();

                if (api_res_json.is_risky) {
                    local_risky_vars.add(input_var);
                }
            }

            setRiskyVars(local_risky_vars);
        }

        data_fetch();
    }, [outputTuple, inputTables, assignment, inputProbs]);

    return (<>{[...input_tuples.entries()].map(([table_name, tuples]) =>
            <div key={table_name}>
                <h3 className="fs-4">{capitalize_first_letter(table_name)}</h3>
                <table className={`table table-hover align-middle text-center ${styles.table}`}>
                    <thead className="align-middle">
                    <tr>
                        <th key={`${table_name}_icons`}></th>
                        {Object.entries(tuples.values().next().value.tuple.values).map(
                            (pair, index) =>
                                <th key={`${table_name}_field_${index}`}
                                    scope="col">{capitalize_first_letter(pair[0])}</th>
                        )}
                        <th key={`${table_name}_prob`}>probability</th>
                    </tr>
                    </thead>
                    <tbody className="table-group-divider">
                    {[...tuples.values()].map((element, tuple_index) =>
                        <tr key={`${table_name}_${tuple_index}`}
                            className={
                                get_row_classname(element.variable, crucial_variables, risky_vars)
                            }
                            onClick={() => {
                                onClickInputTuple(element.tuple)
                            }}>
                            <td key={`${table_name}_${tuple_index}_icons`}>
                                <div className={styles.icons_container}>
                                    {assignment.has(element.variable) ?
                                        (assignment.get(element.variable) ?
                                            CORRECT_VAR_ICON : INCORRECT_VAR_ICON) :
                                        UNCLASSIFIED_VAR_ICON}
                                    {crucial_variables.has(element.variable) && CRUCIAL_VAR_ICON}
                                    {risky_vars.has(element.variable) && RISKY_VAR_ICON}
                                </div>
                            </td>
                            {Object.entries(element.tuple.values).map((pair, value_index) =>
                                <td key={`${table_name}_${tuple_index}_${value_index}`}>
                                    {pair[1]}
                                </td>
                            )}
                            <td key={`${table_name}_${tuple_index}_prob`}>
                                {assignment.has(element.variable) &&
                                    inputProbs.get(element.variable)}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        )}</>
    );
}

/**
 * @brief A component that shows details about an output tuple.
 *
 * @param  outputTuple           An output tuple
 * @param  inputTables           The input tables
 * @param  assignment            The (possible partial) assignment created by the experts
 * @param  inputProbs            The input tuple probabilities
 * @param  onClickInputTuple     A callback that is called when the user clicks on an input tuple
 *                               (related to an output tuple)
 * @param  onClickReachMesScore  A callback that is called when the user clicks on the button of
 *                               "Reach MES value"
 */
export function OutputTupleDetails({
                                       outputTuple,
                                       inputTables,
                                       assignment,
                                       inputProbs,
                                       onClickInputTuple,
                                       onClickReachMesScore
                                   }) {
    // Whether correct tuples should be presented.
    const [show_correct_tuples, showCorrectTuples] = useState(true);
    // Whether incorrect tuples should be presented.
    const [show_incorrect_tuples, showIncorrectTuples] = useState(true);
    // Whether tuples whose correctness is unknown should be presented.
    const [show_unknown_tuples, showUnknownTuples] = useState(true);
    // Whether crucial tuples should be presented.
    const [show_crucial_tuples, showCrucialTuples] = useState(true);
    // Whether risky tuples should be presented.
    const [show_risky_tuples, showRiskyTuples] = useState(true);

    /**
     * @brief The click event handler of the button that toggles correct tuples.
     */
    function on_click_toggle_correct_tuples() {
        showCorrectTuples(!show_correct_tuples);
    }

    /**
     * @brief The click event handler of the button that toggles incorrect tuples.
     */
    function on_click_toggle_incorrect_tuples() {
        showIncorrectTuples(!show_incorrect_tuples);
    }

    /**
     * @brief The click event handler of the button that toggles tuples whose correctness is
     *        unknown.
     */
    function on_click_toggle_unknown_tuples() {
        showUnknownTuples(!show_unknown_tuples);
    }

    /**
     * @brief The click event handler of the button that toggles crucial tuples.
     */
    function on_click_toggle_crucial_tuples() {
        showCrucialTuples(!show_crucial_tuples);
    }

    /**
     * @brief The click event handler of the button that toggles risky tuples.
     */
    function on_click_toggle_risky_tuples() {
        showRiskyTuples(!show_risky_tuples);
    }

    return (
        <div className="modal fade" id={OUTPUT_TUPLE_DETAILS_ID}>
            <div className="modal-dialog modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>
                    <div className="modal-body">
                        {(outputTuple != null && inputTables != null && assignment != null &&
                            inputProbs != null) && <>
                            <h2 className="fs-3">Related input tuples</h2>
                            <section className={styles.icons_meaning}>
                                <span onClick={on_click_toggle_correct_tuples}
                                      className={!show_correct_tuples ? styles.hidden_label : ""}>
                                    {CORRECT_VAR_ICON} - correct
                                </span>
                                <span onClick={on_click_toggle_incorrect_tuples}
                                      className={!show_incorrect_tuples ? styles.hidden_label : ""}>
                                    {INCORRECT_VAR_ICON} - incorrect
                                </span>
                                <span onClick={on_click_toggle_unknown_tuples}
                                      className={!show_unknown_tuples ? styles.hidden_label : ""}>
                                    {UNCLASSIFIED_VAR_ICON} - unknown correctness
                                </span>
                                <span onClick={on_click_toggle_crucial_tuples}
                                      className={!show_crucial_tuples ? styles.hidden_label : ""}>
                                    {CRUCIAL_VAR_ICON} - crucial
                                </span>
                                <span onClick={on_click_toggle_risky_tuples}
                                      className={!show_risky_tuples ? styles.hidden_label : ""}>
                                    {RISKY_VAR_ICON} - risky
                                </span>
                            </section>
                            <RelatedInputTuples outputTuple={outputTuple}
                                                inputTables={inputTables}
                                                assignment={assignment}
                                                inputProbs={inputProbs}
                                                onClickInputTuple={onClickInputTuple}
                                                showCorrectTuples={show_correct_tuples}
                                                showIncorrectTuples={show_incorrect_tuples}
                                                showUnknownTuples={show_unknown_tuples}
                                                showCrucialTuples={show_crucial_tuples}
                                                showRiskyTuples={show_risky_tuples}/>
                        </>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary"
                                onClick={onClickReachMesScore}>
                            Reach MES value
                        </button>
                        <button type="button" className="btn btn-secondary"
                                data-bs-dismiss="modal">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
