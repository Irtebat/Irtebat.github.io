---
title: pytest Templates & Cheatsheet
---

# pytest Templates & Cheatsheet

## Quick Reference

### Common Imports

```python
import pytest
```

## Plug-and-Play Templates

### Basic Test Template

```python
# test_calculator.py

def add(x, y):
    return x + y

def test_add_two_numbers_returns_sum():
    # Arrange
    a = 5
    b = 3
    
    # Act
    result = add(a, b)
    
    # Assert
    assert result == 8
```

### Test with Fixtures

```python
import pytest

@pytest.fixture
def sample_data():
    return {"a": 1, "b": 2, "c": 3}

def test_with_fixture(sample_data):
    # Arrange & Act
    total = sum(sample_data.values())
    
    # Assert
    assert total == 6
```

### Test with Setup/Teardown Fixture

```python
import pytest

@pytest.fixture
def database():
    # Setup
    db = connect_to_database()
    yield db
    # Teardown
    db.close()

def test_query_database(database):
    # Arrange & Act
    result = database.query("SELECT * FROM users")
    
    # Assert
    assert result is not None
```

### Exception Testing Template

```python
import pytest

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def test_divide_by_zero_raises_exception():
    # Arrange
    a = 10
    b = 0
    
    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        divide(a, b)
    
    assert "Cannot divide by zero" in str(exc_info.value)
```

### Parameterized Test Template

```python
import pytest

def add(x, y):
    return x + y

@pytest.mark.parametrize("a, b, expected", [
    (1, 2, 3),
    (5, 5, 10),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add_multiple_cases(a, b, expected):
    # Act
    result = add(a, b)
    
    # Assert
    assert result == expected
```

### Test with Markers

```python
import pytest

@pytest.mark.slow
def test_complex_operation():
    # This test takes a long time
    result = perform_complex_calculation()
    assert result is not None

@pytest.mark.integration
def test_api_integration():
    # This test requires external API
    response = call_external_api()
    assert response.status_code == 200
```

### Test Class Template

```python
import pytest

class TestCalculator:
    
    def setup_method(self):
        """Called before each test method"""
        self.calculator = Calculator()
    
    def teardown_method(self):
        """Called after each test method"""
        self.calculator = None
    
    def test_add(self):
        assert self.calculator.add(2, 3) == 5
    
    def test_subtract(self):
        assert self.calculator.subtract(5, 2) == 3
```

### Fixture with Scope

```python
import pytest

@pytest.fixture(scope="module")
def shared_resource():
    """Created once per test module"""
    resource = initialize_expensive_resource()
    yield resource
    resource.cleanup()

@pytest.fixture(scope="session")
def database_connection():
    """Created once per test session"""
    conn = create_database_connection()
    yield conn
    conn.close()
```

### Test with Multiple Fixtures

```python
import pytest

@pytest.fixture
def user():
    return {"name": "John", "email": "john@example.com"}

@pytest.fixture
def permissions():
    return ["read", "write"]

def test_user_with_permissions(user, permissions):
    # Arrange
    user["permissions"] = permissions
    
    # Act
    has_access = check_access(user)
    
    # Assert
    assert has_access is True
```

### Test with conftest.py

```python
# conftest.py (shared fixtures)
import pytest

@pytest.fixture
def api_client():
    return APIClient()

# test_api.py
def test_api_call(api_client):
    response = api_client.get("/users")
    assert response.status_code == 200
```

## Common Assertions

```python
# Equality
assert value == expected
assert value != unexpected

# Comparison
assert value > threshold
assert value < threshold
assert value >= threshold
assert value <= threshold

# Membership
assert item in collection
assert item not in collection

# Type checking
assert isinstance(obj, MyClass)
assert type(obj) == MyClass

# Truthiness
assert value is True
assert value is False
assert value  # Truthy
assert not value  # Falsy

# None checks
assert value is None
assert value is not None

# Exceptions
with pytest.raises(ValueError):
    function_that_raises()

# Approximate equality (for floats)
assert value == pytest.approx(expected, rel=0.01)
```

## Steps to Run Tests

### Command Line

```bash
# Run all tests in current directory and subdirectories
pytest

# Run tests in specific file
pytest test_calculator.py

# Run specific test function
pytest test_calculator.py::test_add

# Run tests matching pattern
pytest -k "add"

# Run tests with specific marker
pytest -m slow

# Run with verbose output
pytest -v

# Run with extra verbose output
pytest -vv

# Show print statements
pytest -s

# Show local variables on failure
pytest -l

# Run last failed tests only
pytest --lf

# Run failed tests first, then rest
pytest --ff

# Stop on first failure
pytest -x

# Stop after N failures
pytest --maxfail=3

# Show coverage report
pytest --cov=src --cov-report=html
```

### Running Specific Tests

```bash
# Run test class
pytest test_calculator.py::TestCalculator

# Run test method in class
pytest test_calculator.py::TestCalculator::test_add

# Run tests in directory
pytest tests/integration/

# Run tests matching name pattern
pytest -k "test_add or test_subtract"
```

### With Markers

```bash
# Run only slow tests
pytest -m slow

# Run all except slow tests
pytest -m "not slow"

# Run integration tests
pytest -m integration

# Run multiple markers
pytest -m "slow and integration"
```

## Fixture Scopes

| Scope | Description | When to Use |
| :--- | :--- | :--- |
| `function` | Default. Run once per test function | Most common case |
| `class` | Run once per test class | Shared setup for class tests |
| `module` | Run once per test module | Expensive setup shared across tests |
| `session` | Run once per test session | Database connections, API clients |

## Annotations & Decorators

| Decorator | Description |
| :--- | :--- |
| `@pytest.fixture` | Marks a function as a fixture |
| `@pytest.mark.parametrize` | Parameterizes a test function |
| `@pytest.mark.skip` | Skips a test |
| `@pytest.mark.skipif` | Conditionally skips a test |
| `@pytest.mark.xfail` | Marks test as expected to fail |
| `@pytest.mark.slow` | Custom marker (requires registration) |

## Useful Links

*   [pytest Documentation](https://docs.pytest.org/en/stable/)
*   [pytest Fixtures Guide](https://docs.pytest.org/en/stable/fixture.html)
*   [pytest Parametrization](https://docs.pytest.org/en/stable/how-to/parametrize.html)
