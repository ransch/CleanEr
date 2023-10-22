"use client";

import styles from '/style/dashboard/input_summary.module.css';
import {ubuntu_mono} from '/app/{utils}/fonts';

/**
 * @brief A component that summarizes the user input.
 *
 * @param  userQuery  The user's query
 */
export function InputSummary({userQuery}) {
    return (
        <section className={`w-75 mb-4 ${styles.user_query}`}>
            <h2 className="fs-4">Your query</h2>
            <pre className={ubuntu_mono.className}>{userQuery}</pre>
        </section>
    );
}
