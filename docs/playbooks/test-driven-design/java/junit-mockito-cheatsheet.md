---
title: JUnit Mockito Templates & Cheatsheet
---

# JUnit Mockito Templates & Cheatsheet

## Quick Reference

### Common Imports

```java
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
```

## Plug-and-Play Templates

### Basic Mock Template

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void findUser_ValidId_ReturnsUser() {
        // Arrange
        User expectedUser = new User(1L, "John");
        when(userRepository.findById(1L)).thenReturn(expectedUser);
        
        // Act
        User result = userService.findUser(1L);
        
        // Assert
        assertEquals(expectedUser, result);
        verify(userRepository).findById(1L);
    }
}
```

### Mock with Argument Matchers

```java
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    
    @Mock
    private PaymentGateway paymentGateway;
    
    @InjectMocks
    private PaymentService paymentService;
    
    @Test
    void processPayment_AnyAmount_ReturnsSuccess() {
        // Arrange
        when(paymentGateway.process(any(BigDecimal.class))).thenReturn(true);
        
        // Act
        boolean result = paymentService.processPayment(new BigDecimal("100.00"));
        
        // Assert
        assertTrue(result);
        verify(paymentGateway).process(any(BigDecimal.class));
    }
    
    @Test
    void processPayment_SpecificAmount_ReturnsSuccess() {
        // Arrange
        when(paymentGateway.process(eq(new BigDecimal("100.00")))).thenReturn(true);
        
        // Act
        boolean result = paymentService.processPayment(new BigDecimal("100.00"));
        
        // Assert
        assertTrue(result);
    }
}
```

### Mock Exception Throwing

```java
@ExtendWith(MockitoExtension.class)
class DataServiceTest {
    
    @Mock
    private DatabaseConnection dbConnection;
    
    @InjectMocks
    private DataService dataService;
    
    @Test
    void saveData_ConnectionFails_ThrowsException() {
        // Arrange
        when(dbConnection.save(any())).thenThrow(new SQLException("Connection failed"));
        
        // Act & Assert
        assertThrows(SQLException.class, () -> {
            dataService.saveData(new Data());
        });
    }
}
```

### Mock Void Methods

```java
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private NotificationService notificationService;
    
    @Test
    void sendNotification_ValidEmail_SendsEmail() {
        // Arrange
        doNothing().when(emailService).send(anyString());
        
        // Act
        notificationService.sendNotification("user@example.com", "Hello");
        
        // Assert
        verify(emailService).send("user@example.com");
    }
    
    @Test
    void sendNotification_EmailFails_ThrowsException() {
        // Arrange
        doThrow(new RuntimeException("Email service unavailable"))
            .when(emailService).send(anyString());
        
        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            notificationService.sendNotification("user@example.com", "Hello");
        });
    }
}
```

### Mock with Multiple Calls

```java
@ExtendWith(MockitoExtension.class)
class CacheServiceTest {
    
    @Mock
    private Cache cache;
    
    @InjectMocks
    private CacheService cacheService;
    
    @Test
    void getValue_FirstCallMiss_SecondCallHit() {
        // Arrange
        when(cache.get("key"))
            .thenReturn(null)  // First call
            .thenReturn("value"); // Second call
        
        // Act
        String first = cacheService.getValue("key");
        String second = cacheService.getValue("key");
        
        // Assert
        assertNull(first);
        assertEquals("value", second);
        verify(cache, times(2)).get("key");
    }
}
```

### Spy Template (Partial Mocking)

```java
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    
    @Spy
    private OrderValidator orderValidator;
    
    @InjectMocks
    private OrderService orderService;
    
    @Test
    void processOrder_ValidOrder_ProcessesSuccessfully() {
        // Arrange
        Order order = new Order();
        doReturn(true).when(orderValidator).validate(order);
        
        // Act
        orderService.processOrder(order);
        
        // Assert
        verify(orderValidator).validate(order);
    }
}
```

### Verify Interactions Template

```java
@ExtendWith(MockitoExtension.class)
class ShoppingCartTest {
    
