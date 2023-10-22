"use client";

import {InputSummary} from './input_summary';
import {ExpertInput} from './expert_input';
import {ResultsTable} from './results_table';
import {DummyCleaner} from "/src/dummy_cleaner";
import {
    fetch_mes_score,
    LOADING_SPINNER,
    NODE_APP_API_INPUT_TABLES,
    NODE_APP_API_QUERY_RESULTS
} from "/app/{utils}/utils";
import {
    extract_vars_from_tuples,
    var_to_tuple,
    mes_reaching_algorithm_step,
} from "/src/utils";
import {QUERY_INPUT_ID, PROB_INPUT_ID} from '/app/user_input';
import {OUTPUT_TUPLE_DETAILS_ID, OutputTupleDetails} from "./output_tuple_details";
import {IMPROVE_INPUT_TUPLE_PROB_ID, ImproveInputTupleProb} from "./improve_input_tuple_prob";
import {REACH_MES_SCORE_MODAL_ID, ReachMesScoreModal} from "./reach_mes_score_modal";
import {useSearchParams} from 'next/navigation';
import {useState, useEffect, useRef} from 'react'

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
    // The input tables.
    const [input_tables, setInputTables] = useState(null);
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
    // The output tuple whose MES value is improved by the (currently running) algorithm.
    const [mes_reaching_output_tuple, setMesReachingOutputTuple] = useState(null);
    // The desired MES value.
    const [mes_reaching_desired_score, setMesReachingDesiredScore] = useState(0);
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

    // Fetch the input tables.
    useEffect(() => {
        const data_fetch = async () => {
            let api_res = await fetch(NODE_APP_API_INPUT_TABLES);
            if (!api_res.ok) {
                throw new Error('Failed to fetch input tables');
            }
            const api_res_json = await api_res.json();

            setInputTables(api_res_json);
        }

        data_fetch();
    }, [/*no dependencies*/]);

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
                setCurrentlyCleanedTuple(var_to_tuple(next_var, input_tables)[1]);
                setIsUnderlyingSystem(true);
            }

            return;
        }

        // The MES reaching algorithm is running.
        if (mes_reaching_variables_to_improve.length > 0) {
            setCurrentlyCleanedVar(mes_reaching_variables_to_improve[0]);
            setCurrentlyCleanedTuple(var_to_tuple(mes_reaching_variables_to_improve[0],
                input_tables)[1]);
            setMesReachingVariablesToImprove(mes_reaching_variables_to_improve.slice(1));
            return;
        }

        // We've improved a set of variables, so we should check that the truth values can be
        // determined, and calculate the new MES value.
        if (!cleaner.current.has_cleaning_finished()) {
            // The truth values can't be determined, so run the underlying cleaner.
            const next_var = cleaner.current.get_next_var_to_clean();
            setCurrentlyCleanedVar(next_var);
            setCurrentlyCleanedTuple(var_to_tuple(next_var, input_tables)[1]);
            setIsUnderlyingSystem(true);
            return;
        }

        // The truth values can be determined. Check the MES value and determine if more iterations
        // should be run.
        setMesReachingIsFetchingScore(true);
        fetch_mes_score(mes_reaching_output_tuple,
            cleaner.current.get_vars_truth_values(), input_probs).then((new_score) => {
            setMesReachingIsFetchingScore(false);
            if (new_score <= mes_reaching_desired_score) {
                on_cleaning_finish();
                return;
            }

            // The desired score hasn't been reached, so a new iteration is required.
            const variables_to_improve = mes_reaching_algorithm_step(mes_reaching_output_tuple,
                mes_reaching_desired_score, cleaner.current.get_vars_truth_values());
            setMesReachingVariablesToImprove(variables_to_improve.slice(1));
            setCurrentlyCleanedVar(variables_to_improve[0]);
            setCurrentlyCleanedTuple(var_to_tuple(variables_to_improve[0], input_tables)[1]);
            setIsUnderlyingSystem(false);
        });
    }

    // Fetch the results.
    useEffect(() => {
        if (input_tables == null) {
            return;
        }

        const data_fetch = async () => {
            let api_res = await fetch(NODE_APP_API_QUERY_RESULTS);
            if (!api_res.ok) {
                throw new Error('Failed to fetch query results');
            }
            const api_res_json = await api_res.json();

            cleaner.current = new DummyCleaner(api_res_json.tuples);
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
    }, [input_tables]);

    function on_classify(classification) {
        cleaner.current.set_var_truth_value(currently_cleaned_var, classification);
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
        setCurrentlyCleanedTuple(var_to_tuple(input_tuple.variable, input_tables)[1]);
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

        output_tuple_details_modal.hide();
        reach_mes_score_modal.show();
    }

    function on_click_start_mes_algorithm(desired_mes_score) {
        const variables_to_improve = mes_reaching_algorithm_step(output_tuple_for_details,
            desired_mes_score, assignment);
        setMesReachingVariablesToImprove(variables_to_improve.slice(1));
        setMesReachingOutputTuple(output_tuple_for_details);
        setMesReachingDesiredScore(desired_mes_score);
        setCleaningState(false);
        setIsMesReachingAlgorithmRunning(true);
        setCurrentlyCleanedVar(variables_to_improve[0]);
        setCurrentlyCleanedTuple(var_to_tuple(variables_to_improve[0], input_tables)[1]);
        setInputTupleToImprove(null);
        setOutputTupleForDetails(null);
        setIsUnderlyingSystem(false);

        reach_mes_score_modal.hide();
    }

    const search_params = useSearchParams();
    const user_query = search_params.get(QUERY_INPUT_ID);
    const max_basic_prob = parseFloat(search_params.get(PROB_INPUT_ID));

    return (
        <>
            <InputSummary userQuery={user_query}/>
            {(input_tables == null || query_results == null ||
                (!cleaning_state && currently_cleaned_tuple == null) ||
                mes_reaching_is_fetching_score) ?
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
                                          onClickOutputTuple={on_click_output_tuple}/>
                        </>
                    }
                </main>
            }
            <OutputTupleDetails outputTuple={output_tuple_for_details}
                                inputTables={input_tables}
                                assignment={assignment}
                                inputProbs={input_probs}
                                onClickInputTuple={on_click_input_tuple}
                                onClickReachMesScore={on_click_reach_mes_score}/>
            <ImproveInputTupleProb inputTuple={input_tuple_to_improve}
                                   inputProbs={input_probs}
                                   isClassified={is_input_tuple_classified}
                                   updateProb={(prob) => {
                                       update_input_prob(input_tuple_to_improve,
                                           prob)
                                   }}/>
            <ReachMesScoreModal
                outputTuple={output_tuple_for_details}
                currentScore={output_tuple_for_details != null ?
                    output_tuple_for_details.mes_score : 0}
                onClickStartMesAlgorithm={on_click_start_mes_algorithm}/>
        </>
    );
}
