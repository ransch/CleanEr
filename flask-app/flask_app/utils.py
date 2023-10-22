import typing
import json
import sympy
from sympy.core import basic, symbol
from sympy.parsing import sympy_parser


def parse_formula_param(formula_param: str) -> basic.Basic:
    """
    Convert a formula parameter (represented in JSON) to a SymPy object.
    For example, `[["a_0", "r_0", "e_0"], ["a_0", "r_1", "e_1"], ["a_0", "r_2", "e_3"]]` will be
    converted to `(a_0 & r_0 & e_0) | (a_0 & r_1 & e_1) | (a_0 & r_2 & e_3)`.

    Args:
        formula_param: A formula parameter

    Returns:
        A SymPy expression from the given formula parameter.
    """
    dictionary = json.loads(formula_param)
    formula_str = ' | '.join(f'({" & ".join(term)})' for term in dictionary)
    return sympy_parser.parse_expr(formula_str, evaluate=False)


def json_to_symbols_dict(json_str: str) -> typing.Dict[symbol.Symbol, typing.Any]:
    """
    Convert a json whose keys represent symbols to a dictionary whose keys are SymPy symbols.

    Args:
        json_str: A json string

    Returns:
        A dictionary that represents the given json, whose keys are SymPy symbols.
    """
    dictionary = json.loads(json_str)
    return {sympy.Symbol(var): truth_value for (var, truth_value) in dictionary.items()}


def parse_probs_param(probs_param: str) -> typing.Dict[symbol.Symbol, float]:
    """
    Convert a probs parameter (represented in JSON) to a dictionary whose keys are SymPy symbols and
    its values are floats.

    Args:
        probs_param: A probs parameter, represented in JSON

    Returns:
        A dictionary that represents the given parameter, whose keys are SymPy symbols and its
        values are floats.
    """
    dictionary = json_to_symbols_dict(probs_param)
    return {var: float(prob) for var, prob in dictionary.items()}
