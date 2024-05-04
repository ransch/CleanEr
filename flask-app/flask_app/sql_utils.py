import contextlib
import re
from collections.abc import Generator

import psycopg
from oracle_mistakes.dnf_formula import DnfFormula
from psycopg import sql
from psycopg_pool import ConnectionPool
from pyparsing import Word, alphanums, ParserElement, Literal, StringStart, StringEnd, \
    Group, alphas, OneOrMore

# PostgreSQL port.
_POSTGRES_PORT = 5433

# PostgreSQL username.
_POSTGRES_USER_NAME = 'postgres'

# PostgreSQL password.
_POSTGRES_PASSWORD = 'password'

_POSTGRES_POOLS = {
    db_name: ConnectionPool(f'host=localhost '
                            f'port={_POSTGRES_PORT} '
                            f'user={_POSTGRES_USER_NAME} '
                            f'password={_POSTGRES_PASSWORD} '
                            f'require_auth=scram-sha-256 '
                            f'dbname={db_name}')
    for db_name in ['nell', 'synthetic_db']
}


def set_search_path(db_conn: psycopg.connection.Connection) -> None:
    with db_conn.cursor() as db_cursor:
        db_cursor.execute(sql.SQL('SET search_path TO public,provsql'))


def dnf_parser() -> ParserElement:
    variable = Word(alphas + '_', alphanums + '_')
    lpar = Literal('(').suppress()
    rpar = Literal(')').suppress()
    and_op = Literal('&').suppress()
    or_op = Literal('|').suppress()

    term = variable ^ (variable + OneOrMore(and_op + variable))
    term_par = Group(lpar + term + rpar)

    formula = term_par ^ (term_par + OneOrMore(or_op + term_par))
    formula_par = lpar + formula + rpar

    return StringStart() + (formula_par | term_par) + StringEnd()


def parse_provenance(provenance_parser: ParserElement, unparsed_provenance: str) -> DnfFormula:
    assert re.compile(r'^[&|\w\s\(\)]+$').match(unparsed_provenance)
    parsed_results = provenance_parser.parseString(unparsed_provenance)
    return DnfFormula(parsed_results.as_list())


def get_output_with_provenance(db_conn: psycopg.connection.Connection,
                               provenance_parser: ParserElement,
                               query: sql.SQL) -> Generator[tuple[dict, DnfFormula], None, None]:
    provenance_query = sql.SQL(
        "SELECT *,formula(provsql.provenance(), 'mapping') FROM ({0})").format(query)
    with db_conn.cursor() as db_cursor:
        db_cursor.execute(provenance_query)
        results = db_cursor.fetchall()
        colnames = [desc[0] for desc in db_cursor.description]
        assert colnames[-2] == 'formula'
        assert colnames[-1] == 'provsql'

        for row_index, row in enumerate(results):
            ret = {}
            for i, col in enumerate(colnames[:-2]):
                ret[col] = row[i]
            provenance = parse_provenance(provenance_parser, row[-2])
            yield ret, provenance

@contextlib.contextmanager
def connect_db(db_name: str) \
        -> Generator[psycopg.connection.Connection, None, None]:
    with _POSTGRES_POOLS[db_name].connection() as db_conn:
        set_search_path(db_conn)
        yield db_conn
