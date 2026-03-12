# Just Enough Python: Cheat Sheet

A quick guide to all the Python syntax and features you need for Welcome to
Python, which is enough to write basic programs that process user text. And writing these programs is enough to build very strong foundational programming skills.

- [Comments](#comments)
- [Primitive Types](#primitive-types)
- [Operators](#operators)
- [Strings](#strings)
- [Printing](#printing)
- [Variables](#variables)
- [Input](#input)
- [Block Scope](#block-scope)
- [Conditionals](#conditionals)
- [While Loops](#while-loops)
- [For-Of Loops](#for-of-loops)
- [Break](#break)
- [Continue](#continue)

---

## Comments

Notes written in your code for developers to read. The computer will ignore
these when executing your code.

```py
 # single-line comment

'''
  multiple
  line
  comment
'''
```

[TOP](#just-enough-python-cheat-sheet)

---

## Primitive Types

The smallest pieces of data in a Python program. There are many primitive types but
you only need to know these for now:

```py
# Booleans
True
False

# Strings
''  # empty string
'hello'
'"hello"'  # quotes in a string (1)
"'hello'"  # quotes in a string (2)

# Integers
0
1
-100

# Floats
0.0
1.5
-3.14


# "object" - Python's equivalent to JavaScript's null
None
```

[TOP](#just-enough-python-cheat-sheet)

---

## Operators

Ways to transform data. An operator takes in 1 or more values and _evaluates to_
a new value.

Operators in Python are a huge topic, for
now this should be enough:

```py
# type()
type("a string")  # <class 'str'>
type(True)  # <class 'bool'>
type(1)  # <class 'int'>
type(None)  # <class 'NoneType'>

# strict equality
4 == "4"  # False
# strict inequality
4 != "4"  # True

# string concatenation
"hello" + " " + "world"  # "hello world"

# and
True and False  # False
# or
True or False  # True
# not
not True  # False

# arithmetic: int int
# addition
4 + 2  # 6
# subtraction
4 - 2  # 2
# multiplication
4 * 2  # 8
# division
4 / 2  # 2
5 / 2 #2.5

# arithmetic: float float
# addition
4.0 + 2.0  # 6.0
# subtraction
4.0 - 2.0  # 2.0
# multiplication
4.0 * 2.0  # 8.0
# division
4.0 / 2.0  # 2.0

# arithmetic: mixed
# addition
4 + 2.0  # 6.0
# subtraction
4.0 - 2  # 2.0
# multiplication
4 * 2.0  # 8.0
# division
4 / 2.0  # 2.0

# greater than
4 > 3  # True
4 > 4  # False
# less than
4 < 4  # False
4 < 5  # True
# greater than or equal to
4 >= 3  # True
4 >= 4  # True
4 >= 5  # False
# less than or equal to
4 <= 3  # False
4 <= 4  # True
4 <= 5  # True
```

[TOP](#just-enough-python-cheat-sheet)

---

## Strings

The data type used for storing and manipulating text data. Strings will be the
main type of data used in Welcome to Python.

```py
# string length
len("")  # 0
len("a")  # 1
len("ab")  # 2

# string indexes
"abc"[-1]  # 'c'
"abc"[0]  # 'a'
"abc"[1]  # 'b'
"abc"[2]  # 'c'

# --- string methods ---

"HeLlO".lower()  # 'hello'
"HeLlO".upper()  # 'HELLO'

"b" in "abc"  # True

"+a+b+c+".replace("+", "")  # 'abc'

"  abc    ".strip()  # 'abc'

"abc".find("a")  # 0
"abc".find("")  # 0
"abc".find("b")  # 1
"abc".find("bc")  # 1
"abc".find("x")  # -1

# getting a substring by index
"abc"[0:]  # 'abc'
"abc"[1:]  # 'bc'
"abc"[2:]  # 'c'

"abc"[:0]  # ''
"abc"[:1]  # 'bc'
"abc"[:2]  # 'c'

"abc"[0:0]  # ''
"abc"[0:1]  # 'a'
"abc"[0:2]  # 'ab'
"abc"[1:1]  # ''
"abc"[1:2]  # 'b'
"abc"[2:2]  # ''

"abc"[-2:-1]  # 'b'
```

[TOP](#just-enough-python-cheat-sheet)

---

## Printing

A simple way to print data to the console while the program is
running. This is helpful for knowing what data is stored in your program at
different points in execution.

```js
print("hello");
```

[TOP](#just-enough-python-cheat-sheet)

---

## Variables

Variables allow you to save values to use again later in your program.They're
kind of like a box that can only hold one thing at a time.

Variables are also an important tool for writing code that is clear for other
developers to read and understand. Using helpful names can make your code read
(sort of) like a story.

```py
# assign: name
name = "Python"

# read: name
print(name) # "Python"

# assign: exclaim
exclaim = "!"

# read: name, exclaim
# assign: name
name = name + exclaim

# read: name
print(name)  # "Python!"

# cannot read a variable before assigning it
print(noop) # NameError: name 'noop' is not defined
```

[TOP](#just-enough-python-cheat-sheet)

---

## Input

Programmers can pass string data into your programs using `input`.

```py
# --- input ---

# allows the user to enter text
user_input = input("enter some text:\n")

# --- output ---

# prints a message but does not take user input
print('thank you for: ' + user_input)
```

[TOP](#just-enough-python-cheat-sheet)

---

## Conditionals

Execute different blocks of code depending on whether an expression evaluates to
`True` or to `False`:

```py
if (anExpression) {
  # path 1: if anExpression is true
}

if (anExpression) {
  # path 1: if anExpression is true
} else {
  # path 2: if anExpression is false
}

if (firstExpression) {
  # path 1: if firstExpression is true
} else if (secondExpression) {
  # path 2: if secondExpression is true
} else {
  # path 3: if both expressions are false
}
```

[TOP](#just-enough-python-cheat-sheet)

---

## Block Scope

Variables declared _inside_ curly braces can only be used inside those curly
braces. Trying to use a variable in an _outer scope_ will cause an error.

Variables declared _outside_ of curly braces can be used outside or inside the
curly braces.

```py
let outer = "declared outside the block"
{
  outer = "reassigned in the block"
  let inner = "only defined in the block"
}
console.log(outer) # 'reassigned in ...'
console.log(inner) # ReferenceError
```

[TOP](#just-enough-python-cheat-sheet)

---

## While Loops

Repeat a block of code as long as an expression evaluates to `true`.

1. Evaluate the expression
2. Check if it is `true` or `false`
   1. if it is `true`, execute the block
   2. return to step 2
3. Move on to the next line after the loop

```py
while (anExpression) {
  # loop body
}

# next line after the loop
```

[TOP](#just-enough-python-cheat-sheet)

---

## For-Of Loops

Iterate over a string, executing the loop body once for each character.

A new variable is declared for each character and that variable is scoped to the
block. Each time the block is executed the variable stores the next character in
the string.

```py
for (let character of "hello") {
  # loop body
}

# next line after the loop
```

[TOP](#just-enough-python-cheat-sheet)

---

## Break

Exit a loop immediately and skip to the next line after the loop.

```py
while (anExpression) {
  break # exit the loop immediately
  # this line is not executed
}

for (let character of "hello") {
  break # exit the loop immediately
  # this line is not executed
}
```

[TOP](#just-enough-python-cheat-sheet)

---

## Continue

Skip the rest of the loop body and go to the next iteration.

```py
while (anExpression) {
  continue # skip to the the loop check
  # this line is not executed
}


for (let character of "hello") {
  continue # skip to the next character
  # this line is not executed
}
```

[TOP](#just-enough-python-cheat-sheet)

---

---

## Bonus! Example Program

```py
text = None
while text != None:
  text = input('please enter "cat":\n-> )

if (text.lower() == 'cat'):
  for

```
