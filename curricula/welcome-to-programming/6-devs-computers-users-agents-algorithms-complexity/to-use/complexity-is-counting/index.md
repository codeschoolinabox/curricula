# Complexity is (fancy) Counting

Running a function with `python -m trace -c path/to/file.py` is a simple way to explore _time complexity_ by simply counting steps!  You can pair this with __predictive stepping__ in your debugger to understand connections between the function's _strategy_ and it's _complexity_.

## The Exercise

1. Create a file with the function you want to study - from this chapter, from a tutorial, one of your own, or anywhere else!
2. Explore and find patterns!  Count how many steps it takes to run the function with different inputs:
     - Organize your examples by _size_ and other characteristics.
     - Note how many steps it takes for each input.
     - Note which lines contribute to the function's _complexity_ and which lines are _constant_.
     - Test your _hypotheses_ about how different input characteristics contribute to the total steps.
     - ... follow your curiosity!  There's no wrong answers, only more questions.
