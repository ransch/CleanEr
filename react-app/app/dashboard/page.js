"use client";

import {InputSummary} from './input_summary';
import {ExpertInput} from './expert_input';
import {ResultsTable} from './results_table';
import {DummyCleaner} from "/src/dummy_cleaner";
import {
    fetch_mes_score,
    FLASK_APP_API_CLEANED_DB,
    FLASK_APP_API_QUERY_RESULTS,
    LOADING_SPINNER
} from "/app/{utils}/utils";
import {extract_vars_from_tuples, mes_reaching_algorithm_step, var_to_tuple,} from "/src/utils";
import {DB_NAME_ID, PROB_INPUT_ID, QUERY_INPUT_ID} from '/app/user_input';
import {OUTPUT_TUPLE_DETAILS_ID, OutputTupleDetails} from "./output_tuple_details";
import {IMPROVE_INPUT_TUPLE_PROB_ID, ImproveInputTupleProb} from "./improve_input_tuple_prob";
import {REACH_MES_SCORE_MODAL_ID, ReachMesScoreModal} from "./reach_mes_score_modal";
import {useSearchParams} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';

// The modal that presents details about an output tuple.
let output_tuple_details_modal = null;
// The modal for improving the maximal probability of an input tuple (related to an output tuple).
let improve_input_tuple_prob_modal = null;
// The modal for starting an algorithm for achieving a MES value.
let reach_mes_score_modal = null;

/**
 * @brief This is the main page of the application. It displays the dashboard.
 */
