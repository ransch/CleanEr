import {
    DIGITS_AFTER_POINT,
    PROBS_STEP,
    MIN_MAX_PROB,
    MAX_MAX_PROB,
    capitalize_first_letter
} from "/app/{utils}/utils";
import styles from '/style/dashboard/improve_input_tuple_prob.module.css';

/**
 * @brief The ID of the modal for improving the maximal probability of an input tuple.
 */
export const IMPROVE_INPUT_TUPLE_PROB_ID = "improve_input_tuple_prob_modal";

/**
 * @brief The ID of the input in which the user enters the new probability.
 */
const NEW_PROB_INPUT_ID = "new-prob-input";

/**
 * @brief A component for improving the maximal probability of an input tuple.
 *
 * @param  inputTuple    The input tuple to improve
 * @param  inputProbs    The input tuple probabilities
 * @param  isClassified  Whether the input tuple is classified or not
 * @param  updateProb    A callback that updates the given tuple's probability
 */
export function ImproveInputTupleProb({inputTuple, inputProbs, isClassified, updateProb}) {
    const current_prob = (inputTuple != null && inputProbs != null) ?
        inputProbs.get(inputTuple.variable) : 0;
    const max_new_prob = isClassified ? current_prob - PROBS_STEP : MAX_MAX_PROB;

    return (
        <div className="modal fade" id={IMPROVE_INPUT_TUPLE_PROB_ID}>
            <div className="modal-dialog modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>
                    <div className="modal-body">
                        <h2 className="fs-3">
                            {isClassified ? "Improve " : "Set "} input tuple probability
                        </h2>
                        <div className="row">
                            <table className={`table table-hover align-middle text-center`}>
                                <thead className="align-middle">
                                <tr>
                                    {inputTuple != null && Object.entries(inputTuple.values).map(
                                        (pair, index) =>
                                            <th key={`input_tuple_table_field_${index}`}
                                                scope="col">{capitalize_first_letter(pair[0])}</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="table-group-divider">
                                <tr key={`input_tuple_table_values`}>
                                    {inputTuple != null && Object.entries(inputTuple.values).map(
                                        (pair, value_index) =>
                                            <td key={`input_tuple_table_values_${value_index}`}>
                                                {pair[1]}
                                            </td>
                                    )}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        {isClassified &&
                            <div className={`row mb-2 ${styles.current_prob}`}>
                                Current probability: {current_prob.toFixed(DIGITS_AFTER_POINT)}
                            </div>}
                        <div className="row">
                            <label
                                className="form-label m-0 p-0 col d-flex flex-column
                                justify-content-center text-end"
                                htmlFor={NEW_PROB_INPUT_ID}>
                                {isClassified ? "New probability" : "Probability"}
                            </label>
                            <div className="col">
                                <input type="number" className="form-control"
                                       id={NEW_PROB_INPUT_ID} defaultValue={MIN_MAX_PROB}
                                       min={MIN_MAX_PROB} max={max_new_prob}
                                       step={PROBS_STEP} autoComplete="off"/>
                            </div>
                        </div>

                        <button type="submit" className={`btn btn-primary mt-2 py-2 px-3 
                        ${styles.submit_button}`} onClick={() => {
                            updateProb(parseFloat(
                                document.getElementById(NEW_PROB_INPUT_ID).value));
                        }}>
                            Submit
                        </button>
                    </div>
                    <div className="modal-footer">
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
