---
title: JUnit 5 Cheatsheet
description: A quick reference for testing with JUnit 5.
sidebar_label: JUnit 5
---

# JUnit 5 Cheatsheet

## Adding JUnit 5 Dependency

### Maven

Add the following to your `pom.xml`:

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
```

### Gradle

Add the following to your `build.gradle`:

```groovy
test {
    useJUnitPlatform()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

## Imports

Common imports used in JUnit 5 tests.

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.*;
```

## Basic Annotations

| Annotation | Description |
| :--- | :--- |
| `@Test` | Denotes that a method is a test method. |
| `@BeforeEach` | Executed before each `@Test` method. |
| `@AfterEach` | Executed after each `@Test` method. |
| `@BeforeAll` | Executed once before all test methods in the class (must be static). |
| `@AfterAll` | Executed once after all test methods in the class (must be static). |
| `@Disabled` | Disables a test class or method. |
| `@DisplayName` | Declares a custom display name for the test class or method. |

## Assertions (Assertions class)

All assertions are static methods in `org.junit.jupiter.api.Assertions`.

```java
@Test
void testAssertions() {
    assertEquals(4, 2 + 2, "Optional failure message");
    assertNotEquals(3, 2 + 2);
    
    assertTrue(5 > 4);
    assertFalse(5 < 4);
    
    assertNull(null);
    assertNotNull("value");
    
    assertSame(obj1, obj1); // Checks reference identity
    assertNotSame(obj1, obj2);
    
    assertArrayEquals(new int[]{1, 2}, new int[]{1, 2});
    
    // Check for Exceptions
    assertThrows(IllegalArgumentException.class, () -> {
        throw new IllegalArgumentException("Error");
    });
    
    // Grouped Assertions (all executed even if one fails)
    assertAll("person",
        () -> assertEquals("John", person.getFirstName()),
        () -> assertEquals("Doe", person.getLastName())
    );
}
```

## Assumptions (Assumptions class)

Used to abort tests if conditions are not met (e.g., integration tests depending on environment).

```java
@Test
void testOnlyOnCiServer() {
    assumeTrue(System.getenv("CI") != null);
    // remainder of test...
}
```

## Parameterized Tests

Requires `junit-jupiter-params` dependency.

### Single Parameter

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@ParameterizedTest
@ValueSource(strings = { "racecar", "radar", "able was I ere I saw elba" })
void palindromes(String candidate) {
    assertTrue(StringUtils.isPalindrome(candidate));
}
```

### Multiple Parameters (CSV)

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@ParameterizedTest
@CsvSource({
    "apple,         5",
    "banana,        6",
    "'lemon, lime', 10"
})
void testWithCsvSource(String fruit, int rank) {
    assertNotNull(fruit);
    assertNotEquals(0, rank);
}
```

### Multiple Parameters (Method Source)

For more complex data, use a method source.

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import java.util.stream.Stream;

@ParameterizedTest
@MethodSource("provideStringsForIsBlank")
void isBlank_ShouldReturnTrueForNullOrBlankStrings(String input, boolean expected) {
    assertEquals(expected, Strings.isBlank(input));
}

private static Stream<Arguments> provideStringsForIsBlank() {
    return Stream.of(
      Arguments.of(null, true),
      Arguments.of("", true),
      Arguments.of("  ", true),
      Arguments.of("not blank", false)
    );
}
```

## Useful Links

*   [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
*   [JUnit 5 Annotations Reference](https://junit.org/junit5/docs/current/user-guide/#writing-tests-annotations)
*   [JUnit 5 Parameterized Tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests)
