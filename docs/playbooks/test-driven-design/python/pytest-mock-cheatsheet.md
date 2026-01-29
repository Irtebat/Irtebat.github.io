---
title: pytest-mock Templates & Cheatsheet
---

# pytest-mock Templates & Cheatsheet

## Quick Reference

### Common Imports

```python
import pytest
# 'mocker' is a fixture, passed as argument, not imported
```

## Plug-and-Play Templates

### Basic Mock Template

```python
import pytest

def test_api_call(mocker):
    # Arrange
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"key": "value"}
    
    # Act
    result = fetch_data_from_api()
    
    # Assert
    assert result == {"key": "value"}
    mock_get.assert_called_once_with("https://api.example.com/data")
```

### Mock Function Template

```python
import pytest

def test_calculate_total(mocker):
    # Arrange
    mock_discount = mocker.patch("calculator.calculate_discount")
    mock_discount.return_value = 10.0
    
    # Act
    total = calculate_total(100.0)
    
    # Assert
    assert total == 90.0
    mock_discount.assert_called_once_with(100.0)
```

### Mock Class Template

```python
import pytest

def test_user_service(mocker):
    # Arrange
    mock_repository = mocker.patch("services.UserRepository")
    mock_user = mock_repository.return_value
    mock_user.find_by_id.return_value = {"id": 1, "name": "John"}
    
    # Act
    user_service = UserService()
    user = user_service.get_user(1)
    
    # Assert
    assert user["name"] == "John"
    mock_repository.assert_called_once()
```

### Mock Exception Template

```python
import pytest

def test_handles_exception(mocker):
    # Arrange
    mock_connection = mocker.patch("database.get_connection")
    mock_connection.side_effect = ConnectionError("Database unavailable")
    
    # Act & Assert
    with pytest.raises(ConnectionError) as exc_info:
        connect_to_database()
    
    assert "Database unavailable" in str(exc_info.value)
```

### Mock Multiple Calls Template

```python
import pytest

def test_retry_mechanism(mocker):
    # Arrange
    mock_api = mocker.patch("api.call_external_api")
    mock_api.side_effect = [
        TimeoutError("First call failed"),
        {"status": "success"}  # Second call succeeds
    ]
    
    # Act
    result = retry_api_call()
    
    # Assert
    assert result["status"] == "success"
    assert mock_api.call_count == 2
```

### Spy Template (Track Real Calls)

```python
import pytest

def test_spy_on_method(mocker):
    # Arrange
    calculator = Calculator()
    spy_add = mocker.spy(calculator, "add")
    
    # Act
    result = calculator.calculate_total(5, 3)
    
    # Assert
    spy_add.assert_called_once_with(5, 3)
    assert result == 8  # Real method was executed
```

### Mock Property Template

```python
import pytest

def test_property_access(mocker):
    # Arrange
    mock_property = mocker.patch(
        "models.User.email",
        new_callable=mocker.PropertyMock
    )
    mock_property.return_value = "test@example.com"
    
    # Act
    user = User()
    email = user.email
    
    # Assert
    assert email == "test@example.com"
```

### Mock Context Manager Template

```python
import pytest

def test_file_operations(mocker):
    # Arrange
    mock_open = mocker.patch("builtins.open", mocker.mock_open(read_data="file content"))
    
    # Act
    with open("test.txt", "r") as f:
        content = f.read()
    
    # Assert
    assert content == "file content"
    mock_open.assert_called_once_with("test.txt", "r")
```

### Mock Async Function Template

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_function(mocker):
    # Arrange
    future = asyncio.Future()
    future.set_result({"data": "result"})
    
    mock_async = mocker.patch("api.async_fetch_data", return_value=future)
    
    # Act
    result = await fetch_data_async()
    
    # Assert
    assert result == {"data": "result"}
    mock_async.assert_called_once()
```

### Mock with Argument Matching

```python
import pytest
from unittest.mock import ANY

def test_with_any_argument(mocker):
    # Arrange
    mock_save = mocker.patch("database.save")
    
    # Act
    save_user_data({"name": "John"})
    
    # Assert
    mock_save.assert_called_once_with(ANY)
```

### Verify Call Arguments Template

```python
import pytest