export default function Page() {
    // The tuples in the results table.
    const [query_results, setQueryResults] = useState(null);
    // The underlying cleaner.
    const cleaner = useRef(null)
    // The input probabilities.
    const [input_probs, setInputProbs] = useState(new Map());
    // Has the cleaning finished.
    const [cleaning_state, setCleaningState] = useState(false);
    // The variable that is currently cleaned.
    const [currently_cleaned_var, setCurrentlyCleanedVar] = useState(null);
    // The output tuple to show details for.
    const [output_tuple_for_details, setOutputTupleForDetails] = useState(null);
    // The input tuple to improve.
    const [input_tuple_to_improve, setInputTupleToImprove] = useState(null);
    // An array of the correct output tuples.
    const [correct_tuples, setCorrectTuples] = useState([]);
    // An array of the incorrect output tuples.
    const [incorrect_tuples, setIncorrectTuples] = useState([]);
    // An array of the previous correct output tuples.
    const [previous_correct_tuples, setPreviousCorrectTuples] = useState([]);
    // An array of the previous incorrect output tuples.
    const [previous_incorrect_tuples, setPreviousIncorrectTuples] = useState([]);
    // The assignment.
    const [assignment, setAssignment] = useState(null);
    // Whether the presented input tuple is classified or not.
    const [is_input_tuple_classified, setIsInputTupleClassified] = useState(false);
    // The currently cleaned tuple.
    const [currently_cleaned_tuple, setCurrentlyCleanedTuple] = useState(null);
    // The output tuples whose MES values are improved by the (currently running) algorithm.
    const [mes_reaching_output_tuples, setMesReachingOutputTuples] = useState(null);
    // The desired MES value.
    const [mes_reaching_desired_score, setMesReachingDesiredScore] = useState(0);
    // The maximal cost.
    const [mes_reaching_remaining_cost, setMesReachingRemainingCost] = useState(Number.POSITIVE_INFINITY);
    // The variables to improve.
    const [mes_reaching_variables_to_improve, setMesReachingVariablesToImprove] = useState([]);
    // Is the MES reaching algorithm running.
    const [is_mes_reaching_algorithm_running, setIsMesReachingAlgorithmRunning] = useState(false);
    // Is the new MES value being fetched right now.
    const [mes_reaching_is_fetching_score, setMesReachingIsFetchingScore] = useState(false);
    // The total number of classifications.
    const [classifications_count, setClassificationsCount] = useState(0);
    // Whether the current cleaning step has been requested by the underlying
    const [is_underlying_system, setIsUnderlyingSystem] = useState(true);
    // The list of selected output tuples.
    const [selected_output_tuples, setSelectedOutputTuples] = useState([]);

    /**
     * @brief A callback that is called when the user clicks on an output tuple.
     *
     * @param  output_tuple  The output tuple the user clicked on
     */
    function on_click_output_tuple(output_tuple) {
        if (output_tuple_details_modal == null) {
            output_tuple_details_modal = new bootstrap.Modal(document.getElementById(
                OUTPUT_TUPLE_DETAILS_ID));
        }

        setOutputTupleForDetails(output_tuple);
        output_tuple_details_modal.show();
    }

    /**
     * @brief A callback that is called when the user clicks on an input tuple (related to an
     *        output tuple).
     *
     * @param  input_tuple  The input tuple the user clicked on
     */
    function on_click_input_tuple(input_tuple) {
        if (improve_input_tuple_prob_modal == null) {
            improve_input_tuple_prob_modal = new bootstrap.Modal(document.getElementById(
                IMPROVE_INPUT_TUPLE_PROB_ID));
        }

        setInputTupleToImprove(input_tuple);
        setIsInputTupleClassified(assignment.has(input_tuple.variable));

        output_tuple_details_modal.hide();
        improve_input_tuple_prob_modal.show();
    }

    function on_cleaning_finish() {
        setPreviousCorrectTuples(correct_tuples);
        setPreviousIncorrectTuples(incorrect_tuples);
        setCorrectTuples(cleaner.current.get_correct_tuples());
        setIncorrectTuples(cleaner.current.get_incorrect_tuples());
        setAssignment(cleaner.current.get_vars_truth_values());
        setCleaningState(true);
        setIsMesReachingAlgorithmRunning(false);
        setIsUnderlyingSystem(true);
    }

    function update_next_cleaning_step() {
        if (!is_mes_reaching_algorithm_running) {
            if (cleaner.current.has_cleaning_finished()) {
                on_cleaning_finish();
            } else {
                const next_var = cleaner.current.get_next_var_to_clean();
                setCurrentlyCleanedVar(next_var);
                setCurrentlyCleanedTuple(var_to_tuple(next_var, db_name)[1]);
                setIsUnderlyingSystem(true);
            }

            return;
        }

        // The MES reaching algorithm is running.
        if (mes_reaching_variables_to_improve.length > 0) {
            // We don't need to update the remaining cost since it has been updated when calculating
            // the set of variables to improve.
            setCurrentlyCleanedVar(mes_reaching_variables_to_improve[0]);
            setCurrentlyCleanedTuple(var_to_tuple(mes_reaching_variables_to_improve[0], db_name)[1]);
            setMesReachingVariablesToImprove(mes_reaching_variables_to_improve.slice(1));
            return;
        }

        // We've improved a set of variables, so we should check that the truth values can be
        // determined, and calculate the new MES value.
        if (!cleaner.current.has_cleaning_finished()) {
            // The truth values can't be determined, so run the underlying cleaner.
            const next_var = cleaner.current.get_next_var_to_clean();
            setCurrentlyCleanedVar(next_var);
            setCurrentlyCleanedTuple(var_to_tuple(next_var, db_name)[1]);
            setIsUnderlyingSystem(true);
            // For simplicity, we don't limit the cost of the underlying cleaner.
            setMesReachingRemainingCost(mes_reaching_remaining_cost - 1);
            console.log(`Updating the remaining cost from ${mes_reaching_remaining_cost} to ${mes_reaching_remaining_cost - 1}`)
            return;
        }

        // The truth values can be determined. Check the MES value and determine if more iterations
        // should be run.
        setMesReachingIsFetchingScore(true);
        Promise.all(mes_reaching_output_tuples.map(t =>
            fetch_mes_score(t, cleaner.current.get_vars_truth_values(), input_probs))).then(
            (new_scores) => {
                console.log("New scores:")
                console.log(new_scores)

                setMesReachingIsFetchingScore(false);
                if (Math.max(...new_scores) <= mes_reaching_desired_score) {
                    on_cleaning_finish();
                    return;
                }

                console.log(`Max MES (${Math.max(...new_scores)}) > mes_reaching_desired_score(${mes_reaching_desired_score})`)

                // The desired score hasn't been reached, so a new iteration is required.
                const filtered = mes_reaching_output_tuples.filter((t, i) => new_scores[i] > mes_reaching_desired_score)
                console.log("Filtered:")
                console.log(filtered)
                const filtered_new_scores = new_scores.filter(s => s > mes_reaching_desired_score)

                const variables_to_improve = mes_reaching_algorithm_step(
                    filtered, filtered_new_scores, cleaner.current.get_vars_truth_values(),
                    input_probs, mes_reaching_desired_score);
                console.log("variables_to_improve:")
                console.log(variables_to_improve)
                if (mes_reaching_remaining_cost < variables_to_improve.length) {
                    console.log(`mes_reaching_remaining_cost < variables_to_improve.length: ${mes_reaching_remaining_cost} < ${variables_to_improve.length}`)
                    on_cleaning_finish();
                    return;
                }

                setMesReachingRemainingCost(mes_reaching_remaining_cost - variables_to_improve.length);
                console.log(`Updating the remaining cost from ${mes_reaching_remaining_cost} to ${mes_reaching_remaining_cost - variables_to_improve.length}`)
                setMesReachingVariablesToImprove(variables_to_improve.slice(1));
                setCurrentlyCleanedVar(variables_to_improve[0]);
                setCurrentlyCleanedTuple(var_to_tuple(variables_to_improve[0], db_name)[1]);
                setIsUnderlyingSystem(false);
            });
    }

    const search_params = useSearchParams();
    const user_query = search_params.get(QUERY_INPUT_ID);
    const db_name = search_params.get(DB_NAME_ID);
    const max_basic_prob = parseFloat(search_params.get(PROB_INPUT_ID));

    // Fetch the results.
    useEffect(() => {
        const data_fetch = async () => {
            const params = new URLSearchParams({
                "query": user_query,
                "db_name": db_name,
            });
            let api_res = await fetch(`${FLASK_APP_API_QUERY_RESULTS}?${params.toString()}`);
            if (!api_res.ok) {
                throw new Error('Failed to fetch query results');
            }
            const api_res_json = await api_res.json();

            cleaner.current = new DummyCleaner(api_res_json.tuples);
            if (db_name === 'nell') {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `${FLASK_APP_API_CLEANED_DB}`, false);
                xhr.send();
                if (xhr.status !== 200) {
                    throw new Error(`xhr.status ${xhr.status}`);
                }

                const returnedJson = JSON.parse(xhr.response);
                for (const l of returnedJson['labels']) {
                    cleaner.current.set_var_truth_value(l['variable'], l['label'], false)
                }
            }

            update_next_cleaning_step();

            setQueryResults(api_res_json.tuples);
            const vars = extract_vars_from_tuples(api_res_json.tuples);
            let local_input_probs = new Map();
            for (const variable of vars) {
                local_input_probs.set(variable, max_basic_prob);
            }

            setInputProbs(local_input_probs);
        }

        data_fetch();
    }, []);

    function on_classify(classification) {
        cleaner.current.set_var_truth_value(currently_cleaned_var, classification);
        console.log(`Setting ${currently_cleaned_var} to ${classification}`)
        setClassificationsCount(classifications_count + 1);

        if (is_mes_reaching_algorithm_running) {
            // Update the probability of the classified variable.
            let local_input_probs = new Map(input_probs);
            local_input_probs.set(currently_cleaned_var, mes_reaching_desired_score);
            setInputProbs(local_input_probs);
        }
        update_next_cleaning_step();
    }

    function update_input_prob(input_tuple, prob) {
        improve_input_tuple_prob_modal.hide();

        setCleaningState(false);
        setCurrentlyCleanedVar(input_tuple.variable);
        setCurrentlyCleanedTuple(var_to_tuple(input_tuple.variable, db_name)[1]);
        setInputTupleToImprove(null);
        setOutputTupleForDetails(null);
        setIsUnderlyingSystem(false);

        let local_input_probs = new Map(input_probs);
        local_input_probs.set(input_tuple.variable, prob);
        setInputProbs(local_input_probs);
    }

    function on_click_reach_mes_score() {
        if (reach_mes_score_modal == null) {
            reach_mes_score_modal = new bootstrap.Modal(document.getElementById(
                REACH_MES_SCORE_MODAL_ID));
        }

        reach_mes_score_modal.show();
    }

    function on_click_start_mes_algorithm(output_tuples, desired_mes_score, maximal_cost) {
        console.log("selected output tuples:")
        console.log(selected_output_tuples)

        if (isNaN(maximal_cost)) {
            maximal_cost = Number.POSITIVE_INFINITY;
        }
        const filtered = output_tuples.filter(t => t.mes_score > desired_mes_score)
        console.log("Filtered:")
        console.log(filtered)
        const variables_to_improve = mes_reaching_algorithm_step(
            filtered,
            filtered.map(t => t.mes_score),
            assignment,
            input_probs,
            desired_mes_score);
        console.log("variables_to_improve:")
        console.log(variables_to_improve)

        if (maximal_cost < variables_to_improve.length) {
            console.log(`maximal_cost < variables_to_improve.length: ${maximal_cost} < ${variables_to_improve.length}`)
            reach_mes_score_modal.hide();
            return;
        }

        setMesReachingVariablesToImprove(variables_to_improve.slice(1));
        setMesReachingOutputTuples(selected_output_tuples);
        setMesReachingDesiredScore(desired_mes_score);
        setMesReachingRemainingCost(maximal_cost - variables_to_improve.length);
        console.log(`Updating the remaining cost to ${maximal_cost - variables_to_improve.length}`)
        setCleaningState(false);
        setIsMesReachingAlgorithmRunning(true);
        setCurrentlyCleanedVar(variables_to_improve[0]);
        setCurrentlyCleanedTuple(var_to_tuple(variables_to_improve[0], db_name)[1]);
        setInputTupleToImprove(null);
        setOutputTupleForDetails(null);
        setIsUnderlyingSystem(false);
        setSelectedOutputTuples([])

        reach_mes_score_modal.hide();
    }

    function add_output_tuple(tuple) {
        setSelectedOutputTuples([
            ...selected_output_tuples,
            tuple
        ]);
    }

    function remove_output_tuple(tuple) {
        setSelectedOutputTuples(selected_output_tuples.filter(t => t.id !== tuple.id));
    }

    const is_loading = query_results == null ||
        (!cleaning_state && currently_cleaned_tuple == null) ||
        mes_reaching_is_fetching_score;

    return (
        <>
            <InputSummary userQuery={user_query}/>
            {is_loading ?
                // If the data is not ready yet, display a spinner.
                LOADING_SPINNER :
                <main className="w-75">
                    {!cleaning_state ?
                        <ExpertInput
                            inputTuple={currently_cleaned_tuple.values}
                            realCorrectness={currently_cleaned_tuple.real_correctness}
                            onClassify={on_classify}
                            isUnderlyingSystem={is_underlying_system}
                        /> :
                        <>
                            <ResultsTable correctResults={correct_tuples}
                                          incorrectResults={incorrect_tuples}
                                          previousCorrectResults={previous_correct_tuples}
                                          previousIncorrectResults={previous_incorrect_tuples}
                                          classificationsCount={classifications_count}
                                          assignment={assignment}
                                          inputProbs={input_probs}
                                          onClickOutputTuple={on_click_output_tuple}
                                          onClickReachMesScore={on_click_reach_mes_score}
                                          addOutputTuple={add_output_tuple}
                                          removeOutputTuple={remove_output_tuple}/>
                        </>
                    }
                </main>
            }
            <OutputTupleDetails dbName={db_name}
                                outputTuple={output_tuple_for_details}
                                assignment={assignment}
                                inputProbs={input_probs}
                                onClickInputTuple={on_click_input_tuple}/>
            <ImproveInputTupleProb inputTuple={input_tuple_to_improve}
                                   inputProbs={input_probs}
                                   isClassified={is_input_tuple_classified}
                                   updateProb={(prob) => {
                                       update_input_prob(input_tuple_to_improve,
                                           prob)
                                   }}/>
            <ReachMesScoreModal
                outputTuples={selected_output_tuples}
                onClickStartMesAlgorithm={on_click_start_mes_algorithm}/>
            <div className="btn-group ms-3">
                <button type="button" className="btn btn-dark" onClick={() => {
                    window.location.assign("//" + window.location.host);
                }}>Reset
                </button>
            </div>
        </>
    );
}
