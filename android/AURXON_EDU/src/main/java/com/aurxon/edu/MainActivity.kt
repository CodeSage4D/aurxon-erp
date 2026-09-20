package com.aurxon.edu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aurxon.shared.model.*
import com.aurxon.shared.network.ApiClient
import com.aurxon.shared.security.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// AURXON Brand Color Tokens
val NavyPrimary = Color(0xFF192D55)
val AurxonBlue = Color(0xFF2270AF)
val RoyalPurple = Color(0xFF9E3BB3)
val IceBlue = Color(0xFFEAF5FC)
val AccentGold = Color(0xFFF7E223)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.White
                ) {
                    EduVaultEduAppRoot()
                }
            }
        }
    }
}

enum class EduAppState {
    INITIALIZING,
    UNAUTHENTICATED,
    AUTHENTICATED
}

@Composable
fun EduVaultEduAppRoot() {
    var appState by remember { mutableStateOf(EduAppState.INITIALIZING) }
    var currentRole by remember { mutableStateOf("PARENT") }

    // Auto Session Detection on App Launch
    LaunchedEffect(Unit) {
        val session = SessionManager.instance.getActiveSession()
        if (session != null) {
            withContext(Dispatchers.IO) {
                val res = ApiClient.fetchUserContext(session.authToken)
                withContext(Dispatchers.Main) {
                    val user = res.user
                    if (res.success && user != null) {
                        currentRole = user.role
                        appState = EduAppState.AUTHENTICATED
                    } else {
                        SessionManager.instance.clearSession()
                        appState = EduAppState.UNAUTHENTICATED
                    }
                }
            }
        } else {
            appState = EduAppState.UNAUTHENTICATED
        }
    }

    when (appState) {
        EduAppState.INITIALIZING -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.linearGradient(listOf(IceBlue, Color.White))),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = AurxonBlue)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "AURXON EDUVAULT",
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        fontSize = 18.sp
                    )
                    Text(
                        text = "Restoring authenticated mobile session...",
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
            }
        }

        EduAppState.UNAUTHENTICATED -> {
            EduLoginScreen(
                onLoginSuccess = { role ->
                    currentRole = role
                    appState = EduAppState.AUTHENTICATED
                }
            )
        }

        EduAppState.AUTHENTICATED -> {
            if (currentRole.equals("PARENT", ignoreCase = true)) {
                ParentMainDashboard(onLogout = {
                    SessionManager.instance.clearSession()
                    appState = EduAppState.UNAUTHENTICATED
                })
            } else {
                StudentMainDashboard(onLogout = {
                    SessionManager.instance.clearSession()
                    appState = EduAppState.UNAUTHENTICATED
                })
            }
        }
    }
}

@Composable
fun EduLoginScreen(onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("parent.aarav@gmail.com") }
    var password by remember { mutableStateOf("Password@123") }
    var isLoading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var selectedRoleTab by remember { mutableStateOf("PARENT") }

    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(IceBlue, Color.White)))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Brush.linearGradient(listOf(AurxonBlue, RoyalPurple))),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "E", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "AURXON EDU", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = NavyPrimary)
            Text(text = "Parent & Student Self-Service Platform", fontSize = 13.sp, color = Color.Gray)

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(IceBlue)
                    .padding(4.dp)
            ) {
                Button(
                    onClick = {
                        selectedRoleTab = "PARENT"
                        email = "parent.aarav@gmail.com"
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedRoleTab == "PARENT") AurxonBlue else Color.Transparent,
                        contentColor = if (selectedRoleTab == "PARENT") Color.White else NavyPrimary
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Parent Login", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        selectedRoleTab = "STUDENT"
                        email = "student.aarav@dps-society.edu"
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedRoleTab == "STUDENT") AurxonBlue else Color.Transparent,
                        contentColor = if (selectedRoleTab == "STUDENT") Color.White else NavyPrimary
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Student Login", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email / Student ID") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            if (errorText != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(text = errorText!!, color = Color.Red, fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = {
                    isLoading = true
                    errorText = null
                    scope.launch(Dispatchers.IO) {
                        val res = ApiClient.login(LoginRequest(email.trim(), password))
                        withContext(Dispatchers.Main) {
                            isLoading = false
                            val u = res.user
                            if (res.success && u != null) {
                                val token = res.token ?: "mock_jwt_token_${u.id}"
                                val session = UserSession(
                                    userId = u.id,
                                    email = u.email,
                                    firstName = u.name.split(" ").firstOrNull() ?: "",
                                    lastName = u.name.split(" ").lastOrNull() ?: "",
                                    role = u.role,
                                    organizationId = "org_dps",
                                    institutionId = "inst_rkp",
                                    authToken = token
                                )
                                SessionManager.instance.saveSession(session)

                                if (u.role.equals("PARENT", ignoreCase = true)) {
                                    SessionManager.instance.setChildren(
                                        listOf(
                                            ChildProfile("c1", "Aarav Kumar", "101", "Class 8", "A", 94.5, 0.0),
                                            ChildProfile("c2", "Ananya Kumar", "102", "Class 5", "B", 98.0, 4500.0),
                                            ChildProfile("c3", "Arjun Kumar", "103", "Class 2", "C", 91.2, 0.0)
                                        )
                                    )
                                }
                                onLoginSuccess(u.role)
                            } else {
                                errorText = res.error ?: "Invalid email or password"
                            }
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                shape = RoundedCornerShape(10.dp),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Text("Sign In to AURXON EDU", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentMainDashboard(onLogout: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }
    val children = remember { SessionManager.instance.getChildren() }
    var selectedChild by remember { mutableStateOf(SessionManager.instance.getSelectedChild()) }
    val policy = remember { InstitutionPolicy(studentLeaveApplicationEnabled = true, parentLeaveApplicationEnabled = true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "AURXON EDU — Parent Portal", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
                        Text(text = "Delhi Public School, R.K. Puram", fontSize = 11.sp, color = Color.Gray)
                    }
                },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out", tint = NavyPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = IceBlue)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Attendance") },
                    label = { Text("Attendance") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Star, contentDescription = "Results") },
                    label = { Text("Results") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Create, contentDescription = "Apply Leave") },
                    label = { Text("Leave") }
                )
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
        ) {
            if (children.isNotEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(text = "SELECT CHILD RECORD:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AurxonBlue)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            children.forEachIndexed { index, child ->
                                val isSelected = selectedChild?.id == child.id
                                FilterChip(
                                    selected = isSelected,
                                    onClick = {
                                        SessionManager.instance.selectChild(index)
                                        selectedChild = child
                                    },
                                    label = { Text("${child.name} (${child.className})") },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AurxonBlue,
                                        selectedLabelColor = Color.White
                                    )
                                )
                            }
                        }
                    }
                }
            }

            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                when (selectedTab) {
                    0 -> ParentHomeScreen(selectedChild)
                    1 -> ChildAttendanceScreen(selectedChild)
                    2 -> ChildResultsScreen(selectedChild)
                    3 -> ApplyLeaveScreen(policy.parentLeaveApplicationEnabled)
                }
            }
        }
    }
}

