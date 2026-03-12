#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def reverse_list(to_reverse: list) -> list:
    """
    
    """
    if len(to_reverse) == 0:
        return []

    break_down = to_reverse[1:]
    recursion = reverse_list(break_down)
    build_up = recursion + [to_reverse[0]]

    return  build_up


# --- counting steps ---
