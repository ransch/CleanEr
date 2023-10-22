import {
    RESULTS_TABLE,
    RESULTS_TABLE_COLUMNS,
    TABLE_ACQUISITIONS, TABLE_EDUCATION,
    TABLE_ROLES
} from "/app/api/database/database";
import {NextResponse} from 'next/server';

export async function GET(request) {
    return NextResponse.json({
        acquisitions: TABLE_ACQUISITIONS,
        roles: TABLE_ROLES,
        education: TABLE_EDUCATION,
    });
}
