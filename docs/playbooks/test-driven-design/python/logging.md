---
title: Python Logging Cheatsheet
---

# Python Logging Cheatsheet

## Dependencies

The `logging` module is part of the standard library, so **no external dependency** is required for basic usage.

However, for advanced features or specific handlers, you might install additional packages (e.g., for logging to AWS CloudWatch or structured logging).

```bash
# No install needed for standard logging
import logging
```

## Imports

```python
import logging
import logging.config
```

## Basic Usage

```python
import logging

# Basic configuration (only needs to be done once)
logging.basicConfig(level=logging.INFO)

logging.debug("This is a debug message")
logging.info("This is an info message")
logging.warning("This is a warning message")
logging.error("This is an error message")
logging.critical("This is a critical message")
```

## Log Levels

| Level | Numeric Value | Description |
| :--- | :--- | :--- |
| `DEBUG` | 10 | Detailed information, typically of interest only when diagnosing problems. |
| `INFO` | 20 | Confirmation that things are working as expected. |
| `WARNING` | 30 | An indication that something unexpected happened, or indicative of some problem in the near future (e.g. ‘disk space low’). The software is still working as expected. |
| `ERROR` | 40 | Due to a more serious problem, the software has not been able to perform some function. |
| `CRITICAL` | 50 | A serious error, indicating that the program itself may be unable to continue running. |

## Advanced Configuration

Creating specific loggers and handlers allows for more control (e.g., logging to file and console).

```python
import logging

# Create a custom logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create handlers
c_handler = logging.StreamHandler() # Console
f_handler = logging.FileHandler('file.log') # File
c_handler.setLevel(logging.WARNING)
f_handler.setLevel(logging.ERROR)

# Create formatters and add it to handlers
c_format = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
c_handler.setFormatter(c_format)
f_handler.setFormatter(f_format)

# Add handlers to the logger
logger.addHandler(c_handler)
logger.addHandler(f_handler)

logger.warning('This is a warning')
logger.error('This is an error')
```

## Logging Exceptions

Use `logger.exception` inside an `except` block to automatically include the stack trace.

```python
try:
    1 / 0
except ZeroDivisionError:
    logging.exception("Something went wrong")
```

## Logging Variable Data

Use string formatting style (using `%s`) which is lazily evaluated (better performance).

```python
name = "John"
logging.info("User %s logged in", name)
```

## Configuration via Dictionary/File

You can configure logging using a dictionary or a configuration file (INI, YAML).

```python
import logging.config

config = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}

logging.config.dictConfig(config)
```

## Useful Links

*   [Python Logging HOWTO](https://docs.python.org/3/howto/logging.html)
*   [Python Logging Cookbook](https://docs.python.org/3/howto/logging-cookbook.html)
