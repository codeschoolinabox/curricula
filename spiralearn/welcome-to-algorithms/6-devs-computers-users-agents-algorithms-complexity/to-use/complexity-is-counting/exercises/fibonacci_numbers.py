#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# source: https://github.com/nocotan/algorithm_collection/blob/main/algorithm_collection/mathematics/fibonacci_numbers.py


def fibonacci_numbers(n):
    assert n >= 0

    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci_numbers(n-1) + fibonacci_numbers(n-2)

# --- counting steps ---
