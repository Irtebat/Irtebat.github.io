---
title: Test-Driven Design Concepts (Python)
---

# Test-Driven Design Concepts (CliffNotes)

## Core Principles

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Improve code while keeping tests green

### Test-First Development

- Write tests before implementation
- Tests define expected behavior
- Implementation satisfies tests

## Key Concepts

### Unit Testing

- Test individual components in isolation
- Fast, repeatable, independent
- Mock external dependencies

### Test Isolation

- Each test should be independent
- No shared state between tests
- Tests can run in any order

### Arrange-Act-Assert (AAA) Pattern

```python
def test_example():
    # Arrange: Set up test data and dependencies
    a = 5
    b = 3
    
    # Act: Execute the code under test
    result = calculator.add(a, b)
    
    # Assert: Verify the outcome
    assert result == 8
```

### Test Coverage

- Aim for high coverage of critical paths
- Focus on behavior, not just lines of code
- Test edge cases and error conditions

### Mocking

- Replace dependencies with test doubles
- Control external behavior
- Verify interactions

### Test Naming

- Use descriptive names: `test_method_name_scenario_expected_result`
- Example: `test_calculate_total_with_discount_returns_discounted_price`
- Use `test_` prefix (required by pytest)

## Benefits

- **Confidence**: Refactor safely with test safety net
- **Documentation**: Tests serve as executable specifications
- **Design**: Forces better code structure and separation of concerns
- **Regression Prevention**: Catch bugs early

## Best Practices

- Keep tests simple and focused
- One assertion per test (when possible)
- Test behavior, not implementation
- Use meaningful test data
- Use fixtures for setup/teardown
- Use parametrization for similar test cases
- Keep tests fast and independent



