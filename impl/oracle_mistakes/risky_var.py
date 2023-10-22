"""
This module contains algorithms that involve risky variables for precision.
"""

from sympy.logic import boolalg
from sympy.core import symbol
from oracle_mistakes import utils
from oracle_mistakes import misclass_prob


def is_var_risky_for_precision(formula: boolalg.Boolean,
                               assignment: utils.Assignment,
                               probs: utils.VarProbabilities,
                               var: symbol.Symbol) -> bool:
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
    if var not in formula.atoms():
        raise ValueError('Bad variable')

    better_probs = probs.copy()
    better_probs[var] = 0

    first_max_prob = misclass_prob.calc_max_misclass_prob(formula, assignment, probs)

    if all(v == 0 for v in better_probs.values()):
        second_max_prob = 0
    else:
        second_max_prob = misclass_prob.calc_max_misclass_prob(formula, assignment, better_probs)

    return second_max_prob > first_max_prob
