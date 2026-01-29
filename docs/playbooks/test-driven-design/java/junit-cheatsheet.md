---
title: JUnit 5 Templates & Cheatsheet
---

# JUnit 5 Templates & Cheatsheet

## Quick Reference

### Common Imports

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
```

## Plug-and-Play Templates

### Basic Test Template

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    
    @Test
    @DisplayName("Should add two numbers correctly")
    void add_TwoNumbers_ReturnsSum() {
        // Arrange
        Calculator calculator = new Calculator();
        int a = 5;
        int b = 3;
        
        // Act
        int result = calculator.add(a, b);
        
        // Assert
        assertEquals(8, result);
    }
}
```

### Test with Setup/Teardown

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseTest {
    private Database db;
    
    @BeforeEach
    void setUp() {
        db = new Database();
        db.connect();
    }
    
    @AfterEach
    void tearDown() {
        db.disconnect();
    }
    
    @Test
    void testQuery() {
        // Test implementation
        assertNotNull(db.query("SELECT * FROM users"));
    }
}
```

### Exception Testing Template

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ValidatorTest {
    
    @Test
    @DisplayName("Should throw exception for invalid input")
    void validate_InvalidInput_ThrowsException() {
        // Arrange
        Validator validator = new Validator();
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            validator.validate(null);
        });
        
        // Verify exception message
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            validator.validate("");
        });
        assertEquals("Input cannot be empty", exception.getMessage());
    }
}
```

### Parameterized Test Template

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class StringUtilsTest {
    
    @ParameterizedTest
    @ValueSource(strings = {"racecar", "radar", "level"})
    void isPalindrome_ValidPalindromes_ReturnsTrue(String input) {
        assertTrue(StringUtils.isPalindrome(input));
    }
    
    @ParameterizedTest
    @CsvSource({
        "2, 3, 5",
        "10, 20, 30",
        "-5, 5, 0"
    })
    void add_TwoNumbers_ReturnsSum(int a, int b, int expected) {
        Calculator calc = new Calculator();
        assertEquals(expected, calc.add(a, b));
    }
}
```

### Multiple Assertions Template

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PersonTest {
    
    @Test
    void createPerson_ValidData_AllFieldsSet() {
        // Arrange
        Person person = new Person("John", "Doe", 30);
        
        // Assert - All assertions run even if one fails
        assertAll("person",
            () -> assertEquals("John", person.getFirstName()),
            () -> assertEquals("Doe", person.getLastName()),
            () -> assertEquals(30, person.getAge())
        );
    }
}
```

### Test with Assumptions

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assumptions.*;
import static org.junit.jupiter.api.Assertions.*;

class IntegrationTest {
    
    @Test
    void testOnlyOnCiServer() {
        // Skip test if condition not met
        assumeTrue(System.getenv("CI") != null);
        
        // Test implementation
        assertTrue(true);
    }
}
```

## Common Assertions

```java
// Equality
assertEquals(expected, actual);
assertEquals(expected, actual, "Custom message");
assertNotEquals(unexpected, actual);

// Boolean
assertTrue(condition);
assertFalse(condition);

// Null checks
assertNull(value);
assertNotNull(value);

// Object identity
assertSame(expected, actual);
assertNotSame(unexpected, actual);

// Arrays
assertArrayEquals(expectedArray, actualArray);

// Exceptions
assertThrows(ExceptionClass.class, () -> {
    // code that throws exception
});

// Multiple assertions
assertAll("group name",
    () -> assertEquals(1, value1),
    () -> assertEquals(2, value2)
);
```

## Steps to Run Tests

### Command Line (Maven)

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=CalculatorTest

# Run specific test method
mvn test -Dtest=CalculatorTest#add_TwoNumbers_ReturnsSum

# Run with verbose output
mvn test -X
```

### Command Line (Gradle)

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests CalculatorTest

# Run specific test method
./gradlew test --tests CalculatorTest.add_TwoNumbers_ReturnsSum

# Run with verbose output
./gradlew test --info
```

### IDE (IntelliJ IDEA)

1. Right-click on test class → **Run 'TestClassName'**
2. Click green arrow next to test method
3. Use keyboard shortcut: `Ctrl+Shift+F10` (Windows/Linux) or `Cmd+Shift+R` (Mac)
4. Run all tests: `Ctrl+Shift+F10` on test directory

### IDE (Eclipse)

1. Right-click on test class → **Run As** → **JUnit Test**
2. Click green play button in toolbar
3. Use keyboard shortcut: `Alt+Shift+X, T`

## Annotations Reference

| Annotation | Description |
| :--- | :--- |
| `@Test` | Marks a method as a test method |
| `@BeforeEach` | Executed before each test method |
| `@AfterEach` | Executed after each test method |
| `@BeforeAll` | Executed once before all tests (must be static) |
| `@AfterAll` | Executed once after all tests (must be static) |
| `@DisplayName` | Custom display name for test |
| `@Disabled` | Disables a test |
| `@ParameterizedTest` | Marks a parameterized test |
| `@ValueSource` | Provides single parameter values |
| `@CsvSource` | Provides CSV parameter values |

## Useful Links

*   [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
*   [JUnit 5 Annotations Reference](https://junit.org/junit5/docs/current/user-guide/#writing-tests-annotations)
*   [JUnit 5 Parameterized Tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests)
