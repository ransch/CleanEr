"use client";

import styles from '/style/user_input.module.css';
import {ubuntu_mono} from '/app/{utils}/fonts';
import {useRouter} from 'next/navigation';
import {DEFAULT_MAX_PROB, MAX_MAX_PROB, MIN_MAX_PROB, PROBS_STEP} from "/app/{utils}/utils";
import {useState} from 'react'

/**
 * @brief The ID of the input in which the user enters an SPJU query.
 */
export const QUERY_INPUT_ID = "query-input";

export const DB_NAME_ID = "db-name";
export const QUERY_NAME_ID = "query-name";

/**
 * @brief The ID of the input in which the user enters a basic probability.
 */
export const PROB_INPUT_ID = "prob-input";

const QUERIES = {
    'nell': {
        'Sectors of acquired companies':
            `SELECT DISTINCT a.value AS a_sector, b.value AS b_sector
FROM beliefs AS a, beliefs AS b, beliefs AS c, beliefs AS d
WHERE a.relation = 'companyeconomicsector'
  AND b.relation = 'companyeconomicsector'
  AND a.entity = c.entity
  AND b.entity = c.value
  AND c.relation = 'acquired'
  AND d.entity = a.value
  AND d.relation = 'generalizations'
  AND (d.value ILIKE '%sector%' OR d.value ILIKE '%field%')
LIMIT 10`,
        'Athletes & sports':
        `SELECT DISTINCT a.entity AS athlete, b.value AS sport
FROM beliefs AS a, beliefs AS b
WHERE a.relation = 'athleteplaysforteam'
  AND b.relation = 'teamplayssport'
  AND a.value = b.entity
LIMIT 10`
    },
    'synthetic_db': {
        "Acquired companies & founders' institutes":
            `SELECT DISTINCT a.acquired, e.institute
FROM acquisitions AS a, roles AS r, education AS e
WHERE a.acquired = r.organization AND
      r.member = e.alumni AND
      r.role ILIKE '%found%' AND
      a.date >= '2017.01.01'::date AND
      e.year <= DATE_PART('YEAR', a.date)`,
        "Shared alumni institutes in acquisition companies":
            `SELECT DISTINCT e1.institute from acquisitions AS a,
       roles AS r1, roles AS r2, education AS e1, education AS e2
WHERE a.acquired = r1.organization AND
      a.acquiring = r2.organization AND
      r1.member=e1.alumni AND
      r2.member=e2.alumni AND
      e1.institute=e2.institute`
    }
}

/**
 * @brief A component for getting a query from the user.
 */
export function UserInput() {
    const router = useRouter();
    const [selectedDatabase, setSelectedDatabase] = useState('nell');
    const textarea_rows_num = 12;

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
                    htmlFor={DB_NAME_ID}>Database</label>
                <div className="col-sm-11">
                    <select id={DB_NAME_ID} name={DB_NAME_ID} value={selectedDatabase}
                            onChange={e => {
                                setSelectedDatabase(e.target.value);
                                document.getElementById(QUERY_INPUT_ID).value = QUERIES[e.target.value][Object.keys(QUERIES[e.target.value])[0]];
                            }}>
                        <option value="nell">NELL</option>
                        <option value="synthetic_db">Synthetic DB</option>
                    </select>
                </div>
            </div>
            <div className="row">
                <label
                    className="form-label m-0 p-0 col-sm-1 d-flex flex-column justify-content-center
                    text-end"
                    htmlFor={QUERY_NAME_ID}>Query</label>
                <div className="col-sm-11">
                    <select id={QUERY_NAME_ID} name={QUERY_NAME_ID}
                            onChange={e => {
                                document.getElementById(QUERY_INPUT_ID).value = QUERIES[selectedDatabase][e.target.value];
                            }}>
                        {Object.keys(QUERIES[selectedDatabase]).map(name =>
                            <option value={name} key={name}>{name}</option>
                        )}
                    </select>
                </div>
            </div>
            <div className="row mt-3">
                <label
                    className="form-label m-0 p-0 col-sm-1 d-flex flex-column justify-content-center
                    text-end"
                    htmlFor={QUERY_INPUT_ID}>SPJU Query</label>
                <div className="col-sm-11">
                    <textarea className={`form-control ${ubuntu_mono.className}`}
                              id={QUERY_INPUT_ID} name={QUERY_INPUT_ID}
                              defaultValue={QUERIES[selectedDatabase][Object.keys(QUERIES[selectedDatabase])[0]]}
                              autoComplete="off" rows={textarea_rows_num} autoFocus>
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
