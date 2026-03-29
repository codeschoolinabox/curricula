#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def count_items(to_count: list) -> int:
    """
    
    """
    if len(to_count) == 0:
        return 0

    break_down = to_count[1:]
    recursion = count_items(break_down)
    build_up = recursion + 1

    return  build_up


# --- counting steps ---
