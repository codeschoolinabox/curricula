#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def bubble_sort(numbers: list[int | float]) -> list[int | float]:
    length = len(numbers)

    sorted = True
    for i in range(length - 1):
        if numbers[i] > numbers[i + 1]:
            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
            sorted = False

    if sorted:
        return numbers
    else:
        # how does the recursive call relate to "constant" lines?
        return bubble_sort(numbers)

# --- counting steps ---

# !! it DOES matter where unsorted numbers are RELATIVE to each other

# --- base cases: nothing to sort
# bubble_sort([]) # 5
# bubble_sort([0]) # 5

# --- sorted lists -> 5 + (n-1) * 2
# bubble_sort([0, 1]) # 7
# bubble_sort([0, 1, 2]) # 9
# bubble_sort([0, 1, 2, 10]) # 11
# bubble_sort([0, 1, 2, 10, 14, 23]) # 5 + (6-1)*2 = 5+5*2 = 5+10 = 15
# bubble_sort([0, 1, 2, 10, 12, 21, 212, 1212, 2121]) # 5 + (8 * 2) = 5 + 16 = 21

# --- unsorted lists with 2 sequential items unsorted
# bubble_sort([1, 0]) # 16
# bubble_sort([1, 3, 2]) # 20
# bubble_sort([2, 1, 3]) # 20
# bubble_sort([2, 1, 3, 4]) # 24
# bubble_sort([1, 2, 4, 3]) # 24
# bubble_sort([1, 2, 3, 5, 4, 6, 7, 8]) # 40
# bubble_sort([1, 2, 6, 4, 5, 3, 7, 8]) # 86

# --- unsorted lists with 2 unsorted numbers equidistant
# bubble_sort([3, 2, 1, 4, 5]) # 45
# bubble_sort([1, 4, 3, 2, 5]) # 45
bubble_sort([1, 2, 5, 4, 3]) # 45
