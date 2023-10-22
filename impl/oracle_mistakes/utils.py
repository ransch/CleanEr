"""
Utility functions.
"""
import typing

from sympy.logic import boolalg
from sympy.core import basic, symbol

Assignment = typing.Dict[symbol.Symbol, bool]
VarProbabilities = typing.Dict[symbol.Symbol, float]


def is_conjunction(formula: basic.Basic, k: int) -> bool:
    """
    Check if a given formula is a conjunction of variables.

    Args:
        formula: A formula
        k: The number of expected variables, should be positive

    Returns:
        True iff the given formula is a conjunction of variables.
    """
    if k <= 0:
        raise ValueError('Bad k value')

    if k == 1:
        return isinstance(formula, symbol.Symbol)

    if not isinstance(formula, boolalg.And):
        return False

    args = formula.args
    # Check the size of the conjunction.
    if len(args) != k:
        return False

    # Check if the clause contains a non-variable member.
    return all(isinstance(x, symbol.Symbol) for x in args)


def is_k_dnf(formula: boolalg.Boolean) -> int:
    """
    Check if a given formula is in k-DNF form.

    Args:
        formula: A formula

    Returns:
        k if the given formula is in k-DNF form, 0 otherwise
    """
    # If the formula is not a disjunction, it may still be in k-DNF form with a single term.
    if not isinstance(formula, boolalg.Or):
        k = len(formula.args)
        if is_conjunction(formula, k):
            return k
        return 0

    # Guess the k.
    k = len(formula.args[0].args)
    # K is zero when formula.args[0] is a symbol.
    if k == 0:
        k = 1

    # Check that all the terms in the disjunction are conjunctions of variables.
    if not all(is_conjunction(x, k) for x in formula.args):
        return 0

    return k


def validate_probabilistic_input(formula: boolalg.Boolean,
                                 assignment: Assignment,
                                 probs: VarProbabilities,
                                 partial_assignment: bool = False) -> int:
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
    k = is_k_dnf(formula)
    if k == 0:
        raise TypeError('The formula must be in k-DNF form')

    formula_atoms = formula.atoms()
    assignment_keys = set(assignment.keys())
    probs_keys = probs.keys()
    probs_values = probs.values()

    if formula_atoms != set(probs_keys) or \
            any(v >= 1 / 2 for v in probs_values) or \
            all(v == 0 for v in probs_values):
        raise ValueError('Bad probabilities')

    is_sat = formula.subs(assignment)
    if (not isinstance(is_sat, boolalg.BooleanAtom)) or \
            (partial_assignment and (not formula_atoms.issuperset(assignment_keys))) or \
            ((not partial_assignment) and formula_atoms != assignment_keys):
        raise ValueError('Bad assignment')

    return k


def get_terms(formula: boolalg.Boolean) -> typing.Tuple[boolalg.Boolean]:
    """
    Split a k-DNF formula to its terms.

    Args:
        formula: A formula

    Returns:
        A tuple of the terms of the given formula.
    """
    k = is_k_dnf(formula)
    if k == 0:
        raise TypeError('The formula must be in k-DNF form')

    # If the formula has more than one term, return its args field.
    if isinstance(formula, boolalg.Or):
        return formula.args

    # If the formula has only one term, wrap it in a tuple.
    return formula,
