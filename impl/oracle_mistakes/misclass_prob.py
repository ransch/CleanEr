"""
This module contains algorithms that involve the probability that an assignment misclassifies a
formula.
"""
import typing
import math
from sympy.logic import boolalg
from sympy.core import symbol
from ortools.sat.python import cp_model
from oracle_mistakes import utils

# The maximal running time of an ILP solver in seconds.
MAX_ILP_RUNNING_TIME_SEC = 10.0


def _calc_assignment_prob(assignment: utils.Assignment, ground_truth: utils.Assignment,
                          probs: utils.VarProbabilities) -> float:
    """
    Calculate the probability of getting an assignment from a ground truth.

    Args:
        assignment: A partial or total assignment
        ground_truth: A ground truth assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The probability of getting the assignment from the ground truth.
    """
    assignment_vars = set(assignment.keys())
    if not assignment_vars.issubset(set(ground_truth.keys())):
        raise ValueError('Bad assignments')
    if not assignment_vars.issubset(set(probs.keys())):
        raise ValueError('Bad probabilities')

    ret = 1
    for variable in assignment_vars:
        prob = probs[variable]
        if assignment[variable] == ground_truth[variable]:
            ret *= 1 - prob
        else:
            ret *= prob

    return ret


def _satisfying_vars_assignment(variables: typing.Iterable[symbol.Symbol],
                                assignment: utils.Assignment) -> utils.Assignment:
    """
    Return a copy of an assignment that satisfies the given variables.

    Args:
        variables: An iterable of symbols
        assignment: A partial or total assignment

    Returns:
        A copy of the given assignment that satisfies the given variables.
    """
    ret = assignment.copy()
    for var in variables:
        ret[var] = True

    return ret


def _sat_assignment_build_ilp_model(formula: boolalg.Boolean,
                                    k: int,
                                    assignment: utils.Assignment,
                                    probs: utils.VarProbabilities) -> \
        typing.Tuple[cp_model.CpModel, typing.Dict[symbol.Symbol, cp_model.IntVar]]:
    """
    Build an ILP model for a satisfying assignment.

    Args:
        formula: A k-DNF formula
        k: The parameter of the formula
        assignment: A satisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        An ILP model for the given input.
    """
    # Create a CP-SAT model.
    model = cp_model.CpModel()

    # Create the model's variables.
    model_vars = {}
    for var in formula.atoms():
        model_vars[var] = model.NewBoolVar(var.name)

    # Add a constraint for every term.
    terms = utils.get_terms(formula)
    for term in terms:
        term_vars = term.atoms()
        vars_sum = sum(model_vars[var] for var in term_vars)
        model.Add(vars_sum <= k - 1)

    # Set variables with zero probability or not in the assignment's domain.
    assignment_vars = set(assignment.keys())
    for var in formula.atoms():
        if probs[var] == 0:
            if var not in assignment_vars:
                model.Add(model_vars[var] == 0)
            elif assignment[var]:
                model.Add(model_vars[var] == 1)
            else:
                model.Add(model_vars[var] == 0)

    # Set the objective of the model.
    vars_arr = list(model_vars.values())
    coeffs_arr = []
    for var in model_vars.keys():
        prob = probs[var]
        if prob == 0 or var not in assignment_vars:
            coeff = 0
        elif assignment[var]:
            coeff = math.log(1 - prob) - math.log(prob)
        else:
            coeff = math.log(prob) - math.log(1 - prob)
        coeffs_arr.append(coeff)
    model.Maximize(cp_model.LinearExpr.WeightedSum(vars_arr, coeffs_arr))

    return model, model_vars


def _does_probable_unsatisfying_exist(formula: boolalg.Boolean,
                                      assignment: utils.Assignment,
                                      probs: utils.VarProbabilities) -> bool:
    """
    Check if there exists a total unsatisfying assignment with positive probability.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total satisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        True iff there exists an unsatisfying assignment with positive probability.
    """
    tested_assignment = {}

    assignment_vars = set(assignment.keys())
    for var in formula.atoms():
        if var in assignment_vars and probs[var] == 0:
            tested_assignment[var] = assignment[var]
        else:
            tested_assignment[var] = False

    is_sat = formula.subs(tested_assignment)
    assert isinstance(is_sat, boolalg.BooleanAtom)
    if is_sat:
        return False

    prob = _calc_assignment_prob(assignment, tested_assignment, probs)
    return prob > 0


def _calc_max_misclass_prob_sat(formula: boolalg.Boolean,
                                k: int,
                                assignment: utils.Assignment,
                                probs: utils.VarProbabilities) -> float:
    """
    Calculate the maximal probability that a satisfying assignment misclassifies a formula.

    Args:
        formula: A k-DNF formula
        k: The parameter of the formula
        assignment: A partial or total satisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The maximal probability that the assignment misclassifies the formula.
    """
    # Check if there exists an unsatisfying assignment with positive probability.
    if not _does_probable_unsatisfying_exist(formula, assignment, probs):
        return 0

    # Build an ILP model for the input.
    model, model_vars = _sat_assignment_build_ilp_model(formula, k, assignment, probs)

    # Solve the ILP problem.
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = MAX_ILP_RUNNING_TIME_SEC
    status = solver.Solve(model)

    if status != cp_model.OPTIMAL:
        raise Exception("Couldn't solve the ILP problem")

    objective_value = solver.ObjectiveValue()
    assignment_vars = set(assignment.keys())
    s = 0
    for var in formula.atoms():
        prob = probs[var]
        if prob == 0 or var not in assignment_vars:
            continue
        elif assignment[var]:
            s += math.log(prob)
        else:
            s += math.log(1 - prob)

    return math.exp(objective_value + s)


def _calc_max_misclass_prob_non_sat(formula: boolalg.Boolean,
                                    assignment: utils.Assignment,
                                    probs: utils.VarProbabilities) -> float:
    """
    Calculate the maximal probability that an unsatisfying assignment misclassifies a formula.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total unsatisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The maximal probability that the assignment misclassifies the formula.
    """
    max_prob = 0
    terms = utils.get_terms(formula)
    for term in terms:
        new_assignment = _satisfying_vars_assignment(term.atoms(), assignment)
        current_prob = _calc_assignment_prob(assignment, new_assignment, probs)

        # Update the maximal probability.
        if current_prob > max_prob:
            max_prob = current_prob

    return max_prob


def calc_max_misclass_prob(formula: boolalg.Boolean,
                           assignment: utils.Assignment,
                           probs: utils.VarProbabilities) -> float:
    """
    Calculate the maximal probability that an assignment misclassifies a formula.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The maximal probability that the assignment misclassifies the formula.
    """
    k = utils.validate_probabilistic_input(formula, assignment, probs, partial_assignment=True)

    is_sat = formula.subs(assignment)
    assert isinstance(is_sat, boolalg.BooleanAtom)

    if is_sat:
        return _calc_max_misclass_prob_sat(formula, k, assignment, probs)
    return _calc_max_misclass_prob_non_sat(formula, assignment, probs)
