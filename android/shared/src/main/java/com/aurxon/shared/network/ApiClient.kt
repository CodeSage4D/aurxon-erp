package com.aurxon.shared.network

object ApiClient {
    const val DEV_API_BASE_URL = "http://10.0.2.2:3000/api/v1"
    const val STAGING_API_BASE_URL = "https://staging.aurxon.io/api/v1"
    const val PRODUCTION_API_BASE_URL = "https://aurxon.io/api/v1"

    fun getBaseUrl(environment: String = "DEV"): String {
        return when (environment.uppercase()) {
            "STAGING" -> STAGING_API_BASE_URL
            "PRODUCTION" -> PRODUCTION_API_BASE_URL
            else -> DEV_API_BASE_URL
        }
    }
}
