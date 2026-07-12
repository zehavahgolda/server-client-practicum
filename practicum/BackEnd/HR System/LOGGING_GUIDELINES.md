# Logging Standards

## Purpose

This document defines the logging standards used throughout the HR System project.

The goals of the logging system are:

- Provide clear visibility into application behavior.
- Simplify troubleshooting and production support.
- Maintain consistent logging across the entire project.
- Avoid logging unnecessary or sensitive information.

---

# Log Levels

## Information

Used for normal business operations.

Examples:

- Employee list requested.
- Employee created successfully.
- System updated successfully.
- Dashboard data loaded.

---

## Warning

Used for unusual situations where the application can continue working.

Examples:

- Employee not found.
- No employees matched the search filters.
- Requested system contains no allocations.

---

## Error

Used when an operation fails.

Examples:

- Failed to update employee.
- Failed to calculate dashboard statistics.
- MongoDB operation failed.

Always include the exception when available.

---

## Critical

Used only when the application cannot continue running.

Examples:

- Application startup failure.
- Database connection unavailable during startup.

---

## Debug

Used only during development.

Never use Debug logs for normal production monitoring.

---

# Structured Logging

Always use structured logging.

✔ Correct

```csharp
_logger.LogInformation(
    "Employee {EmployeeId} updated successfully.",
    employeeId);
```

❌ Incorrect

```csharp
_logger.LogInformation($"Employee {employeeId} updated.");
```

---

# Logging Rules

## Controllers

Log:

- Incoming requests.
- Invalid requests.
- Successful operations.
- Unexpected errors.

Do not log business logic.

---

## Services

Log:

- Business operations.
- Important business decisions.
- Successful completion.
- Warnings.
- Errors.

This is the primary layer for application logging.

---

## Repositories

Log only exceptional situations such as:

- Database failures.
- Connection problems.
- Timeouts.

Do not log every database query.

---

# Security Rules

Never log:

- Passwords.
- JWT tokens.
- Connection strings.
- Authorization headers.
- Sensitive personal information.

---

# Event ID Ranges

| Module | Range |
|---------|------:|
| Employees | 1000–1999 |
| Systems | 2000–2999 |
| Dashboard | 3000–3999 |
| Categories | 4000–4999 |
| Changes | 5000–5999 |

---

# Naming Convention

Use clear and concise messages.

Examples:

- Employee created successfully.
- Employee updated successfully.
- Employee deleted successfully.
- Employee not found.
- System allocation updated.
- Dashboard statistics calculated.

Avoid vague messages such as:

- Done.
- Success.
- Error occurred.
- Update completed.

---

# Checklist

Before adding a new log entry, verify:

- The correct log level is used.
- The message is clear and meaningful.
- Structured logging is used.
- No sensitive information is included.