---
title: Pytest Mocking Cheatsheet
---

# Pytest Mocking Cheatsheet

## Installation

Requires the `pytest-mock` plugin.

```bash
pip install pytest-mock
```

## Imports

```python
import pytest
from unittest.mock import MagicMock
# 'mocker' is a fixture, so it's passed as an argument, not imported.
```

## Basic Usage

Unlike Java frameworks (e.g., Mockito), **no annotations** (like `@Mock` or `@InjectMocks`) are required. 

You simply inject the `mocker` fixture into your test function.

```python
# Just add 'mocker' as an argument
def test_api_call(mocker):
    # Patch requests.get
    mock_get = mocker.patch("requests.get")
    
    # Configure return value
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"key": "value"}
    
    # Call function that uses requests.get
    result = my_api_function()
    
    assert result == True
    
    # Verify call
    mock_get.assert_called_once_with("https://api.example.com/data")
```

## Mocking Classes

```python
def test_class_method(mocker):
    # Patch the class
    mock_class = mocker.patch("my_module.MyClass")
    
    # Configure instance method return value
    mock_instance = mock_class.return_value
    mock_instance.my_method.return_value = "mocked value"
    
    # Use the class
    obj = MyClass()
    result = obj.my_method()
    
    assert result == "mocked value"
```

## Spy on Objects

Wrap an existing object to track calls without replacing it completely.

```python
def test_spy(mocker):
    # Spy on a method
    spy = mocker.spy(MyClass, "my_method")
    
    obj = MyClass()
    obj.my_method("arg")
    
    # Verify call
    spy.assert_called_once_with("arg")
    
    # The original method WAS executed
```

## Mocking Properties

```python
def test_property(mocker):
    mock = mocker.patch("my_module.MyClass.my_property", new_callable=mocker.PropertyMock)
    mock.return_value = 42
    
    obj = MyClass()
    assert obj.my_property == 42
```

## Mocking Builtins

```python
def test_open(mocker):
    mocker.patch("builtins.open", mocker.mock_open(read_data="data"))
    
    with open("file.txt") as f:
        result = f.read()
    
    assert result == "data"
```

## Async Mocking

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_function(mocker):
    future = asyncio.Future()
    future.set_result("mocked result")
    
    mocker.patch("my_module.async_function", return_value=future)
    
    result = await my_module.async_function()
    assert result == "mocked result"
```

## Useful Links

*   [pytest-mock Documentation](https://pytest-mock.readthedocs.io/en/latest/)
*   [unittest.mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
