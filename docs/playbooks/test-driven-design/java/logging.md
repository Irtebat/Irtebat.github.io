---
title: Java Logging Cheatsheet
---

# Java Logging Cheatsheet

Java has multiple logging frameworks. The industry standard is to use **SLF4J** (Simple Logging Facade for Java) as an abstraction layer, backed by an implementation like **Logback** (Spring Boot default) or **Log4j2**.

## Dependencies (Logback)

When you include `logback-classic`, it **automatically pulls in `slf4j-api`** as a transitive dependency. You do not need to explicitly add SLF4J unless you need a specific version.

### Maven

Add the following to your `pom.xml`:

```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.4.11</version>
</dependency>
```

### Gradle

Add the following to your `build.gradle`:

```groovy
implementation 'ch.qos.logback:logback-classic:1.4.11'
```

## Lombok Dependency

To use the `@Slf4j` annotation, you need to add Lombok to your project.

### Maven

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <scope>provided</scope>
</dependency>
```

### Gradle

```groovy
compileOnly 'org.projectlombok:lombok:1.18.30'
annotationProcessor 'org.projectlombok:lombok:1.18.30'
```

## SLF4J Usage

Code usage:
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;

public class MyClass {
    private static final Logger logger = LoggerFactory.getLogger(MyClass.class);

    public void doSomething() {
        logger.info("Operation started");
        
        try {
            // ...
        } catch (Exception e) {
            logger.error("Operation failed", e);
        }
    }
}
```

## Lombok Integration

If you use Lombok, you can skip the boilerplate logger creation.

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MyClass {
    public void doSomething() {
        log.info("This is easy!");
    }
}
```

## Log Levels

*   **TRACE**: Finer-grained informational events than DEBUG.
*   **DEBUG**: Fine-grained informational events that are most useful to debug an application.
*   **INFO**: Informational messages that highlight the progress of the application at coarse-grained level.
*   **WARN**: Potentially harmful situations.
*   **ERROR**: Error events that might still allow the application to continue running.

## Parameterized Logging

SLF4J supports parameterized messages using `{}`. This avoids string concatenation overhead if the log level is disabled.

```java
String userId = "user123";
int attempts = 3;

// Good (Lazy evaluation)
logger.info("User {} failed to login after {} attempts", userId, attempts);

// Bad (String concatenation happens even if INFO is disabled)
logger.info("User " + userId + " failed to login after " + attempts + " attempts");
```

## Logging Exceptions

Always pass the exception object as the **last argument** to log the stack trace.

```java
try {
    // ...
} catch (IOException e) {
    // Correct: logs message + stack trace
    logger.error("Failed to read file", e);
    
    // Incorrect: logs e.toString() but no stack trace
    logger.error("Failed to read file: " + e); 
}
```

## Configuration (logback.xml)

Place `logback.xml` in `src/main/resources`.

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="info">
        <appender-ref ref="STDOUT" />
    </root>
    
    <!-- Set specific package to DEBUG -->
    <logger name="com.myapp.internal" level="debug"/>
</configuration>
```

## Useful Links

*   [SLF4J Manual](https://www.slf4j.org/manual.html)
*   [Logback Manual](https://logback.qos.ch/manual/index.html)
*   [Baeldung: Java Logging Guide](https://www.baeldung.com/java-logging-intro)
