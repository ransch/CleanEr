"use client";

import styles from '/style/dashboard/results_table.module.css';
import {
    capitalize_first_letter,
    fetch_mes_score,
    LOADING_SPINNER,
    DIGITS_AFTER_POINT
} from "/app/{utils}/utils";
import {useState, useEffect} from 'react'

/**
 * @brief Convert output tuples to table rows.
 *
 * @param  sorting_order          The sorting order in the table. It's true iff it's descending
 * @param  table_columns          The columns in the results table
 * @param  tuples                 The output tuples that should be presented
 * @param  previous_tuples        The previous tuples of the opposite classification
 * @param  tuples_id              An id of the given tuples
 * @param  on_click_output_tuple  A callback that is called when the user clicks on an output tuple
 * @param  classname              The classname field of each cell
 */
function _tuples_to_rows(sorting_order, table_columns, tuples, previous_tuples, tuples_id,
                         on_click_output_tuple, classname = "") {
    let sorted_tuples = [...tuples]
    sorted_tuples.sort((a, b) =>
        (sorting_order ? b.mes_score - a.mes_score : a.mes_score - b.mes_score));

    return sorted_tuples.map((tuple, index) =>
        <tr key={`${tuples_id}_${index}`} onClick={() => {
            on_click_output_tuple(tuple)
        }}>
            {table_columns.map(column =>
                <td key={`${tuples_id}_${index}_${column}`}
                    className={classname}>{tuple.values[column]}</td>
            )}
            <td key={`${tuples_id}_${index}_prob`}
                className={classname}>
                {tuple.mes_score.toFixed(DIGITS_AFTER_POINT)}
                {tuple.previous_mes_score !== undefined &&
                    tuple.previous_mes_score < tuple.mes_score &&
                    <i className="bi bi-arrow-up"></i>}
                {tuple.previous_mes_score !== undefined &&
                    tuple.previous_mes_score > tuple.mes_score &&
                    <i className="bi bi-arrow-down"></i>}
                {previous_tuples.includes(tuple) &&
                    <i className="bi bi-dot"></i>
                }
            </td>
        </tr>
    );
}

/**
 * @brief A component for the header of the table.
 *
 * @param  sortingOrder               The sorting order in the table. It's true iff it's descending
 * @param  onClickInvertSortingOrder  The click event handler of the cell that inverts the sorting
 *                                    order
 * @param  tableColumns               The columns in the results table
 */
function TableHeader({sortingOrder, onClickInvertSortingOrder, tableColumns}) {
    return (
        <thead className="align-middle">
        <tr>
            <th key="output_tuple" scope="col" colSpan={tableColumns.length} className="w-75">
                Output Tuple
            </th>
            <th key="mes_score" scope="col" rowSpan="2" className={styles.sorted_column}
                onClick={onClickInvertSortingOrder}>
                <div className="row">
                    <div className="col-sm-9">
                        MES
                    </div>
                    <div className="col-sm-3">
                        <i className={`bi ${sortingOrder ? "bi-sort-down" :
                            "bi-sort-up-alt"} ${styles.sorted_icon}`}></i>
                    </div>
                </div>
            </th>
        </tr>
        <tr>
            {
                tableColumns.map(column =>
                    <th key={column} scope="col">{capitalize_first_letter(column)}</th>
                )
            }
        </tr>
        </thead>
    );
}

/**
 * @brief A component for the body of the table.
 *
 * @param  sortingOrder              The sorting order in the table. It's true iff it's descending
 * @param  showIncorrectTuples       Should incorrect tuples be presented
 * @param  tableColumns              The columns in the results table
 * @param  correctResults            The correct tuples in the results table
 * @param  incorrectResults          The incorrect tuples in the results table
 * @param  previousCorrectResults    The previous correct tuples in the results table
 * @param  previousIncorrectResults  The previous incorrect tuples in the results table
 * @param  onClickOutputTuple        A callback that is called when the user clicks on an output
 *                                   tuple
 */
function TableBody({
                       sortingOrder,
                       showIncorrectTuples,
                       tableColumns,
                       correctResults,
                       incorrectResults,
                       previousCorrectResults,
                       previousIncorrectResults,
                       onClickOutputTuple
                   }) {
    return (
        <tbody className="table-group-divider">
        {_tuples_to_rows(sortingOrder, tableColumns, correctResults, previousIncorrectResults,
            "correct", onClickOutputTuple)}
        {showIncorrectTuples &&
            _tuples_to_rows(sortingOrder, tableColumns, incorrectResults, previousCorrectResults,
                "incorrect", onClickOutputTuple, "bg-dark-subtle")}
        </tbody>
    );
}

