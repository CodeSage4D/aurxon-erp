package com.aurxon.staff

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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.ExitToApp
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
                    EduVaultStaffAppRoot()
                }
            }
        }
    }
}

enum class StaffAppState {
    INITIALIZING,
    SCHOOL_DISCOVERY,
    UNAUTHENTICATED,
    AUTHENTICATED
}

@Composable
fun EduVaultStaffAppRoot() {
    var appState by remember { mutableStateOf(StaffAppState.INITIALIZING) }
    var currentRole by remember { mutableStateOf("TEACHER") }
    var currentUserContext by remember { mutableStateOf<UserContextDto?>(null) }
    var selectedSchool by remember { mutableStateOf(SessionManager.instance.getCurrentSchool()) }

    LaunchedEffect(Unit) {
        val session = SessionManager.instance.getActiveSession()
        if (session != null) {
            withContext(Dispatchers.IO) {
                val res = ApiClient.fetchUserContext(session.authToken)
                withContext(Dispatchers.Main) {
                    val user = res.user
                    if (res.success && user != null) {
                        currentUserContext = user
                        currentRole = user.role
                        appState = StaffAppState.AUTHENTICATED
                    } else {
                        SessionManager.instance.clearSession()
                        appState = if (SessionManager.instance.getCurrentSchool() != null) {
                            StaffAppState.UNAUTHENTICATED
                        } else {
                            StaffAppState.SCHOOL_DISCOVERY
                        }
                    }
                }
            }
        } else {
            appState = if (SessionManager.instance.getCurrentSchool() != null) {
                StaffAppState.UNAUTHENTICATED
            } else {
                StaffAppState.SCHOOL_DISCOVERY
            }
        }
    }

    when (appState) {
        StaffAppState.INITIALIZING -> {
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
                        text = "AURXON STAFF",
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        fontSize = 18.sp
                    )
                    Text(
                        text = "Resolving institutional authorization context...",
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
            }
        }

        StaffAppState.SCHOOL_DISCOVERY -> {
            StaffSchoolDiscoveryScreen(
                onSchoolSelected = { school ->
                    SessionManager.instance.setCurrentSchool(school)
                    selectedSchool = school
                    appState = StaffAppState.UNAUTHENTICATED
                }
            )
        }

        StaffAppState.UNAUTHENTICATED -> {
            StaffLoginScreen(
                school = selectedSchool,
                onChangeSchool = {
                    appState = StaffAppState.SCHOOL_DISCOVERY
                },
                onLoginSuccess = { userContext ->
                    currentUserContext = userContext
                    currentRole = userContext.role
                    appState = StaffAppState.AUTHENTICATED
                }
            )
        }

        StaffAppState.AUTHENTICATED -> {
            StaffMainDashboard(
                school = selectedSchool,
                userContext = currentUserContext,
                role = currentRole,
                onSwitchSchool = {
                    SessionManager.instance.clearSession()
                    appState = StaffAppState.SCHOOL_DISCOVERY
                },
                onLogout = {
                    SessionManager.instance.clearSession()
                    currentUserContext = null
                    appState = StaffAppState.UNAUTHENTICATED
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffSchoolDiscoveryScreen(onSchoolSelected: (SavedSchool) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<OrganizationSearchResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }

    LaunchedEffect(searchQuery) {
        isSearching = true
        withContext(Dispatchers.IO) {
            val results = ApiClient.searchSchools(searchQuery)
            withContext(Dispatchers.Main) {
                searchResults = results
                isSearching = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Find Your Institution — Staff", fontWeight = FontWeight.Bold, color = NavyPrimary) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = IceBlue)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search by school name, code, or city") },
                placeholder = { Text("e.g. DPS, Apex, Kota, New Delhi") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AurxonBlue) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (searchQuery.isEmpty()) "REGISTERED INSTITUTIONS" else "SEARCH RESULTS",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (isSearching) {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AurxonBlue)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(searchResults) { org ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSchoolSelected(
                                        SavedSchool(
                                            organizationId = org.code,
                                            name = org.name,
                                            slug = org.slug,
                                            code = org.code,
                                            city = org.city,
                                            board = org.board
                                        )
                                    )
                                },
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(NavyPrimary),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = org.name.take(1).uppercase(),
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    )
                                }
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = org.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                    Text(text = "${org.city} • ${org.board}", fontSize = 12.sp, color = Color.Gray)
                                    Text(text = org.organizationType, fontSize = 11.sp, color = RoyalPurple, fontWeight = FontWeight.SemiBold)
                                }
                                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = AurxonBlue)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StaffLoginScreen(
    school: SavedSchool?,
    onChangeSchool: () -> Unit,
    onLoginSuccess: (UserContextDto) -> Unit
) {
    var email by remember { mutableStateOf("teacher.science@dps-society.edu") }
    var password by remember { mutableStateOf("Password@123") }
    var isLoading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.linearGradient(listOf(IceBlue, Color.White))),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(NavyPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "S", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "AURXON STAFF",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = NavyPrimary
                )

                Text(
                    text = school?.name ?: "Faculty, Leadership & Admin Operations",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    maxLines = 1
                )

                if (school != null) {
                    Text(
                        text = "Change Institution",
                        color = AurxonBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clickable { onChangeSchool() }
                            .padding(top = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(text = "QUICK ROLE DEMO SELECTOR:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AurxonBlue)
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(
                        selected = email.contains("teacher"),
                        onClick = {
                            email = "teacher.math@dps-society.edu"
                            password = "Password@123"
                        },
                        label = { Text("Teacher") }
                    )
                    FilterChip(
                        selected = email.contains("principal"),
                        onClick = {
                            email = "principal.rkp@dps-society.edu"
                            password = "Password@123"
                        },
                        label = { Text("Principal") }
                    )
                    FilterChip(
                        selected = email.contains("accountant"),
                        onClick = {
                            email = "accountant@dps-society.edu"
                            password = "Password@123"
                        },
                        label = { Text("Accountant") }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Official Staff Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
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
                                    val token = res.token ?: "auth_token_${u.id}"
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

                                    val contextDto = UserContextDto(
                                        id = u.id,
                                        name = u.name,
                                        email = u.email,
                                        role = u.role,
                                        organizationId = "org_dps",
                                        organizationName = school?.name ?: "Delhi Public School Society",
                                        institutionName = school?.name ?: "Delhi Public School, R.K. Puram"
                                    )
                                    onLoginSuccess(contextDto)
                                } else {
                                    errorText = res.error ?: "Invalid credentials"
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    shape = RoundedCornerShape(10.dp),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                    } else {
                        Text("Sign In to AURXON STAFF", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffMainDashboard(
    school: SavedSchool?,
    userContext: UserContextDto?,
    role: String,
    onSwitchSchool: () -> Unit,
    onLogout: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    var dashboardData by remember { mutableStateOf<DashboardResponse?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val session = SessionManager.instance.getActiveSession()

    fun refreshDashboard() {
        if (session != null) {
            isRefreshing = true
            scope.launch(Dispatchers.IO) {
                val res = ApiClient.fetchDashboard(session.authToken)
                withContext(Dispatchers.Main) {
                    isRefreshing = false
                    if (res.success) {
                        dashboardData = res
                    }
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshDashboard()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "AURXON STAFF — ${role.replace('_', ' ')}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = NavyPrimary
                        )
                        Text(
                            text = school?.name ?: (userContext?.institutionName ?: "Delhi Public School Society"),
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { refreshDashboard() }) {
                        if (isRefreshing) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = AurxonBlue, strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh Data", tint = AurxonBlue)
                        }
                    }
                    IconButton(onClick = onSwitchSchool) {
                        Icon(Icons.Default.Place, contentDescription = "Switch School", tint = AurxonBlue)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Sign Out", tint = NavyPrimary)
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
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") }
                )
                if (role.equals("TEACHER", ignoreCase = true) || role.equals("FACULTY", ignoreCase = true)) {
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Attendance") },
                        label = { Text("Attendance") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        icon = { Icon(Icons.Default.Create, contentDescription = "Leave") },
                        label = { Text("Leave") }
                    )
                } else if (role.equals("ACCOUNTANT", ignoreCase = true)) {
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Collect Fees") },
                        label = { Text("Collect Fees") }
                    )
                } else {
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.List, contentDescription = "Approvals") },
                        label = { Text("Approvals") }
                    )
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(16.dp)
        ) {
            when (role.uppercase()) {
                "PRINCIPAL", "ORG_ADMIN", "SUPER_ADMIN" -> PrincipalView(userContext, selectedTab, dashboardData)
                "ACCOUNTANT" -> AccountantView(userContext, selectedTab, dashboardData)
                else -> TeacherView(userContext, selectedTab, dashboardData)
            }
        }
    }
}

@Composable
fun TeacherView(
    userContext: UserContextDto?,
    tab: Int,
    dashboardData: DashboardResponse?
) {
    var attendanceMarked by remember { mutableStateOf(false) }
    var studentsList by remember { mutableStateOf<List<ChildProfile>>(emptyList()) }
    val attendanceStatus = remember { mutableStateMapOf<String, String>() }
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val session = SessionManager.instance.getActiveSession()
        if (session != null) {
            withContext(Dispatchers.IO) {
                val fetched = ApiClient.fetchStudents(session.authToken)
                withContext(Dispatchers.Main) {
                    val list = if (fetched.isNotEmpty()) fetched else listOf(
                        ChildProfile("s1", "Aarav Sharma", "DPS-2024-041", "Class 8", "A", 95.4, 0.0),
                        ChildProfile("s2", "Ananya Sharma", "DPS-2024-042", "Class 8", "A", 98.0, 4500.0),
                        ChildProfile("s3", "Rohan Verma", "DPS-2024-082", "Class 8", "A", 88.5, 0.0),
                        ChildProfile("s4", "Kavita Sen", "DPS-2024-114", "Class 8", "A", 92.0, 12500.0)
                    )
                    studentsList = list
                    list.forEach { s ->
                        if (!attendanceStatus.containsKey(s.id)) {
                            attendanceStatus[s.id] = "PRESENT"
                        }
                    }
                }
            }
        }
    }

    when (tab) {
        0 -> {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = AurxonBlue),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "Welcome, ${userContext?.name ?: "Faculty"}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Text(
                                text = "Class Teacher: 8A | Science & Mathematics Faculty",
                                color = Color.White.copy(alpha = 0.85f),
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                item {
                    Text(text = "MY ASSIGNED CLASSES TODAY", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                }

                items(listOf(
                    Triple("Period 1", "Class 8A — Science & Physics", "08:30 - 09:15 AM • Lab 2"),
                    Triple("Period 3", "Class 8B — General Science", "10:15 - 11:00 AM • Room 204"),
                    Triple("Period 5", "Class 9A — Chemistry", "11:45 - 12:30 PM • Chem Lab")
                )) { (period, subject, timing) ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(IceBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = period.replace("Period ", "P"), color = AurxonBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(text = subject, fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 13.sp)
                                Text(text = timing, color = Color.Gray, fontSize = 11.sp)
                            }
                        }
                    }
                }

                item {
                    Text(text = "INSTITUTIONAL BULLETINS", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                }

                val announcements = dashboardData?.announcements ?: emptyList()
                if (announcements.isNotEmpty()) {
                    items(announcements) { ann ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(text = ann.title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = ann.content, fontSize = 12.sp, color = Color.DarkGray)
                            }
                        }
                    }
                }
            }
        }

        1 -> {
            Column(modifier = Modifier.fillMaxSize()) {
                Text(text = "DAILY SECTION ATTENDANCE (Class 8A)", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
                Spacer(modifier = Modifier.height(10.dp))

                if (attendanceMarked) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = IceBlue),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "✓ Class 8A Attendance Synchronized with ERP Database",
                                color = AurxonBlue,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            val presentCount = attendanceStatus.values.count { it == "PRESENT" }
                            val absentCount = attendanceStatus.values.count { it == "ABSENT" }
                            Text(
                                text = "Present: $presentCount | Absent: $absentCount | Total: ${studentsList.size}",
                                fontSize = 12.sp,
                                color = Color.DarkGray
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedButton(onClick = { attendanceMarked = false }) {
                                Text("Edit Attendance Roster")
                            }
                        }
                    }
                } else {
                    val presentCount = attendanceStatus.values.count { it == "PRESENT" }
                    val absentCount = attendanceStatus.values.count { it == "ABSENT" }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Present: $presentCount | Absent: $absentCount",
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary,
                                fontSize = 13.sp
                            )
                            Button(
                                onClick = {
                                    val session = SessionManager.instance.getActiveSession()
                                    if (session != null) {
                                        isSubmitting = true
                                        scope.launch(Dispatchers.IO) {
                                            val items = studentsList.map { s ->
                                                AttendanceSubmissionItem(
                                                    studentId = s.id,
                                                    status = attendanceStatus[s.id] ?: "PRESENT"
                                                )
                                            }
                                            val success = ApiClient.submitAttendance(session.authToken, items)
                                            withContext(Dispatchers.Main) {
                                                isSubmitting = false
                                                attendanceMarked = true
                                            }
                                        }
                                    } else {
                                        attendanceMarked = true
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                                enabled = !isSubmitting,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                if (isSubmitting) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                                } else {
                                    Text("Submit Roster")
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(studentsList) { student ->
                            val current = attendanceStatus[student.id] ?: "PRESENT"
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = student.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                                        Text(text = "Adm: ${student.rollNumber}", fontSize = 11.sp, color = Color.Gray)
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        FilterChip(
                                            selected = current == "PRESENT",
                                            onClick = { attendanceStatus[student.id] = "PRESENT" },
                                            label = { Text("P") },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = Color(0xFF10B981),
                                                selectedLabelColor = Color.White
                                            )
                                        )
                                        FilterChip(
                                            selected = current == "ABSENT",
                                            onClick = { attendanceStatus[student.id] = "ABSENT" },
                                            label = { Text("A") },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = Color(0xFFEF4444),
                                                selectedLabelColor = Color.White
                                            )
                                        )
                                        FilterChip(
                                            selected = current == "LATE",
                                            onClick = { attendanceStatus[student.id] = "LATE" },
                                            label = { Text("L") },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = AccentGold,
                                                selectedLabelColor = NavyPrimary
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        2 -> {
            Text(text = "APPLY FACULTY LEAVE", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            var leaveSubmitted by remember { mutableStateOf(false) }

            if (leaveSubmitted) {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
                    Text(
                        text = "✓ Faculty Leave Request Submitted to Principal for Approval.",
                        color = AurxonBlue,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            } else {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Leave Balance: Casual (4 days) | Medical (8 days)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = AurxonBlue)
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(value = "Casual Leave", onValueChange = {}, label = { Text("Leave Type") }, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(value = "Personal emergency", onValueChange = {}, label = { Text("Reason") }, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = { leaveSubmitted = true },
                            colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Submit Leave Request to Principal", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PrincipalView(
    userContext: UserContextDto?,
    tab: Int,
    dashboardData: DashboardResponse?
) {
    val pulse = dashboardData?.pulse ?: DashboardPulse(
        totalStudents = 1420,
        totalTeachers = 84,
        attendanceRate = "94.6%",
        feeCollectionRate = "91.2%",
        academicAverage = "82.5%"
    )

    if (tab == 0) {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(text = "Institutional Command Center", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(text = userContext?.institutionName ?: "Delhi Public School, R.K. Puram", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Active Students", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "${pulse.totalStudents}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AurxonBlue)
                        }
                    }
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Faculty Count", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "${pulse.totalTeachers}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = RoyalPurple)
                        }
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Attendance Rate", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = pulse.attendanceRate, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF10B981))
                        }
                    }
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Collection Efficiency", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = pulse.feeCollectionRate, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AccentGold)
                        }
                    }
                }
            }

            item {
                Text(text = "OPERATIONAL PRIORITIES TODAY", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            }

            val priorities = dashboardData?.priorities ?: emptyList()
            if (priorities.isNotEmpty()) {
                items(priorities) { pri ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (pri.priority == "urgent") Color(0xFFEF4444) else AurxonBlue)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(text = pri.title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                                Text(text = pri.subtitle, fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                    }
                }
            } else {
                item {
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "All daily faculty rosters and fee reconciliations in order.", fontSize = 13.sp, color = NavyPrimary)
                        }
                    }
                }
            }
        }
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(text = "LEAVE APPROVAL QUEUE", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            var approved by remember { mutableStateOf(false) }

            if (approved) {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                    Text(
                        text = "✓ Request Approved & Synced to ERP Database.",
                        color = AurxonBlue,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Dr. Sunita Sharma (Science Faculty)", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                        Text(text = "Casual Leave • 22 Sep 2026 (1 Day)", fontSize = 12.sp, color = Color.Gray)
                        Text(text = "Reason: Academic symposium presentation", fontSize = 12.sp, color = NavyPrimary)
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { approved = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Approve")
                            }
                            OutlinedButton(
                                onClick = { approved = true },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Reject")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AccountantView(
    userContext: UserContextDto?,
    tab: Int,
    dashboardData: DashboardResponse?
) {
    if (tab == 0) {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = RoyalPurple),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(text = "Fee Collections & Accounting Hub", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "Collection Efficiency: 91.2%", color = AccentGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Expected", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "₹1.48 Cr", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = NavyPrimary)
                        }
                    }
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Collected", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "₹1.32 Cr", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF10B981))
                        }
                    }
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "Outstanding", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "₹15.5 L", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFFEF4444))
                        }
                    }
                }
            }

            item {
                Text(text = "RECENT FEE TRANSACTIONS LEDGER", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            }

            items(listOf(
                Triple("Aarav Sharma (Class 8A)", "₹24,500 • Online UPI", "RCP-2024-0891"),
                Triple("Ananya Sharma (Class 5B)", "₹18,000 • Net Banking", "RCP-2024-0890"),
                Triple("Rohan Verma (Class 9B)", "₹22,000 • Debit Card", "RCP-2024-0889")
            )) { (name, amount, receipt) ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                            Text(text = receipt, fontSize = 11.sp, color = Color.Gray)
                        }
                        Text(text = amount, fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontSize = 13.sp)
                    }
                }
            }
        }
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(text = "STUDENT FEE COLLECTION DESK", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            var rollInput by remember { mutableStateOf("DPS-2024-041") }
            var receiptIssued by remember { mutableStateOf(false) }

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    OutlinedTextField(
                        value = rollInput,
                        onValueChange = { rollInput = it },
                        label = { Text("Student Admission # / Roll No") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Student: Aarav Sharma (Class 8 - Section A)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                    Text(text = "Outstanding Dues: ₹0.00 (All Clear)", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(14.dp))

                    if (receiptIssued) {
                        Text(
                            text = "✓ Official Receipt RCP-${System.currentTimeMillis() % 10000} Generated & Email Sent.",
                            color = AurxonBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    } else {
                        Button(
                            onClick = { receiptIssued = true },
                            colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Generate & Issue Official Receipt", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

