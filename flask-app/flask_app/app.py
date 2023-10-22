import flask
import flask_cors
import sympy
import utils
from oracle_mistakes import misclass_prob, risky_var

app = flask.Flask(__name__)
cors = flask_cors.CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/calc_max_misclass_prob')
@flask_cors.cross_origin()
def calc_max_misclass_prob():
    # Get the parameters of the request.
    formula_param = flask.request.args.get('formula')
    assignment_param = flask.request.args.get('assignment')
    probs_param = flask.request.args.get('probs')

    # Convert the parameters to objects.
    formula = utils.parse_formula_param(formula_param)
    assignment = utils.json_to_symbols_dict(assignment_param)
    probs = utils.parse_probs_param(probs_param)

    max_prob = misclass_prob.calc_max_misclass_prob(formula, assignment, probs)

    return flask.jsonify({'max_prob': max_prob})


@app.route('/is_var_risky_for_precision')
@flask_cors.cross_origin()
def is_var_risky_for_precision():
    # Get the parameters of the request.
    formula_param = flask.request.args.get('formula')
    assignment_param = flask.request.args.get('assignment')
    probs_param = flask.request.args.get('probs')
    variable_param = flask.request.args.get('variable')

    # Convert the parameters to objects.
    formula = utils.parse_formula_param(formula_param)
    assignment = utils.json_to_symbols_dict(assignment_param)
    probs = utils.parse_probs_param(probs_param)
    variable = sympy.Symbol(variable_param)

    is_risky = risky_var.is_var_risky_for_precision(formula, assignment, probs, variable)

    return flask.jsonify({'is_risky': is_risky})