@Composable
fun ParentHomeScreen(child: ChildProfile?) {
    LazyColumn(modifier = Modifier.padding(16.dp)) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = AurxonBlue)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = child?.name ?: "Student", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text(text = "${child?.className} - Section ${child?.sectionName} | Roll No: ${child?.rollNumber}", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Attendance: ${child?.attendancePercentage}%", color = Color.White, fontWeight = FontWeight.Bold)
                        Text(text = if (child?.pendingFeeAmount == 0.0) "Fees Paid ✓" else "Dues: ₹${child?.pendingFeeAmount}", color = AccentGold, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "TODAY'S SCHEDULE & NOTICES", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(listOf(
            "Period 1: Mathematics (08:30 - 09:15 AM) • Room 102",
            "Period 2: Physics (09:15 - 10:00 AM) • Lab 3",
            "Notice: CBSE Half-Yearly Exam Date Sheet Released",
            "Notice: Annual Sports Day Registration Open"
        )) { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = AurxonBlue)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(text = item, fontSize = 13.sp, color = NavyPrimary)
                }
            }
        }
    }
}

@Composable
fun ChildAttendanceScreen(child: ChildProfile?) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "ATTENDANCE SUMMARY — ${child?.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(12.dp))
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Overall Attendance: ${child?.attendancePercentage}%", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AurxonBlue)
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Present: 85 Days | Absent: 4 Days | Leave: 2 Days", fontSize = 13.sp, color = NavyPrimary)
            }
        }
    }
}

@Composable
fun ChildResultsScreen(child: ChildProfile?) {
    val results = listOf(
        ExamResultItem("Half-Yearly 2026", "Mathematics", 92.0, 100.0, "A1"),
        ExamResultItem("Half-Yearly 2026", "Physics", 88.0, 100.0, "A2"),
        ExamResultItem("Half-Yearly 2026", "Chemistry", 90.0, 100.0, "A1"),
        ExamResultItem("Half-Yearly 2026", "English", 95.0, 100.0, "A1")
    )
    LazyColumn(modifier = Modifier.padding(16.dp)) {
        item {
            Text(text = "ACADEMIC REPORT CARD — ${child?.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(12.dp))
        }
        items(results) { res ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text(text = res.subjectName, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                        Text(text = res.examName, fontSize = 12.sp, color = Color.Gray)
                    }
                    Text(text = "${res.marksObtained.toInt()}/${res.maxMarks.toInt()} (${res.grade})", fontWeight = FontWeight.Bold, color = AurxonBlue, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun ApplyLeaveScreen(isFeatureEnabled: Boolean) {
    var leaveType by remember { mutableStateOf("Medical Leave") }
    var reason by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "APPLY STUDENT LEAVE", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(12.dp))

        if (!isFeatureEnabled) {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))) {
                Text(text = "Student leave applications are currently disabled by school policy.", color = Color.Red, modifier = Modifier.padding(16.dp), fontSize = 13.sp)
            }
        } else {
            if (submitted) {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
                    Text(text = "✓ Leave application submitted successfully. Pending class teacher approval.", color = AurxonBlue, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp))
                }
            } else {
                OutlinedTextField(value = leaveType, onValueChange = { leaveType = it }, label = { Text("Leave Type") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Reason for Absence") }, modifier = Modifier.fillMaxWidth(), minLines = 3)
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { submitted = true },
                    colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Submit Application to School", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMainDashboard(onLogout: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AURXON EDU — Student Portal", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary) },
                actions = { IconButton(onClick = onLogout) { Icon(Icons.Default.ExitToApp, contentDescription = "Logout") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = IceBlue)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = RoyalPurple)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Welcome Back, Student", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(text = "Class 8A | Roll No: 101", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "MY ACADEMIC OVERVIEW", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Attendance: 94.5% (Present)", fontWeight = FontWeight.Bold, color = AurxonBlue)
                    Text(text = "Next Period: Chemistry @ 10:15 AM (Lab 2)", fontSize = 13.sp, color = NavyPrimary)
                }
            }
        }
    }
}