def test_verify_call_details(mocker):
    # Arrange
    mock_send = mocker.patch("email.send_email")
    
    # Act
    send_notification("user@example.com", "Hello")
    
    # Assert
    mock_send.assert_called_once()
    call_args = mock_send.call_args
    assert call_args[0][0] == "user@example.com"
    assert "Hello" in call_args[0][1]
```

### Mock Multiple Functions Template

```python
import pytest

def test_multiple_mocks(mocker):
    # Arrange
    mock_db = mocker.patch("database.save")
    mock_logger = mocker.patch("logger.log")
    mock_email = mocker.patch("email.send")
    
    # Act
    process_order({"id": 1, "total": 100})
    
    # Assert
    mock_db.assert_called_once()
    mock_logger.assert_called()
    mock_email.assert_called_once()
```

## Common Mock Methods

### Stubbing Return Values

```python
# Single return value
mock.return_value = value

# Multiple return values (sequential calls)
mock.side_effect = [value1, value2, value3]

# Exception on call
mock.side_effect = Exception("Error message")

# Call real function
mock.side_effect = lambda *args, **kwargs: real_function(*args, **kwargs)
```

### Verification

```python
# Verify called
mock.assert_called()

# Verify called once
mock.assert_called_once()

# Verify called with specific args
mock.assert_called_with(arg1, arg2)

# Verify called once with args
mock.assert_called_once_with(arg1, arg2)

# Verify number of calls
assert mock.call_count == 2

# Verify not called
mock.assert_not_called()

# Get call arguments
args, kwargs = mock.call_args
```

### Advanced Mocking

```python
# Mock with return value
mock = mocker.patch("module.function", return_value=42)

# Mock with side effect
mock = mocker.patch("module.function", side_effect=Exception())

# Mock with callable
mock = mocker.patch("module.function", side_effect=lambda x: x * 2)

# Mock property
mock = mocker.patch("module.Class.property", new_callable=mocker.PropertyMock)
mock.return_value = "value"
```

## Steps to Run Tests

### Command Line

```bash
# Run all tests
pytest

# Run specific test file
pytest test_api.py

# Run specific test function
pytest test_api.py::test_api_call

# Run with verbose output
pytest -v

# Show print statements
pytest -s

# Run last failed tests
pytest --lf
```

### Running Mock Tests

```bash
# Run all mock-related tests
pytest -k "mock"

# Run specific mock test
pytest test_api.py::test_api_call

# Run with coverage
pytest --cov=src test_api.py
```

### IDE (VS Code)

1. Click test icon in sidebar
2. Click play button next to test
3. Use `Ctrl+Shift+P` → "Run Tests"

### IDE (PyCharm)

1. Right-click test file → "Run 'pytest in test_file.py'"
2. Click green arrow next to test function
3. Use `Ctrl+Shift+F10` (Windows/Linux) or `Cmd+Shift+R` (Mac)

## Best Practices

- Use `mocker` fixture (from pytest-mock) instead of `unittest.mock.patch`
- Mock at the point of use, not at definition
- Use `mocker.spy()` to verify real method calls
- Use `mocker.patch.object()` for instance methods
- Verify mock calls to ensure correct behavior
- Use `side_effect` for exceptions or multiple return values
- Clean up mocks automatically (handled by pytest-mock)

## Common Patterns

### Mock External API

```python
def test_external_api(mocker):
    mock_response = mocker.Mock()
    mock_response.json.return_value = {"data": "value"}
    mock_response.status_code = 200
    
    mocker.patch("requests.get", return_value=mock_response)
    
    result = call_external_api()
    assert result == {"data": "value"}
```

### Mock Database

```python
def test_database_query(mocker):
    mock_db = mocker.patch("database.get_connection")
    mock_cursor = mock_db.return_value.cursor.return_value
    mock_cursor.fetchall.return_value = [{"id": 1, "name": "John"}]
    
    results = query_users()
    assert len(results) == 1
```

### Mock File Operations

```python
def test_read_file(mocker):
    mocker.patch("builtins.open", mocker.mock_open(read_data="file content"))
    
    content = read_file("test.txt")
    assert content == "file content"
```

## Useful Links

*   [pytest-mock Documentation](https://pytest-mock.readthedocs.io/en/latest/)
*   [unittest.mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
