import {num_to_str, PROBS_STEP} from "/app/{utils}/utils";

/**
 * @brief The ID of the modal for starting an algorithm for achieving a MES value.
 */
export const REACH_MES_SCORE_MODAL_ID = "reach_mes_score_modal";

/**
 * @brief The ID of the input in which the user enters the desired MES value.
 */
const DESIRED_MES_SCORE_INPUT_ID = "desired-mes-score-input";

/**
 * @brief The ID of the input in which the user enters the maximal cost.
 */
const MAXIMAL_COST_INPUT_ID = "maximal-cost-input";

/**
 * @brief A modal for starting an algorithm for achieving a MES value.
 *
 * @param  outputTuples              The selected output tuple
 * @param  onClickStartMesAlgorithm  A callback that is called when the user starts the algorithm
 */
export function ReachMesScoreModal({outputTuples, onClickStartMesAlgorithm}) {
    const max_mes = outputTuples.length === 0 ? 0 : Math.max(...outputTuples.map(
        (t) => t.mes_score
    ))

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
                        <div className="text-center mb-3">
                            Current maximal MES
                            value: {num_to_str(max_mes)}
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
                                       id={DESIRED_MES_SCORE_INPUT_ID} defaultValue={0}
                                       step={PROBS_STEP} autoComplete="off"/>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <label
                                className="form-label m-0 p-0 col d-flex flex-column
                                justify-content-center text-end"
                                htmlFor={MAXIMAL_COST_INPUT_ID}>
                                Maximal cost
                            </label>
                            <div className="col">
                                <input type="text" className="form-control"
                                       id={MAXIMAL_COST_INPUT_ID} defaultValue="-"
                                       autoComplete="off"/>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={() => {
                            onClickStartMesAlgorithm(
                                outputTuples,
                                parseFloat(document.getElementById(DESIRED_MES_SCORE_INPUT_ID).value),
                                parseFloat(document.getElementById(MAXIMAL_COST_INPUT_ID).value));
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
