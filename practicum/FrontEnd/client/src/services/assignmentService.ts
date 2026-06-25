import httpClient from "./api/httpClient";
import type {
  BulkAssignEmployeesDto,
  BulkAssignEmployeesResult,
  EmployeeAssignmentCandidate
} from "../types";

export const assignmentService = {
  async getAssignmentCandidates(params: {
    systemId: string;
    year?: number;
    search?: string;
  }): Promise<EmployeeAssignmentCandidate[]> {
    const response = await httpClient.get<EmployeeAssignmentCandidate[]>(
      "/Employees/assignment-candidates",
      { params }
    );

    return response.data || [];
  },

  async bulkAssignEmployees(dto: BulkAssignEmployeesDto): Promise<BulkAssignEmployeesResult> {
    const response = await httpClient.post<BulkAssignEmployeesResult>(
      "/Employees/bulk-assign",
      dto
    );

    return response.data;
  }
};