    @Mock
    private InventoryService inventoryService;
    
    @Mock
    private PaymentService paymentService;
    
    @InjectMocks
    private ShoppingCart shoppingCart;
    
    @Test
    void checkout_ValidCart_ProcessesCorrectly() {
        // Arrange
        when(inventoryService.isAvailable(anyString())).thenReturn(true);
        when(paymentService.charge(any())).thenReturn(true);
        
        // Act
        shoppingCart.addItem("item1");
        shoppingCart.checkout();
        
        // Assert
        verify(inventoryService).isAvailable("item1");
        verify(paymentService).charge(any());
        verify(inventoryService, never()).reserve(anyString());
    }
    
    @Test
    void checkout_InventoryUnavailable_NeverCharges() {
        // Arrange
        when(inventoryService.isAvailable(anyString())).thenReturn(false);
        
        // Act
        shoppingCart.addItem("item1");
        shoppingCart.checkout();
        
        // Assert
        verify(paymentService, never()).charge(any());
    }
}
```

### Argument Captor Template

```java
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentCaptor.forClass;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void createUser_ValidData_SavesWithCorrectData() {
        // Arrange
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        
        // Act
        userService.createUser("John", "john@example.com");
        
        // Assert
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("John", savedUser.getName());
        assertEquals("john@example.com", savedUser.getEmail());
    }
}
```

## Common Mockito Methods

### Stubbing (When-Then)

```java
// Return value
when(mock.method()).thenReturn(value);
when(mock.method(any())).thenReturn(value);

// Throw exception
when(mock.method()).thenThrow(new Exception());

// Multiple returns
when(mock.method())
    .thenReturn(value1)
    .thenReturn(value2);

// Call real method
when(mock.method()).thenCallRealMethod();
```

### Void Methods (Do-When)

```java
// Do nothing
doNothing().when(mock).voidMethod();

// Throw exception
doThrow(new Exception()).when(mock).voidMethod();

// Call real method
doCallRealMethod().when(mock).voidMethod();
```

### Verification

```java
// Verify method was called
verify(mock).method();

// Verify with arguments
verify(mock).method(arg);

// Verify number of calls
verify(mock, times(2)).method();
verify(mock, atLeastOnce()).method();
verify(mock, atMost(3)).method();
verify(mock, never()).method();

// Verify in order
InOrder inOrder = inOrder(mock1, mock2);
inOrder.verify(mock1).method1();
inOrder.verify(mock2).method2();
```

### Argument Matchers

```java
// Any value
any()
anyString()
anyInt()
anyList()
any(Class.class)

// Specific value
eq(value)
same(instance)

// Custom matcher
argThat(argument -> argument > 10)

// Null
isNull()
isNotNull()
```

## Steps to Run Tests

### Command Line (Maven)

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run specific test method
mvn test -Dtest=UserServiceTest#findUser_ValidId_ReturnsUser
```

### Command Line (Gradle)

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests UserServiceTest

# Run specific test method
./gradlew test --tests UserServiceTest.findUser_ValidId_ReturnsUser
```

### IDE (IntelliJ IDEA)

1. Right-click on test class → **Run 'TestClassName'**
2. Click green arrow next to test method
3. Use keyboard shortcut: `Ctrl+Shift+F10` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### IDE (Eclipse)

1. Right-click on test class → **Run As** → **JUnit Test**
2. Click green play button in toolbar

## Best Practices

- Use `@ExtendWith(MockitoExtension.class)` for JUnit 5
- Use `@Mock` for dependencies
- Use `@InjectMocks` for class under test
- Use `@Spy` sparingly (prefer mocks)
- Verify interactions when behavior matters
- Use argument matchers for flexibility
- Keep test setup in `@BeforeEach` when shared

## Useful Links

*   [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
*   [Mockito JUnit 5 Extension](https://javadoc.io/doc/org.mockito/mockito-junit-jupiter/latest/org/mockito/junit/jupiter/MockitoExtension.html)



