using AutoMapper;
using HR_System.DTOs.Employees;
using HR_System.DTOs.Systems;
using HR_System.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HR_System.Services
{
    public class AutoMappering : Profile
    {
        public AutoMappering()
        {
            // =========================================================================
            // 1. מיפוי עבור רשימת העובדים (EmployeeListItemDto) - סופר קריא ומובן!
            // =========================================================================
            CreateMap<Employee, EmployeeListItemDto>()
                .ForCtorParam("AllocatedMonths", opt => opt.MapFrom(src => GetAllocatedMonths(src)))
                .ForCtorParam("RemainingMonths", opt => opt.MapFrom(src => GetRemainingMonths(src)))
                .ForCtorParam("AvailabilityStatus", opt => opt.MapFrom(src => GetAvailabilityStatus(src)))
                .ForCtorParam("AssignedSystemsCount", opt => opt.MapFrom(src => GetAssignedSystemsCount(src)));

            // =========================================================================
            // 2. מיפוי עבור פרטי עובד מלאים (EmployeeDetailsDto)
            // =========================================================================
            CreateMap<Employee, EmployeeDetailsDto>()
                 .ForCtorParam("AllocatedMonths", opt => opt.MapFrom(src => GetAllocatedMonths(src)))
                 .ForCtorParam("RemainingMonths", opt => opt.MapFrom(src => GetRemainingMonths(src)))
                 .ForCtorParam("AvailabilityStatus", opt => opt.MapFrom(src => GetAvailabilityStatus(src)))
                 .ForCtorParam("AssignedSystemsCount", opt => opt.MapFrom(src => GetAssignedSystemsCount(src)))
                 .ForCtorParam("IsActive", opt => opt.MapFrom(src => src.IsActive))
                 .ForCtorParam("ManagerReviewNote", opt => opt.MapFrom(src => (string?)null))
                 .ForCtorParam("RelevantChanges", opt => opt.MapFrom(src => new List<EmployeeRelevantChangeDto>()))
                 .ForCtorParam("Allocations", opt => opt.MapFrom(src => new List<EmployeeAllocationDto>())
                );

            // =========================================================================
            // 3. שאר המיפויים הרגילים בפרויקט
            // =========================================================================
            CreateMap<AllocationCreateDto, EmployeeAllocation>().ReverseMap();
            CreateMap<EmployeeAllocationEditDto, EmployeeAllocation>().ReverseMap();

            CreateMap<EmployeeCreateDto, Employee>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Allocations, opt => opt.MapFrom(src => src.Allocations ?? new List<AllocationCreateDto>()))
                .ReverseMap();

            CreateMap<EmployeeEditDto, Employee>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Allocations, opt => opt.Ignore());

            CreateMap<SystemCreateDto, SystemModel>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ReverseMap();
        }

        // =========================================================================
        // 💡 פונקציות העזר שאת אוהבת - עכשיו הן יושבות פה בצורה תקנית בתוך ה-Class!
        // =========================================================================
        private static double GetAllocatedMonths(Employee employee) =>
            (employee.Allocations ?? new List<EmployeeAllocation>()).Sum(a => a.ActualMonths);

        private static double GetRemainingMonths(Employee employee) =>
            employee.YearlyCapacityMonths - GetAllocatedMonths(employee);

        private static string GetAvailabilityStatus(Employee employee)
        {
            var remaining = GetRemainingMonths(employee);
            return remaining > 0 ? "Available" : (remaining == 0 ? "Balanced" : "Overloaded");
        }

        private static int GetAssignedSystemsCount(Employee employee) =>
            (employee.Allocations ?? new List<EmployeeAllocation>()).Select(a => a.SystemId).Distinct().Count();
    }
}