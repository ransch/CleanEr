"use client";

import styles from '/style/user_input.module.css';
import {ubuntu_mono} from '/app/{utils}/fonts';
import {useRouter} from 'next/navigation';
import {PROBS_STEP, DEFAULT_MAX_PROB, MIN_MAX_PROB, MAX_MAX_PROB} from "/app/{utils}/utils";

/**
 * @brief The ID of the input in which the user enters an SPJU query.
 */
export const QUERY_INPUT_ID = "query-input";

/**
 * @brief The ID of the input in which the user enters a basic probability.
 */
export const PROB_INPUT_ID = "prob-input";

/**
 * @brief A default suggested SPJU query.
 */
const DEFAULT_QUERY = `SELECT DISTINCT a.Acquired, e.Institute
FROM Acquisitions AS a, Roles AS r, Education AS e
WHERE a.Acquired = r.Organization AND
      r.Member = e.Alumni AND
      a.Date >= 2017.01.01 AND
      r.Role LIKE '%found%' AND
      e.YEAR <= year(a.Date)`;

/**
 * @brief A component for getting a query from the user.
 */
export function UserInput() {
    const router = useRouter();

    function handleSubmit(e) {
        // Prevent the browser from reloading the page.
        e.preventDefault();

        // Read the form data.
        const form = e.target;
        const form_data = new FormData(form);
        const query_string = new URLSearchParams(form_data).toString();

        // Go to the dashboard.
        router.push(`/dashboard?${query_string}`)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <label
                    className="form-label m-0 p-0 col-sm-1 d-flex flex-column justify-content-center
                    text-end"
                    htmlFor={QUERY_INPUT_ID}>SPJU Query</label>
                <div className="col-sm-11">
                    <textarea className={`form-control ${ubuntu_mono.className}`}
                              id={QUERY_INPUT_ID} name={QUERY_INPUT_ID} defaultValue={DEFAULT_QUERY}
                              autoComplete="off" rows={DEFAULT_QUERY.split('\n').length} autoFocus>
                    </textarea>
                </div>
            </div>
            <input type="hidden" className="form-control" id={PROB_INPUT_ID}
                   name={PROB_INPUT_ID} defaultValue={DEFAULT_MAX_PROB} min={MIN_MAX_PROB}
                   max={MAX_MAX_PROB} step={PROBS_STEP} autoComplete="off"/>
            <button type="submit"
                    className={`btn btn-primary mt-4 py-2 px-3 ${styles.submit_button}`}>
                Submit
            </button>
        </form>
    );
}
