package com.aurxon.shared.security

import com.aurxon.shared.model.UserSession

class SessionManager {
    private var activeSession: UserSession? = null

    fun saveSession(session: UserSession) {
        this.activeSession = session
    }

    fun getActiveSession(): UserSession? {
        return activeSession
    }

    fun clearSession() {
        activeSession = null
    }

    fun isAuthenticated(): Boolean {
        return activeSession != null
    }
}
