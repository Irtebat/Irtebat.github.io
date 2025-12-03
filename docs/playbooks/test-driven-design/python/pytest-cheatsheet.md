---
title: pytest Cheatsheet
description: A quick reference for testing with pytest.
sidebar_label: pytest
---

# pytest Cheatsheet

## Installation

```bash
pip install pytest
```

## Imports

```python
import pytest
```

## Running Tests

```bash
pytest                      # Run all tests in current dir and subdirs
pytest test_file.py         # Run tests in specific file
pytest -k "name"            # Run tests matching name substring
pytest -m "slow"            # Run tests with specific marker
pytest -v                   # Verbose output
pytest -s                   # Show stdout (print statements)
pytest --lf                 # Run last failed tests
```

## Basic Test Anatomy

```python
# test_example.py

def add(x, y):
    return x + y

def test_add():
    assert add(1, 2) == 3
    assert add(-1, 1) == 0
```

## Fixtures

Fixtures are used to provide data or setup state for tests.

```python
import pytest

@pytest.fixture
def sample_data():
    return {"a": 1, "b": 2}

def test_with_fixture(sample_data):
    assert sample_data["a"] == 1
```

### Fixture Scopes

*   `@pytest.fixture(scope="function")` (default): Run once per test function.
*   `@pytest.fixture(scope="module")`: Run once per test module.
*   `@pytest.fixture(scope="session")`: Run once per test session.
*   `@pytest.fixture(scope="class")`: Run once per test class.

### Setup/Teardown with yield

```python
@pytest.fixture
def db_connection():
    conn = connect_db() # Setup
    yield conn
    conn.close()        # Teardown
```

## Parametrization

Run a test multiple times with different arguments.

```python
@pytest.mark.parametrize("input_a, input_b, expected", [
    (1, 2, 3),
    (5, 5, 10),
    (-1, 1, 0),
])
def test_add_params(input_a, input_b, expected):
    assert add(input_a, input_b) == expected
```

## Exception Handling

Testing that expected exceptions are raised.

```python
def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        1 / 0
```

## Markers

Mark tests to group them (e.g., slow, smoke).

```python
@pytest.mark.slow
def test_complex_operation():
    # ...
    pass
```

*Run with `pytest -m slow`*

## Useful Links

*   [pytest Documentation](https://docs.pytest.org/en/stable/)
*   [pytest Fixtures Guide](https://docs.pytest.org/en/stable/fixture.html)
