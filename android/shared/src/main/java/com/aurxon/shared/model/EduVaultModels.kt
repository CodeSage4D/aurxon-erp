package com.aurxon.shared.model

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserDto? = null,
    val error: String? = null
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val organizationName: String? = null,
    val institutionName: String? = null,
    val mustResetPassword: Boolean = false,
    val isTemporaryPassword: Boolean = false
)

data class AuthMeResponse(
    val success: Boolean,
    val user: UserContextDto? = null,
    val error: String? = null
)

data class UserContextDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val actorType: String? = null,
    val scope: String? = null,
    val permissions: List<String> = emptyList(),
    val organizationId: String,
    val organizationName: String,
    val institutionId: String? = null,
    val institutionName: String? = null,
    val branchName: String? = null
)

data class InstitutionPolicy(
    val studentLeaveApplicationEnabled: Boolean = true,
    val parentLeaveApplicationEnabled: Boolean = true,
    val parentFeePaymentEnabled: Boolean = true,
    val resultVisibilityEnabled: Boolean = true
)

data class ChildProfile(
    val id: String,
    val name: String,
    val rollNumber: String,
    val className: String,
    val sectionName: String,
    val attendancePercentage: Double,
    val pendingFeeAmount: Double
)

data class StudentAttendanceSummary(
    val totalDays: Int,
    val presentDays: Int,
    val absentDays: Int,
    val leaveDays: Int,
    val percentage: Double
)

data class TimetableItem(
    val id: String,
    val periodNumber: Int,
    val startTime: String,
    val endTime: String,
    val subjectName: String,
    val teacherName: String,
    val roomNumber: String
)

data class ExamResultItem(
    val examName: String,
    val subjectName: String,
    val marksObtained: Double,
    val maxMarks: Double,
    val grade: String
)

data class LeaveApplicationRequest(
    val studentId: String? = null,
    val leaveType: String,
    val startDate: String,
    val endDate: String,
    val reason: String
)

data class LeaveApplicationResponse(
    val success: Boolean,
    val applicationId: String? = null,
    val status: String = "PENDING",
    val error: String? = null
)

data class OrganizationSearchResult(
    val name: String,
    val slug: String,
    val code: String,
    val city: String,
    val organizationType: String,
    val board: String,
    val logoUrl: String? = null
)

data class SavedSchool(
    val organizationId: String,
    val name: String,
    val slug: String,
    val code: String,
    val city: String,
    val board: String
)

data class AttendanceRecordDto(
    val id: String,
    val studentId: String,
    val studentName: String,
    val status: String,
    val date: String
)

data class AttendanceSubmissionItem(
    val studentId: String,
    val status: String,
    val remarks: String? = null
)

data class FeeAllocationDto(
    val id: String,
    val feeHead: String,
    val grossAmount: Double,
    val paidAmount: Double,
    val balanceAmount: Double,
    val status: String,
    val dueDate: String? = null
)

data class AnnouncementDto(
    val id: String,
    val title: String,
    val content: String,
    val publishedAt: String
)

data class DashboardPulse(
    val totalStudents: Int = 0,
    val totalTeachers: Int = 0,
    val attendanceRate: String = "0%",
    val feeCollectionRate: String = "0%",
    val academicAverage: String = "0%",
    val expectedFees: Double = 0.0,
    val collectedFees: Double = 0.0,
    val outstandingFees: Double = 0.0
)

data class PriorityActionItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val priority: String,
    val href: String = "",
    val actionText: String = ""
)

data class DashboardResponse(
    val success: Boolean,
    val role: String = "",
    val pulse: DashboardPulse? = null,
    val priorities: List<PriorityActionItem> = emptyList(),
    val announcements: List<AnnouncementDto> = emptyList(),
    val children: List<ChildProfile> = emptyList(),
    val timetableToday: List<TimetableItem> = emptyList(),
    val error: String? = null
)

