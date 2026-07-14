# Frontend Logging Guidelines

## Purpose

The logging system provides a consistent way to record important events, warnings, and errors across the frontend application.

Its goals are:

- Help diagnose production issues.
- Improve debugging during development.
- Record important business operations.
- Keep logging consistent across the project.

---

# General Rules

## Use the central logger only

Do not use:

```ts
console.log(...)
console.info(...)
console.warn(...)
console.error(...)
```

Always use:

```ts
logger.debug(...)
logger.info(...)
logger.warn(...)
logger.error(...)
```

---

## Language

All log messages must be written in English.

Example:

```text
Failed to load employees
```

---

## Log Levels

### DEBUG

Development information only.

Examples:

- Loading employees
- Refreshing dashboard

---

### INFO

Successful business operations.

Examples:

- Employee created
- Employee updated
- Allocation added

---

### WARN

Unexpected situations that do not stop the application.

Examples:

- Employee capacity exceeded
- Partial dashboard data loaded

---

### ERROR

Operations that failed.

Examples:

- Failed to load employees
- Failed to update employee
- Failed to load systems

---

## Context

Every log should include a context object whenever possible.

Minimum:

```ts
{
    feature: "...",
    action: "..."
}
```

Optional fields:

- entityId
- employeeId
- systemId
- filters

---

## Sensitive Information

Never log:

- Passwords
- Tokens
- Authorization headers
- Cookies
- Personal information that is not required for troubleshooting

---

## Golden Rule

Every log should help answer this question:

> Will this information help diagnose a problem several months from now?

If the answer is no, the log probably should not exist.