package com.aurxon.shared.network

import com.aurxon.shared.model.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONArray
import org.json.JSONObject

object ApiClient {
    // Configurable API URLs
    var activeEnvironment: String = "PRODUCTION_NETLIFY"

    const val LOCAL_EMULATOR_URL = "http://10.0.2.2:3000/api/v1"
    const val LOCAL_WIFI_URL = "http://192.168.1.100:3000/api/v1"
    const val NETLIFY_PRODUCTION_URL = "https://aurxon-erp.netlify.app/api/v1"
    const val PRODUCTION_CANONICAL_URL = "https://aurxon.io/api/v1"

    fun getBaseUrl(): String {
        return when (activeEnvironment.uppercase()) {
            "LOCAL_EMULATOR" -> LOCAL_EMULATOR_URL
            "LOCAL_WIFI" -> LOCAL_WIFI_URL
            "PRODUCTION_CANONICAL" -> PRODUCTION_CANONICAL_URL
            else -> NETLIFY_PRODUCTION_URL
        }
    }

    /**
     * Executes HTTP POST for user authentication against live ERP backend
     */
    fun login(req: LoginRequest): LoginResponse {
        return try {
            val url = URL("${getBaseUrl()}/auth/login")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            val jsonBody = JSONObject().apply {
                put("email", req.email)
                put("password", req.password)
            }

            val writer = OutputStreamWriter(conn.outputStream)
            writer.write(jsonBody.toString())
            writer.flush()
            writer.close()

            val statusCode = conn.responseCode
            val inputStream = if (statusCode in 200..299) conn.inputStream else conn.errorStream
            val reader = BufferedReader(InputStreamReader(inputStream))
            val responseStr = reader.readText()
            reader.close()

            val json = JSONObject(responseStr)
            if (json.optBoolean("success", false)) {
                val token = json.optString("token", "")
                val userObj = json.getJSONObject("user")
                val userDto = UserDto(
                    id = userObj.getString("id"),
                    name = userObj.getString("name"),
                    email = userObj.getString("email"),
                    role = userObj.getString("role"),
                    organizationName = userObj.optString("organizationName"),
                    institutionName = userObj.optString("institutionName")
                )
                LoginResponse(success = true, token = token, user = userDto)
            } else {
                LoginResponse(success = false, error = json.optString("error", "Authentication failed"))
            }
        } catch (e: Exception) {
            LoginResponse(success = false, error = "Network error connecting to ERP: ${e.localizedMessage}")
        }
    }

    /**
     * Restores authoritative user context from live ERP backend using stored JWT token
     */
    fun fetchUserContext(authToken: String): AuthMeResponse {
        return try {
            val url = URL("${getBaseUrl()}/auth/me")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.setRequestProperty("Accept", "application/json")
            conn.setRequestProperty("Authorization", "Bearer $authToken")
            conn.setRequestProperty("Cookie", "aurxon_session=$authToken")
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            val statusCode = conn.responseCode
            val inputStream = if (statusCode in 200..299) conn.inputStream else conn.errorStream
            val reader = BufferedReader(InputStreamReader(inputStream))
            val responseStr = reader.readText()
            reader.close()

            val json = JSONObject(responseStr)
            if (json.optBoolean("success", false)) {
                val userObj = json.getJSONObject("user")
                val permsArr = userObj.optJSONArray("permissions") ?: JSONArray()
                val permsList = mutableListOf<String>()
                for (i in 0 until permsArr.length()) {
                    permsList.add(permsArr.getString(i))
                }

                val userContext = UserContextDto(
                    id = userObj.getString("id"),
                    name = userObj.getString("name"),
                    email = userObj.getString("email"),
                    role = userObj.getString("role"),
                    actorType = userObj.optString("actorType", null),
                    scope = userObj.optString("scope", null),
                    permissions = permsList,
                    organizationId = userObj.optString("organizationId", "org_default"),
                    organizationName = userObj.optString("organizationName", "Delhi Public School Society"),
                    institutionId = userObj.optString("institutionId", "inst_default"),
                    institutionName = userObj.optString("institutionName", "Delhi Public School, R.K. Puram"),
                    branchName = userObj.optString("branchName", "Senior Wing Campus")
                )
                AuthMeResponse(success = true, user = userContext)
            } else {
                AuthMeResponse(success = false, error = json.optString("error", "Session expired"))
            }
        } catch (e: Exception) {
            AuthMeResponse(success = false, error = "Network connection failed: ${e.localizedMessage}")
        }
    }

    /**
     * Executes GET against /api/v1/portal/search for institutional discovery
     */
    fun searchSchools(query: String = ""): List<OrganizationSearchResult> {
        return try {
            val encodedQ = java.net.URLEncoder.encode(query.trim(), "UTF-8")
            val url = URL("${getBaseUrl()}/portal/search?q=$encodedQ")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.setRequestProperty("Accept", "application/json")
            conn.connectTimeout = 6000
            conn.readTimeout = 6000

            val statusCode = conn.responseCode
            val inputStream = if (statusCode in 200..299) conn.inputStream else conn.errorStream
            val reader = BufferedReader(InputStreamReader(inputStream))
            val responseStr = reader.readText()
            reader.close()

            val json = JSONObject(responseStr)
            val results = mutableListOf<OrganizationSearchResult>()
            if (json.optBoolean("success", false)) {
                val arr = json.optJSONArray("results") ?: JSONArray()
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    results.add(
                        OrganizationSearchResult(
                            name = obj.getString("name"),
                            slug = obj.getString("slug"),
                            code = obj.getString("code"),
                            city = obj.getString("city"),
                            organizationType = obj.optString("organizationType", "School"),
                            board = obj.optString("board", "CBSE Affiliated"),
                            logoUrl = if (obj.isNull("logoUrl")) null else obj.optString("logoUrl")
                        )
                    )
                }
            }
            results
        } catch (e: Exception) {
            emptyList()
        }
    }
}
