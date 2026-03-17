#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def fibonacci_memo(n: int, memo: dict = {}) -> int:
    """
    
    """
    if n == 0:
        return 0

    if n == 1:
        return 1

    if n in memo:
        return memo[n]

    left_break_down = n - 1
    right_break_down = n - 2

    left_recursion = fibonacci_memo(left_break_down, memo)
    right_recursion = fibonacci_memo(right_break_down, memo)

    build_up = left_recursion + right_recursion
    memo[n] = build_up
    
    return memo[n]


# --- counting steps ---
