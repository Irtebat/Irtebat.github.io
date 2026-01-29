---
title: Python Test Setup
---

# Python Test Setup

## Installation

### Basic pytest

```bash
pip install pytest
```

### With Mocking Support

```bash
pip install pytest pytest-mock
```

### Using requirements.txt

```txt
pytest>=7.4.0
pytest-mock>=3.11.0
```

### Using pyproject.toml

```toml
[project]
dependencies = []

[project.optional-dependencies]
test = [
    "pytest>=7.4.0",
    "pytest-mock>=3.11.0",
]
```

Install with: `pip install -e ".[test]"`

## Common Imports

### pytest

```python
import pytest
```

### pytest-mock

```python
import pytest
# 'mocker' is a fixture, passed as argument, not imported
```

### Standard Library (unittest.mock)

```python
from unittest.mock import Mock, MagicMock, patch, PropertyMock
```

## Project Structure

```
project/
├── src/
│   └── calculator.py
├── tests/
│   ├── __init__.py
│   ├── test_calculator.py
│   └── conftest.py
└── pytest.ini
```

### Alternative Structure

```
project/
├── calculator.py
├── test_calculator.py
└── pytest.ini
```

## Configuration

### pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
```

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
]
```

## Virtual Environment Setup

### Using venv

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pytest pytest-mock
```

### Using virtualenv

```bash
virtualenv venv
source venv/bin/activate
pip install pytest pytest-mock
```

### Using conda

```bash
conda create -n test-env python=3.11
conda activate test-env
pip install pytest pytest-mock
```

## IDE Configuration

### VS Code

1. Install Python extension
2. Install pytest extension
3. Configure `settings.json`:
```json
{
    "python.testing.pytestEnabled": true,
    "python.testing.unittestEnabled": false
}
```

### PyCharm

1. Go to Settings → Tools → Python Integrated Tools
2. Set Default test runner to `pytest`
3. Configure test discovery patterns

### Running Tests in IDE

- **VS Code**: Click test icon in sidebar or use `Ctrl+Shift+P` → "Run Tests"
- **PyCharm**: Right-click test file → "Run 'pytest in test_file.py'"



