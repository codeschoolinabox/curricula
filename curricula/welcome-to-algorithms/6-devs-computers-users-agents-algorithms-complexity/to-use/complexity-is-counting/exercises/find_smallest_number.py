#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def find_smallest_number(numbers: list) -> int:
    """
    
    """
    if len(numbers) == 0:
        return None
    
    if len(numbers) == 1:
        return numbers[0]

    break_down = numbers[1:]
    recursion = find_smallest_number(break_down)
    build_up = numbers[0] if numbers[0] < recursion else recursion
    
    return  build_up


# --- counting steps ---
