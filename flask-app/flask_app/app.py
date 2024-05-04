import flask
import flask_cors
import pandas as pd
import waitress
from oracle_mistakes import mes, risky_var
from psycopg import sql

import sql_utils
import utils

app = flask.Flask(__name__)
cors = flask_cors.CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

cleaned_pandas_db = pd.read_csv('./cleaned.csv', header=None)


@app.route('/calc_mes')
@flask_cors.cross_origin()
def calc_mes():
    # Get the parameters of the request.
    formula_param = flask.request.args.get('formula')
    assignment_param = flask.request.args.get('assignment')
    probs_param = flask.request.args.get('probs')

    # Convert the parameters to objects.
    formula = utils.parse_formula_param(formula_param)
    assignment = utils.parse_assignment_param(assignment_param)
    probs = utils.parse_probs_param(probs_param)

    return flask.jsonify({'mes': mes.calc_mes(formula, assignment, probs)})


@app.route('/is_risky')
@flask_cors.cross_origin()
def is_risky():
    # Get the parameters of the request.
    formula_param = flask.request.args.get('formula')
    assignment_param = flask.request.args.get('assignment')
    probs_param = flask.request.args.get('probs')
    variable = flask.request.args.get('variable')

    # Convert the parameters to objects.
    formula = utils.parse_formula_param(formula_param)
    assignment = utils.parse_assignment_param(assignment_param)
    probs = utils.parse_probs_param(probs_param)

    return flask.jsonify(
        {'is_risky': risky_var.is_var_risky_for_precision(formula, assignment, probs, variable)})


@app.route('/query')
@flask_cors.cross_origin()
def query():
    user_query = flask.request.args.get('query')
    db_name = flask.request.args.get('db_name')
    provenance_parser = sql_utils.dnf_parser()

    output_tuples = []
    with sql_utils.connect_db(db_name) as db_conn:
        for i, (output_tuple, provenance) in enumerate(
                sql_utils.get_output_with_provenance(db_conn, provenance_parser,
                                                     sql.SQL(user_query))):
            output_tuples.append({
                'values': output_tuple,
                'provenance': provenance.terms(),
                'id': i
            })

    return flask.jsonify({'tuples': output_tuples})


@app.route('/var_to_tuple')
@flask_cors.cross_origin()
def var_to_tuple():
    variable = flask.request.args.get('var')
    db_name = flask.request.args.get('db_name')
    if db_name == 'nell':
        table_names = ['beliefs']
    else:
        table_names = ['roles', 'education', 'acquisitions']

    with sql_utils.connect_db(db_name) as db_conn:
        with db_conn.cursor() as db_cursor:
            for table in table_names:
                db_cursor.execute(
                    sql.SQL("SELECT * FROM {0} WHERE var={1} LIMIT 1").format(sql.Identifier(table),
                                                                              variable))
                results = db_cursor.fetchall()
                if len(results) == 0:
                    continue

                colnames = [desc[0] for desc in db_cursor.description]
                ret_tuple = {
                    'values': {},
                    'variable': variable,
                }
                for i, col in enumerate(colnames):
                    if col not in ['id', 'var', 'provsql']:
                        ret_tuple['values'][col] = results[0][i]

                return flask.jsonify({'table': table, 'tuple': ret_tuple})


@app.route('/cleaned_db')
@flask_cors.cross_origin()
def cleaned_db():
    ret = []

    with sql_utils.connect_db('nell') as db_conn:
        for index, row in cleaned_pandas_db.iterrows():
            entity = row.iloc[0]
            relation = row.iloc[1]
            value = row.iloc[2]
            label = row.iloc[3]

            with db_conn.cursor() as db_cursor:
                db_cursor.execute(
                    sql.SQL(
                        "SELECT var FROM beliefs WHERE entity={0} AND relation={1} AND value={2} LIMIT 1")
                    .format(entity, relation, value))
                results = db_cursor.fetchall()
                if (len(results) == 0):
                    print(f'WARNING: no row found for ({entity}, {relation}, {value})')
                    continue

                ret.append({'variable': results[0][0], 'label': label==1})

    return flask.jsonify({'labels': ret})


def main():
    waitress.serve(app, host='0.0.0.0', port=5000)


if __name__ == "__main__":
    main()
