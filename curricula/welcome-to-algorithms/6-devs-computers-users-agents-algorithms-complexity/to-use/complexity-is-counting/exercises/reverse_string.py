#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def reverse_string(to_reverse: str) -> str:
    """Reverses a string.
    
    Args: 
        str: the string to return

    Returns: The argument, reversed

    Raises:
        AssertionError: if the argument is not a string

    >>> reverse_string('')
    ''

    >>> reverse_string('123')
    '321'

    >>> reverse_string('aabaa')
    'aabaa'
    """
        
    assert isinstance(to_reverse, str), "argument is not a string"
    
    reversed_input = ""

    for next_character in to_reverse:
        reversed_input = next_character + reversed_input

    return reversed_input


# --- counting steps ---