/**
 * @brief A component that displays a table with the output tuples.
 *
 * @param  correctResults            Correct output tuples
 * @param  incorrectResults          Incorrect output tuples
 * @param  previousCorrectResults    Previous correct output tuples
 * @param  previousIncorrectResults  Previous incorrect output tuples
 * @param  classificationsCount      The total number of classifications
 * @param  assignment                The (possible partial) assignment created by the experts
 * @param  inputProbs                The input tuple probabilities
 * @param  onClickOutputTuple        A callback that is called when the user clicks on an output
 *                                   tuple
 */
export function ResultsTable({
                                 correctResults,
                                 incorrectResults,
                                 previousCorrectResults,
                                 previousIncorrectResults,
                                 classificationsCount,
                                 assignment,
                                 inputProbs,
                                 onClickOutputTuple
                             }) {
    // Whether incorrect tuples should be presented.
    const [show_incorrect_tuples, showIncorrectTuples] = useState(false);
    // The sorting order in the table. It's true iff it's descending.
    const [sorting_order, setSortingOrder] = useState(true);
    // Were the MES values calculated.
    const [has_probs_calculated, setHasProbsCalculated] = useState(false);

    /**
     * @brief The click event handler of the button that toggles incorrect tuples.
     */
    function on_click_toggle_incorrect_tuples() {
        showIncorrectTuples(!show_incorrect_tuples);
    }

    /**
     * @brief The click event handler of the cell that inverts the sorting order.
     */
    function on_click_invert_sorting_order() {
        setSortingOrder(!sorting_order);
    }

    /**
     * @brief Extract the columns of the table.
     *
     * @returns string[] The columns of the table.
     */
    function extract_columns() {
        const tuple = correctResults.length > 0 ? correctResults[0] : incorrectResults[0];
        return Object.getOwnPropertyNames(tuple.values);
    }

    // Fetch the MES values.
    useEffect(() => {
        const data_fetch = async () => {
            for (const results of [correctResults, incorrectResults]) {
                for (const tuple of results) {
                    tuple.previous_mes_score = tuple.mes_score;
                    tuple.mes_score = await fetch_mes_score(tuple, assignment, inputProbs);
                }
            }

            setHasProbsCalculated(true);
        }

        data_fetch();
    }, [correctResults, incorrectResults, assignment, inputProbs]);

    const results_table_columns = extract_columns();

    return (
        <>{!has_probs_calculated ?
            // If the data is not ready yet, display a spinner.
            LOADING_SPINNER :
            <>
                <table
                    className={`table table-hover align-middle text-center w-75 ${styles.table}`}>
                    <TableHeader sortingOrder={sorting_order}
                                 onClickInvertSortingOrder={on_click_invert_sorting_order}
                                 tableColumns={results_table_columns}/>
                    <TableBody sortingOrder={sorting_order}
                               showIncorrectTuples={show_incorrect_tuples}
                               tableColumns={results_table_columns}
                               correctResults={correctResults}
                               incorrectResults={incorrectResults}
                               previousCorrectResults={previousCorrectResults}
                               previousIncorrectResults={previousIncorrectResults}
                               onClickOutputTuple={onClickOutputTuple}/>
                </table>
                {incorrectResults.length > 0 ? (
                    <button
                        className={`btn btn-lg btn-block btn-light w-75 fs-6 
                                    ${styles.show_incorrect}`}
                        onClick={on_click_toggle_incorrect_tuples}>
                        {show_incorrect_tuples ? "Hide" : "Show"} incorrect tuples
                        <i className={`ms-2 ${show_incorrect_tuples ? "bi bi-arrow-bar-up" :
                            "bi bi-arrow-bar-down"}`}></i>
                    </button>
                ) : (
                    <div className="mt-2">There are no incorrect tuples.</div>
                )}

                <section className="row mt-3">
                    <section className="col">
                        <div><i className="bi bi-dot"></i>- classification changed</div>
                        <div><i className="bi bi-arrow-down"></i> - MES value decreased</div>
                        <div><i className="bi bi-arrow-up"></i> - MES value increased</div>
                    </section>
                    <section className="col">
                        <span className="fw-bold">Total cost so far:
                        </span> {classificationsCount} classifications
                    </section>
                </section>
            </>
        }</>
    );
}
