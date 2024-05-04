from typing import Union

Assignment = dict[str, bool]


class DnfFormula:
    def __init__(self, terms: list[list[str]]):
        self._terms: tuple[tuple[str]] = tuple(tuple(term) for term in terms)
        self._vars: frozenset[str] = frozenset(var for term in terms for var in term)
        self._k: Union[int, None] = DnfFormula._is_k_dnf(self._terms)

    @staticmethod
    def _is_k_dnf(terms: tuple[tuple[str]]) -> Union[int, None]:
        k_candidate = len(terms[0])
        if all(len(term) == k_candidate for term in terms):
            return k_candidate

        return None

    @staticmethod
    def _term_truth_value(term: tuple[str], assignment: Assignment) -> Union[bool, None]:
        is_none = False
        for var in term:
            if var not in assignment:
                is_none = True
                continue
            var_assignment = assignment[var]
            if not var_assignment:
                return False

        if is_none:
            return None

        return True

    def truth_value(self, assignment: Assignment) -> Union[bool, None]:
        is_none = False
        for term in self._terms:
            term_truth_value = DnfFormula._term_truth_value(term, assignment)
            if term_truth_value:
                return True
            elif term_truth_value is None:
                is_none = True

        if is_none:
            return None

        return False

    def vars(self) -> frozenset[str]:
        return self._vars

    def terms(self) -> tuple[tuple[str]]:
        return self._terms

    def k(self) -> Union[int, None]:
        return self._k

    def __eq__(self, other):
        if not isinstance(other, DnfFormula):
            return False

        return self._terms == other._terms
