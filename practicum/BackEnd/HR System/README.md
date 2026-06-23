# HR System

## Backend

- ASP.NET Core Web API
- MongoDB

## Models

Employee
SystemModel

## DTOs

- EmployeeListItemDto
- EmployeeDetailsDto
- EmployeeAllocationDto
- SystemListItemDto
- SystemDetailsDto
- SystemAssignedEmployeeDto
- DashboardSummaryDto

## Rules

- Mongo Models store raw data only.
- Calculated fields are NOT stored in MongoDB.
- DTOs are implemented as records.

## Calculated Fields

- Gap
- RemainingMonths
- AvailabilityStatus
- CapacityStatus

## Future Improvements

- Manager entity
- DTO Mapping layer
- Filtering endpoints
