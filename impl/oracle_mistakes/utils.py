"""
Utility functions.
"""
from oracle_mistakes.dnf_formula import DnfFormula, Assignment

VarProbabilities = dict[str, float]


def validate_probabilistic_input(formula: DnfFormula,
                                 assignment: Assignment,
                                 probs: VarProbabilities,
                                 partial_assignment: bool = False):
    """
    Check if the given formula, assignment, and probabilities, are valid:
    - The formula is a k-DNF formula.
    - The formula, assignments, and probabilities are defined over the same variables.
    - The probabilities are less than 0.5.
    - At least one probability is positive.

    Args:
        formula: A formula
        assignment: An assignment
        probs: A dictionary that maps the probability of mistake for each variable
        partial_assignment: Whether the assignment is allowed to be partial

    Returns:
        k

    Note:
        If the input is not valid, an exception is raised. That is, the function returns iff the
        input is valid.
    """
    if formula.k() is None:
        raise ValueError('The formula must be in k-DNF form')

    formula_vars = formula.vars()
    assignment_keys = set(assignment.keys())
    probs_keys = probs.keys()
    probs_values = probs.values()

    if assignment_keys != probs_keys or any(v >= 1 / 2 for v in probs_values):
        raise ValueError('Bad probabilities')

    is_sat = formula.truth_value(assignment)
    if (is_sat is None) or \
            (partial_assignment and (not formula_vars.issuperset(assignment_keys))) or \
            ((not partial_assignment) and formula_vars != assignment_keys):
        raise ValueError('Bad assignment')
