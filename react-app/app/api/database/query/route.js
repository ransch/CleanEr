import {RESULTS_TABLE, RESULTS_TABLE_COLUMNS} from "/app/api/database/database";
import {NextResponse} from 'next/server';

export async function GET(request) {
    return NextResponse.json({
        tuples: RESULTS_TABLE,
    });
}
