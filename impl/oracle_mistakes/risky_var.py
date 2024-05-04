"""
This module contains algorithms that involve risky variables for precision.
"""
import math
from oracle_mistakes import mes
from oracle_mistakes import utils
from oracle_mistakes.dnf_formula import DnfFormula, Assignment


def is_var_risky_for_precision(formula: DnfFormula,
                               assignment: Assignment,
                               probs: utils.VarProbabilities,
                               var: str) -> bool:
    """
    Check if a variable is risky for precision.

    Args:
        formula: A k-DNF formula
        assignment: An assignment
        probs: A dictionary that maps the probability of mistake for each variable
        var: A variable in the given formula

    Returns:
        True iff the given variable is risky for precision.
    """
    utils.validate_probabilistic_input(formula, assignment, probs, partial_assignment=True)
    if var not in formula.vars():
        raise ValueError('Bad variable')

    better_probs = probs.copy()
    better_probs[var] = 0

    first_log_mes = mes.calc_log_mes(formula, assignment, probs)

    if all(v == 0 for v in better_probs.values()):
        second_log_mes = -math.inf
    else:
        second_log_mes = mes.calc_log_mes(formula, assignment, better_probs)

    return second_log_mes > first_log_mes
