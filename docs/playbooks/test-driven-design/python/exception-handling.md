---
title: Python Exception Handling Cheatsheet
---

# Python Exception Handling Cheatsheet

## Imports

Standard exception handling does not usually require imports, as most common exceptions are built-in. However, `sys` and `traceback` are useful for inspection.

```python
import sys
import traceback
```

## Try-Except-Else-Finally Block

```python
try:
    # Code that might raise an exception
    result = 10 / 0
except ZeroDivisionError as e:
    # Handle specific exception
    print(f"Cannot divide by zero: {e}")
except Exception as e:
    # Handle general exception
    print(f"An error occurred: {e}")
else:
    # Runs if NO exception occurs
    print("Calculation successful:", result)
finally:
    # Always runs (cleanup)
    print("Execution finished.")
```

## Raising Exceptions

```python
def validate_age(age):
    if age < 18:
        raise ValueError("Age must be at least 18")
```

## Custom Exceptions

```python
class InsufficientFundsError(Exception):
    """Raised when the account balance is insufficient."""
    pass

try:
    raise InsufficientFundsError("Not enough money")
except InsufficientFundsError as e:
    print(e)
```

## Context Managers (with statement)

Ensures resources are properly managed (like closing files).

```python
try:
    with open("file.txt", "r") as f:
        content = f.read()
except FileNotFoundError:
    print("File not found.")
```

## Common Exceptions Reference

| Exception | Description |
| :--- | :--- |
| `TypeError` | Operation or function applied to an object of inappropriate type. |
| `ValueError` | Function receives argument of correct type but inappropriate value. |
| `IndexError` | Sequence subscript is out of range. |
| `KeyError` | Dictionary key is not found. |
| `AttributeError` | Attribute reference or assignment fails. |
| `ImportError` | `import` statement fails to find the module definition. |
| `ModuleNotFoundError` | Concrete subclass of ImportError, raised when a module cannot be located. |
| `IOError` / `OSError` | I/O operation fails (e.g., "file not found"). |
| `KeyboardInterrupt` | User hits the interrupt key (Ctrl+C). |
| `NameError` | Local or global name is not found. |
| `ZeroDivisionError` | Second argument to a division or modulo operation is zero. |

## Best Practices

1.  **Be specific** in `except` clauses. Avoid bare `except:` which catches everything including system interrupts.
2.  **Use `finally`** for cleanup actions.
3.  **Raise** exceptions when a function cannot perform its task.
4.  **Chain exceptions** using `raise ... from ...` to preserve context (Python 3).

```python
try:
    # ...
except KeyError as e:
    raise ValueError("Invalid key provided") from e
```

## Useful Links

*   [Python Docs: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html)
*   [Real Python: Python Exceptions](https://realpython.com/python-exceptions/)
*   [Programiz: Python Exception Handling](https://www.programiz.com/python-programming/exception-handling)
