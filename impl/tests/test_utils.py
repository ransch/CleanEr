import pytest

from oracle_mistakes import utils
from oracle_mistakes.dnf_formula import DnfFormula


@pytest.mark.parametrize("formula, assignment, probs, partial_assignment", [
    (DnfFormula([['a']]), {'a': False}, {'a': 0}, False),
    (DnfFormula([['a']]), {'a': False}, {'a': 0}, True),
    (DnfFormula([['a']]), {'a': False}, {'a': 0.1}, False),
    (DnfFormula([['a']]), {'a': False}, {'a': 0.1}, True),
    (DnfFormula([['a', 'b']]), {'a': True, 'b': False}, {'a': 0, 'b': 0.2}, False),
    (DnfFormula([['a', 'b']]), {'a': True, 'b': False}, {'a': 0.1, 'b': 0.2}, False),
    (DnfFormula([['a', 'b']]), {'a': True, 'b': False}, {'a': 0.1, 'b': 0}, False),
    (DnfFormula([['a', 'b']]), {'b': False}, {'b': 0.2}, True),
    (DnfFormula([['a', 'b', 'c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0.1, 'b': 0.2, 'c': 0.3}, False),
    (DnfFormula([['a', 'b', 'c']]), {'a': True, 'c': False}, {'a': 0.1, 'c': 0.3}, True),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0.1, 'b': 0.2, 'c': 0.3}, False),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0, 'b': 0, 'c': 0}, False),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': False}, {'a': 0.1}, True),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': False}, {'a': 0}, True),
    (DnfFormula([['a', 'b'], ['a', 'c'], ['b', 'c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0.1, 'b': 0, 'c': 0.3}, False),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0, 'b': 0.2, 'c': 0.3}, False),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': True}, {'a': 0.1}, True),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': True}, {'a': 0}, True),
])
def test_validate_probabilistic_input_valid(formula, assignment, probs, partial_assignment):
    utils.validate_probabilistic_input(formula, assignment, probs, partial_assignment)


@pytest.mark.parametrize("formula, assignment, probs, partial_assignment", [
    (DnfFormula([['a']]), {}, {'a': 0.1}, True),
    (DnfFormula([['a']]), {'b': False}, {'a': 0.1}, True),
    (DnfFormula([['a']]), {'a': False, 'b': False}, {'a': 0.1}, False),
    (DnfFormula([['a']]), {'a': False, 'b': False}, {'a': 0.1}, True),
    (DnfFormula([['a']]), {'a': False}, {}, True),
    (DnfFormula([['a']]), {'a': False}, {'b': 0.1}, True),
    (DnfFormula([['a']]), {'a': False}, {'a': 0.1, 'b': 0.1}, False),
    (DnfFormula([['a']]), {'a': False}, {'a': 0.1, 'b': 0.1}, True),
    (DnfFormula([['a']]), {'a': False, 'b': False}, {'a': 0.1, 'b': 0.1}, False),
    (DnfFormula([['a']]), {'a': False, 'b': False}, {'a': 0.1, 'b': 0.1}, True),
    (DnfFormula([['a', 'b']]), {'b': False}, {'b': 0.2}, False),
    (DnfFormula([['a', 'b']]), {'b': True}, {'b': 0.2}, True),
    (DnfFormula([['a', 'b', 'c']]), {'a': True, 'c': False}, {'a': 0.1, 'c': 0.3}, False),
    (DnfFormula([['a', 'b', 'c']]), {'a': True, 'c': True}, {'a': 0.1, 'c': 0.3}, True),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': False}, {'a': 0.1}, False),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': True, 'b': False}, {'a': 0.1, 'b': 0.2}, True),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': True, 'b': False, 'c': True, 'd': False},
     {'a': 0.1, 'b': 0.2, 'c': 0.3, 'd': 0.4},
     False),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': True, 'b': False, 'c': True},
     {'a': 0.1, 'b': 0.2, 'c': 0.51}, False),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': False, 'b': False}, {'a': 0.1, 'b': 0.2, 'c': 0.3},
     True),
    (DnfFormula([['a', 'b'], ['a', 'c']]), {'a': False, 'b': False, 'c': False},
     {'a': 0.1, 'b': 0.2}, True),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': False}, {'a': 0}, True),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': False}, {'a': 0.1}, True),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': False, 'b': False}, {'a': 0.1, 'b': 0.2}, False),
    (DnfFormula([['a'], ['b'], ['c']]), {'a': False, 'b': False}, {'a': 0, 'b': 0}, False),
])
def test_validate_probabilistic_input_invalid_params(formula, assignment, probs,
                                                     partial_assignment):
    with pytest.raises(ValueError):
        utils.validate_probabilistic_input(formula, assignment, probs, partial_assignment)
