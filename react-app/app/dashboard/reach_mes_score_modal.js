import {
    PROBS_STEP,
    MIN_MAX_PROB,
    DIGITS_AFTER_POINT,
    capitalize_first_letter
} from "/app/{utils}/utils";

/**
 * @brief The ID of the modal for starting an algorithm for achieving a MES value.
 */
export const REACH_MES_SCORE_MODAL_ID = "reach_mes_score_modal";

/**
 * @brief The ID of the input in which the user enters the desired MES value.
 */
const DESIRED_MES_SCORE_INPUT_ID = "desired-mes-score-input";

/**
 * @brief A modal for starting an algorithm for achieving a MES value.
 *
 * @param  outputTuple               The selected output tuple
 * @param  currentScore              The current MES value of the selected output tuple
 * @param  onClickStartMesAlgorithm  A callback that is called when the user starts the algorithm
 */
export function ReachMesScoreModal({outputTuple, currentScore, onClickStartMesAlgorithm}) {
    const max_desired_score = currentScore !== undefined ? currentScore - PROBS_STEP : 0;

    return (
        <div className="modal fade" id={REACH_MES_SCORE_MODAL_ID}>
            <div className="modal-dialog modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>
                    <div className="modal-body">
                        <h2 className="fs-3">Reach Desired MES</h2>
                        <div className="row">
                            <table className={`table table-hover align-middle text-center`}>
                                <thead className="align-middle">
                                <tr>
                                    {outputTuple != null && Object.entries(outputTuple.values).map(
                                        (pair, index) =>
                                            <th key={`output_tuple_table_field_${index}`}
                                                scope="col">{capitalize_first_letter(pair[0])}</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="table-group-divider">
                                <tr key={`output_tuple_table_values`}>
                                    {outputTuple != null && Object.entries(outputTuple.values).map(
                                        (pair, value_index) =>
                                            <td key={`output_tuple_table_values_${value_index}`}>
                                                {pair[1]}
                                            </td>
                                    )}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="text-center mb-3">
                            Current MES value: {currentScore.toFixed(DIGITS_AFTER_POINT)}
                        </div>
                        <div className="row">
                            <label
                                className="form-label m-0 p-0 col d-flex flex-column
                                justify-content-center text-end"
                                htmlFor={DESIRED_MES_SCORE_INPUT_ID}>
                                Desired MES value
                            </label>
                            <div className="col">
                                <input type="number" className="form-control"
                                       id={DESIRED_MES_SCORE_INPUT_ID} defaultValue={MIN_MAX_PROB}
                                       min={MIN_MAX_PROB} max={max_desired_score}
                                       step={PROBS_STEP} autoComplete="off"/>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={() => {
                            onClickStartMesAlgorithm(parseFloat(
                                document.getElementById(DESIRED_MES_SCORE_INPUT_ID).value));
                        }}>
                            Start algorithm
                        </button>
                        <button type="button" className="btn btn-secondary"
                                data-bs-dismiss="modal">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
        ;
}
