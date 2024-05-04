import math

from oracle_mistakes import mes
from oracle_mistakes.dnf_formula import DnfFormula

_EPSILON = 1e-7


def test_calc_mes_no_errors():
    phi = DnfFormula([['a', 'b'], ['a', 'c']])
    v = {'a': True, 'b': True, 'c': True}
    probs = {'a': 0.0, 'b': 0.0, 'c': 0.0}

    assert 0 == mes.calc_mes(phi, v, probs)


def test_calc_mes_correct_tuple_total_assignment():
    phi = DnfFormula([['a', 'b'], ['a', 'c']])
    v = {'a': True, 'b': True, 'c': True}
    probs = {'a': .1, 'b': .1, 'c': .2}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert truth_value

    assert abs(mes.calc_mes(phi, v, probs) - 0.072) < _EPSILON


def test_calc_mes_correct_tuple_partial_assignment():
    phi = DnfFormula([['a', 'b'], ['a', 'c']])
    v = {'a': True, 'b': True}
    probs = {'a': .1, 'b': .1}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert truth_value

    assert abs(mes.calc_mes(phi, v, probs) - 0.09) < _EPSILON


def test_calc_mes_incorrect_tuple_total_assignment():
    phi = DnfFormula([['a', 'b'], ['c', 'd']])
    v = {'a': False, 'b': True, 'c': True, 'd': False}
    probs = {'a': .1, 'b': .2, 'c': .3, 'd': .4}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert not truth_value

    assert abs(mes.calc_mes(phi, v, probs) - 0.2016) < _EPSILON


def test_calc_mes_incorrect_tuple_partial_assignment():
    phi = DnfFormula([['a', 'b'], ['c', 'd']])
    v = {'a': False, 'd': False}
    probs = {'a': .1, 'd': .4}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert not truth_value

    assert abs(mes.calc_mes(phi, v, probs) - 0.36) < _EPSILON


def test_calc_log_mes_correct_tuple_total_assignment():
    phi = DnfFormula([['a', 'b'], ['a', 'c']])
    v = {'a': True, 'b': True, 'c': True}
    probs = {'a': .1, 'b': .1, 'c': .2}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert truth_value

    assert abs(mes.calc_log_mes(phi, v, probs) - math.log(0.072)) < _EPSILON


def test_calc_log_mes_incorrect_tuple_total_assignment():
    phi = DnfFormula([['a', 'b'], ['c', 'd']])
    v = {'a': False, 'b': True, 'c': True, 'd': False}
    probs = {'a': .1, 'b': .2, 'c': .3, 'd': .4}

    truth_value = phi.truth_value(v)
    assert truth_value is not None
    assert not truth_value

    assert abs(mes.calc_log_mes(phi, v, probs) - math.log(0.2016)) < _EPSILON
