import styles from '/style/dashboard/expert_input.module.css';

/**
 * @brief A component for displaying the values of an input tuple.
 *
 * @param  inputTuple  An input tuple
 */
function InputTuple({inputTuple}) {
    const input_tuple_entries = Object.entries(inputTuple);
    const fields = input_tuple_entries.map(x => x[0]);
    const values = input_tuple_entries.map(x => x[1]);

    return (
        <table className={`table align-middle text-center w-75 ${styles.table}`}>
            <thead className="align-middle">
            <tr>
                {fields.map((field, index) =>
                    <th key={`field_${index}`} scope="col">{field}</th>
                )}
            </tr>
            </thead>
            <tbody className="table-group-divider">
            <tr key="d">
                {values.map((value, index) =>
                    <td key={`value_${index}`}>{value}</td>
                )}
            </tr>
            </tbody>
        </table>
    );
}

/**
 * @brief A component for getting expert inputs.
 *
 * @param  inputTuple          An input tuple that should be cleaned
 * @param  realCorrectness     The real correctness of the input tuple
 * @param  onClassify          A callback that is called when the expert classifies the input tuple
 * @param  isUnderlyingSystem  Whether the current cleaning step has been requested by the
 *                             underlying cleaning system
 */
export function ExpertInput({inputTuple, realCorrectness, onClassify, isUnderlyingSystem}) {
    return (
        <div className={`pt-3 pb-2 ${styles.experts_panel}`}>
            <h1 className="text-center">Expert input</h1>
            <InputTuple inputTuple={inputTuple}/>
            <div className={`w-75 mt-4 ${styles.instructions}`}>
                This input tuple is <span className="fw-bold">
                {realCorrectness ? "Correct" : "Incorrect"}</span>.
                Determine the classification of the experts.
            </div>
            <div className={`btn-toolbar text-center mt-4 ${styles.input_buttons}`}>
                <div className="btn-group me-4">
                    <button type="button" className="btn btn-danger"
                            onClick={() => onClassify(false)}>
                        Incorrect
                    </button>
                    <button type="button" className="btn btn-success"
                            onClick={() => onClassify(true)}>
                        Correct
                    </button>
                </div>
                <div className="btn-group">
                    <button type="button" className="btn btn-dark">Skip Steps</button>
                </div>
            </div>
            <div className={`mt-2 ms-2 ${styles.step_source_container}`}>
                <i className="bi bi-asterisk me-2"></i>
                This cleaning step has been requested by
                {isUnderlyingSystem ?
                    <>&nbsp;the <span className={styles.step_source}>
                        underlying cleaning system</span>.</> :
                    <>&nbsp;<span className={styles.step_source}>CleanEr</span>.</>
                }
            </div>
        </div>
    );
}
