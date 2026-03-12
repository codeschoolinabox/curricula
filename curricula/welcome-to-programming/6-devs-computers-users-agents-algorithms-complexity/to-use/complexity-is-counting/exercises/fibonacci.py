#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def fibonacci(n: int) -> int:
    """ """
    if n <= 0:
        return 0

    if n == 1:
        return 1

    left_break_down = n - 1
    right_break_down = n - 2

    left_recursion = fibonacci(left_break_down)
    right_recursion = fibonacci(right_break_down)

    build_up = left_recursion + right_recursion

    return build_up


# --- counting steps ---
