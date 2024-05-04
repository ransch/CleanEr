import json

from oracle_mistakes.dnf_formula import DnfFormula, Assignment
from oracle_mistakes.utils import VarProbabilities


def parse_formula_param(formula_param: str) -> DnfFormula:
    """
    Convert a formula parameter (represented in JSON) to a `DnfFormula` instance.

    Args:
        formula_param: A formula parameter, e.g. `[["a_0", "r_0", "e_0"], ["a_0", "r_1", "e_1"], ["a_0", "r_2", "e_3"]]`.

    Returns:
        A `DnfFormula` instance representing the given formula parameter.
    """
    return DnfFormula(json.loads(formula_param))


def parse_assignment_param(assignment_param: str) -> Assignment:
    """
    Convert a probs parameter (represented in JSON) to an `Assignment` instance.

    Args:
        assignment_param: An assignment parameter, represented in JSON.

    Returns:
        An `Assignment` instance representing the given assignment parameter.
    """
    return json.loads(assignment_param)


def parse_probs_param(probs_param: str) -> VarProbabilities:
    """
    Convert a probs parameter (represented in JSON) to a `VarProbabilities` instance.

    Args:
        probs_param: A probs parameter, represented in JSON.

    Returns:
        A `VarProbabilities` instance representing the given probabilities parameter.
    """
    return json.loads(probs_param)
