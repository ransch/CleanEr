"""
This module contains algorithms that calculate the MES value.
"""
import math
import typing

from ortools.sat.python import cp_model

from oracle_mistakes import utils
from oracle_mistakes.dnf_formula import DnfFormula, Assignment

# The maximal running time of an ILP solver in seconds.
MAX_ILP_RUNNING_TIME_SEC = 120.0


def _calc_assignment_log_prob(assignment: Assignment, ground_truth: Assignment,
                              probs: utils.VarProbabilities) -> float:
    """
    Calculate the logarithm of the probability of getting an assignment from a ground truth.

    Args:
        assignment: A partial or total assignment
        ground_truth: A ground truth assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The logarithm of the probability of getting the assignment from the ground truth.
    """
    assignment_vars = set(assignment.keys())
    if not assignment_vars.issubset(set(ground_truth.keys())):
        raise ValueError('Bad assignments')
    if not assignment_vars.issubset(set(probs.keys())):
        raise ValueError('Bad probabilities')

    ret = 0
    for variable in assignment_vars:
        var_prob = probs[variable]

        if assignment[variable] == ground_truth[variable]:
            added_prob = 1 - var_prob
        else:
            added_prob = var_prob

        if added_prob == 0:
            return -math.inf

        ret += math.log(added_prob)

    return ret


def _satisfying_vars_assignment(variables: typing.Iterable[str],
                                assignment: Assignment) -> Assignment:
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


def _sat_assignment_build_ilp_model(formula: DnfFormula,
                                    assignment: Assignment,
                                    probs: utils.VarProbabilities) -> \
        typing.Tuple[cp_model.CpModel, typing.Dict[str, cp_model.IntVar]]:
    """
    Build an ILP model for a satisfying assignment.

    Args:
        formula: A k-DNF formula
        assignment: A satisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        An ILP model for the given input.
    """
    # Create a CP-SAT model.
    model = cp_model.CpModel()

    # Create the model's variables.
    formula_vars = formula.vars()
    model_vars = {}
    for var in formula_vars:
        model_vars[var] = model.NewBoolVar(var)

    # Add a constraint for every term.
    for term in formula.terms():
        vars_sum = sum(model_vars[var] for var in term)
        model.Add(vars_sum <= formula.k() - 1)

    # Set variables with zero probability or not in the assignment's domain.
    assignment_vars = set(assignment.keys())
    for var in formula_vars:
        if var in assignment_vars:
            if probs[var] == 0:
                if assignment[var]:
                    model.Add(model_vars[var] == 1)
                else:
                    model.Add(model_vars[var] == 0)
        else:
            model.Add(model_vars[var] == 0)

    # Set the objective of the model.
    vars_arr = list(model_vars.values())
    coeffs_arr = []
    for var in model_vars.keys():
        if var not in assignment_vars:
            coeff = 0
        else:
            prob = probs[var]
            if prob == 0:
                coeff = 0
            elif assignment[var]:
                coeff = math.log(1 - prob) - math.log(prob)
            else:
                coeff = math.log(prob) - math.log(1 - prob)
        coeffs_arr.append(coeff)
    model.Maximize(cp_model.LinearExpr.WeightedSum(vars_arr, coeffs_arr))

    return model, model_vars


def _does_probable_unsatisfying_exist(formula: DnfFormula,
                                      assignment: Assignment,
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
    for var in formula.vars():
        if var in assignment_vars and probs[var] == 0:
            tested_assignment[var] = assignment[var]
        else:
            tested_assignment[var] = False

    is_sat = formula.truth_value(tested_assignment)
    assert is_sat is not None
    if is_sat:
        return False

    prob = _calc_assignment_log_prob(assignment, tested_assignment, probs)
    return math.isfinite(prob)


def _calc_log_mes_sat(formula: DnfFormula,
                      assignment: Assignment,
                      probs: utils.VarProbabilities) -> float:
    """
    Calculate the logarithm of the maximal probability that a satisfying assignment misclassifies a
    formula.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total satisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The logarithm of the maximal probability that the assignment misclassifies the formula.
    """
    # Check if there exists an unsatisfying assignment with positive probability.
    if not _does_probable_unsatisfying_exist(formula, assignment, probs):
        return -math.inf

    # Build an ILP model for the input.
    model, model_vars = _sat_assignment_build_ilp_model(formula, assignment, probs)

    # Solve the ILP problem.
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = MAX_ILP_RUNNING_TIME_SEC
    status = solver.Solve(model)

    if status != cp_model.OPTIMAL:
        raise Exception("Couldn't solve the ILP problem")

    objective_value = solver.ObjectiveValue()
    assignment_vars = set(assignment.keys())
    s = 0
    for var in formula.vars():
        if var not in assignment_vars:
            continue
        prob = probs[var]
        if prob == 0:
            continue
        elif assignment[var]:
            s += math.log(prob)
        else:
            s += math.log(1 - prob)

    return objective_value + s


def _calc_log_mes_non_sat(formula: DnfFormula,
                          assignment: Assignment,
                          probs: utils.VarProbabilities) -> float:
    """
    Calculate the logarithm of the maximal probability that an unsatisfying assignment misclassifies
    a formula.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total unsatisfying assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The logarithm of the maximal probability that the assignment misclassifies the formula.
    """
    max_log_prob = -math.inf
    for term in formula.terms():
        new_assignment = _satisfying_vars_assignment(term, assignment)
        current_log_prob = _calc_assignment_log_prob(assignment, new_assignment, probs)

        # Update the maximal probability.
        if current_log_prob > max_log_prob:
            max_log_prob = current_log_prob

    return max_log_prob


def calc_log_mes(formula: DnfFormula,
                 assignment: Assignment,
                 probs: utils.VarProbabilities) -> float:
    """
    Calculate the logarithm of the maximal probability that an assignment misclassifies a formula.

    Args:
        formula: A k-DNF formula
        assignment: A partial or total assignment
        probs: A dictionary that maps the probability of mistake for each variable

    Returns:
        The logarithm of the maximal probability that the assignment misclassifies the formula.
    """
    utils.validate_probabilistic_input(formula, assignment, probs, partial_assignment=True)
    if all(v == 0 for v in probs):
        return -math.inf

    is_sat = formula.truth_value(assignment)
    assert is_sat is not None

    if is_sat:
        ret = _calc_log_mes_sat(formula, assignment, probs)
    else:
        ret = _calc_log_mes_non_sat(formula, assignment, probs)

    assert math.isfinite(ret) or ret == -math.inf
    return ret


def calc_mes(formula: DnfFormula,
             assignment: Assignment,
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
    ret = math.exp(calc_log_mes(formula, assignment, probs))
    assert math.isfinite(ret)
    return ret
