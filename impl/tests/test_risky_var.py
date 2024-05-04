import math
import pytest

from oracle_mistakes import risky_var
from oracle_mistakes.dnf_formula import DnfFormula


@pytest.mark.parametrize("first_log_mes, second_log_mes, expected_is_risky", [
    (-0.916, -0.916, False),
    (-0.916, -1.203, False),
    (-0.916, -math.inf, False),
    (-0.916, 0.5, True),
])
def test_is_var_risky_for_precision(mocker, first_log_mes, second_log_mes, expected_is_risky):
    mocked_mes = mocker.patch('oracle_mistakes.mes.calc_log_mes')
    mocked_mes.side_effect = [first_log_mes, second_log_mes]

    phi = DnfFormula([['a', 'b'], ['a', 'c']])
    v = {'a': True, 'b': False, 'c': True}
    probs = {'a': .1, 'b': .1, 'c': .1}

    assert expected_is_risky == risky_var.is_var_risky_for_precision(phi, v, probs, 'a')

    assert mocked_mes.call_count == 2
    second_call_probs = probs.copy()
    second_call_probs['a'] = 0
    expected_mock_calls = [mocker.call(phi, v, probs), mocker.call(phi, v, second_call_probs)]
    assert mocked_mes.call_args_list == expected_mock_calls
