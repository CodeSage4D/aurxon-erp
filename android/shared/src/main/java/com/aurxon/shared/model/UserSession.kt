package com.aurxon.shared.model

data class UserSession(
    val userId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val organizationId: String,
    val institutionId: String? = null,
    val branchId: String? = null,
    val authToken: String
)
