---
title: Java Exception Handling Cheatsheet
description: A quick reference for handling exceptions in Java.
sidebar_label: Exception Handling
---


# Java Exception Handling Cheatsheet

## Imports

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.sql.SQLException;
```

## Try-Catch-Finally Block

```java
try {
    // Code that might throw an exception
    int result = 10 / 0;
} catch (ArithmeticException e) {
    // Handle specific exception
    System.err.println("Cannot divide by zero: " + e.getMessage());
} catch (Exception e) {
    // Handle general exception
    System.err.println("An error occurred: " + e.getMessage());
} finally {
    // Code that always runs (cleanup)
    System.out.println("Execution finished.");
}
```

## Try-with-Resources (Java 7+)

Automatically closes resources that implement `AutoCloseable`.

```java
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    System.out.println(br.readLine());
} catch (IOException e) {
    e.printStackTrace();
}
```

## Throwing Exceptions

```java
public void validateAge(int age) {
    if (age < 18) {
        throw new IllegalArgumentException("Age must be at least 18");
    }
}
```

## Custom Exceptions

```java
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}
```

## Common Exceptions Reference

| Exception | Description | Type |
| :--- | :--- | :--- |
| `NullPointerException` | Attempt to access a member of a null object. | Unchecked |
| `ArrayIndexOutOfBoundsException` | Accessing an array with an invalid index. | Unchecked |
| `IllegalArgumentException` | Passing an illegal or inappropriate argument to a method. | Unchecked |
| `IllegalStateException` | Invoking a method at an illegal or inappropriate time. | Unchecked |
| `NumberFormatException` | Attempt to convert a string to a numeric type, but the format is invalid. | Unchecked |
| `IOException` | General class of exceptions produced by failed or interrupted I/O operations. | Checked |
| `FileNotFoundException` | Attempt to open the file denoted by a specified pathname has failed. | Checked |
| `SQLException` | An error occurred while accessing a database. | Checked |
| `ClassNotFoundException` | Application tries to load in a class through its string name but no definition for the class with the specified name could be found. | Checked |
| `InterruptedException` | A thread is waiting, sleeping, or otherwise occupied, and the thread is interrupted. | Checked |

## Best Practices

1.  **Catch specific exceptions** before general ones.
2.  **Don't swallow exceptions** (empty catch blocks). At least log them.
3.  **Use unchecked exceptions** for programming errors (bugs).
4.  **Use checked exceptions** for recoverable conditions (e.g., file not found).
5.  **Clean up resources** in `finally` or use try-with-resources.

## Useful Links

*   [Oracle Java Exceptions Tutorial](https://docs.oracle.com/javase/tutorial/essential/exceptions/)
*   [Baeldung: Java Exceptions](https://www.baeldung.com/java-exceptions)
*   [Effective Java: Exceptions](https://ahdak.github.io/blog/effective-java-part-9/)
