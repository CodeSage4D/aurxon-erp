package com.aurxon.shared.security

import com.aurxon.shared.model.ChildProfile
import com.aurxon.shared.model.UserSession

class SessionManager private constructor() {
    private var activeSession: UserSession? = null
    private var availableChildren: List<ChildProfile> = emptyList()
    private var selectedChildIndex: Int = 0

    companion object {
        val instance: SessionManager by lazy { SessionManager() }
    }

    fun saveSession(session: UserSession) {
        this.activeSession = session
    }

    fun getActiveSession(): UserSession? {
        return activeSession
    }

    fun clearSession() {
        activeSession = null
        availableChildren = emptyList()
        selectedChildIndex = 0
    }

    fun isAuthenticated(): Boolean {
        return activeSession != null
    }

    // Parent Child Switching Management
    fun setChildren(children: List<ChildProfile>) {
        this.availableChildren = children
        this.selectedChildIndex = 0
    }

    fun getChildren(): List<ChildProfile> {
        return availableChildren
    }

    fun getSelectedChild(): ChildProfile? {
        if (availableChildren.isEmpty()) return null
        return availableChildren.getOrNull(selectedChildIndex) ?: availableChildren.firstOrNull()
    }

    fun selectChild(index: Int) {
        if (index in availableChildren.indices) {
            this.selectedChildIndex = index
        }
    }
}
