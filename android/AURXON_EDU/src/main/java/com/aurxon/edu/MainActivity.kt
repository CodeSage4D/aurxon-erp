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
                    EduVaultEduAppRoot()
                }
            }
        }
    }
}

enum class EduAppState {
    INITIALIZING,
    SCHOOL_DISCOVERY,
    UNAUTHENTICATED,
    AUTHENTICATED
}

@Composable
fun EduVaultEduAppRoot() {
    var appState by remember { mutableStateOf(EduAppState.INITIALIZING) }
    var currentRole by remember { mutableStateOf("PARENT") }
    var selectedSchool by remember { mutableStateOf(SessionManager.instance.getCurrentSchool()) }

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
                        appState = if (SessionManager.instance.getCurrentSchool() != null) {
                            EduAppState.UNAUTHENTICATED
                        } else {
                            EduAppState.SCHOOL_DISCOVERY
                        }
                    }
                }
            }
        } else {
            appState = if (SessionManager.instance.getCurrentSchool() != null) {
                EduAppState.UNAUTHENTICATED
            } else {
                EduAppState.SCHOOL_DISCOVERY
            }
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

        EduAppState.SCHOOL_DISCOVERY -> {
            SchoolDiscoveryScreen(
                onSchoolSelected = { school ->
                    SessionManager.instance.setCurrentSchool(school)
                    selectedSchool = school
                    appState = EduAppState.UNAUTHENTICATED
                }
            )
        }

        EduAppState.UNAUTHENTICATED -> {
            EduLoginScreen(
                school = selectedSchool,
                onChangeSchool = {
                    appState = EduAppState.SCHOOL_DISCOVERY
                },
                onLoginSuccess = { role ->
                    currentRole = role
                    appState = EduAppState.AUTHENTICATED
                }
            )
        }

        EduAppState.AUTHENTICATED -> {
            if (currentRole.equals("PARENT", ignoreCase = true)) {
                ParentMainDashboard(
                    school = selectedSchool,
                    onSwitchSchool = {
                        SessionManager.instance.clearSession()
                        appState = EduAppState.SCHOOL_DISCOVERY
                    },
                    onLogout = {
                        SessionManager.instance.clearSession()
                        appState = EduAppState.UNAUTHENTICATED
                    }
                )
            } else {
                StudentMainDashboard(
                    school = selectedSchool,
                    onSwitchSchool = {
                        SessionManager.instance.clearSession()
                        appState = EduAppState.SCHOOL_DISCOVERY
                    },
                    onLogout = {
                        SessionManager.instance.clearSession()
                        appState = EduAppState.UNAUTHENTICATED
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolDiscoveryScreen(onSchoolSelected: (SavedSchool) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<OrganizationSearchResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Fetch initial top organizations from live portal API
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
                title = { Text("Find Your Institution", fontWeight = FontWeight.Bold, color = NavyPrimary) },
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
                label = { Text("Search by school name, city, or slug") },
                placeholder = { Text("e.g. DPS, Apex, Delhi, Kota") },
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
                                        .background(AurxonBlue),
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
                                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = AurxonBlue)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EduLoginScreen(
    school: SavedSchool?,
    onChangeSchool: () -> Unit,
    onLoginSuccess: (String) -> Unit
) {
    var email by remember { mutableStateOf("parent.aarav@gmail.com") }
    var password by remember { mutableStateOf("Password@123") }
    var isLoading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var selectedRoleTab by remember { mutableStateOf("PARENT") }

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
                        .background(Brush.linearGradient(listOf(AurxonBlue, RoyalPurple))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "E", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "AURXON EDU",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = NavyPrimary
                )

                Text(
                    text = school?.name ?: "Parent & Student Self-Service Platform",
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

                Spacer(modifier = Modifier.height(20.dp))

                TabRow(
                    selectedTabIndex = if (selectedRoleTab == "PARENT") 0 else 1,
                    containerColor = IceBlue,
                    modifier = Modifier.clip(RoundedCornerShape(10.dp))
                ) {
                    Tab(
                        selected = selectedRoleTab == "PARENT",
                        onClick = {
                            selectedRoleTab = "PARENT"
                            email = "parent.aarav@gmail.com"
                        },
                        text = { Text("Parent Login", fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedRoleTab == "STUDENT",
                        onClick = {
                            selectedRoleTab = "STUDENT"
                            email = "aarav.sharma@dps-society.edu"
                        },
                        text = { Text("Student Login", fontWeight = FontWeight.Bold) }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email / Student ID") },
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
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentMainDashboard(
    school: SavedSchool?,
    onSwitchSchool: () -> Unit,
    onLogout: () -> Unit
) {
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
                        Text(text = school?.name ?: "Delhi Public School Society", fontSize = 11.sp, color = Color.Gray)
                    }
                },
                actions = {
                    IconButton(onClick = onSwitchSchool) {
                        Icon(Icons.Default.Refresh, contentDescription = "Switch School", tint = AurxonBlue)
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
                    icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Fees") },
                    label = { Text("Fees") }
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Create, contentDescription = "Leave") },
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
                    3 -> ChildFeeScreen(selectedChild)
                    4 -> ApplyLeaveScreen(policy.parentLeaveApplicationEnabled)
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
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "RECENT ATTENDANCE LOG", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(8.dp))
        listOf(
            "Today: PRESENT (08:28 AM)",
            "Yesterday: PRESENT (08:25 AM)",
            "18 Sep: PRESENT (08:30 AM)",
            "17 Sep: LEAVE (Approved Medical)"
        ).forEach { log ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Text(text = log, modifier = Modifier.padding(12.dp), fontSize = 13.sp, color = NavyPrimary)
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
fun ChildFeeScreen(child: ChildProfile?) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "FEES & OUTSTANDING DUES — ${child?.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(12.dp))

        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = if (child?.pendingFeeAmount == 0.0) IceBlue else Color(0xFFFEF3C7))) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Total Outstanding Dues", fontSize = 12.sp, color = Color.Gray)
                Text(text = if (child?.pendingFeeAmount == 0.0) "₹0.00 (All Clear)" else "₹${child?.pendingFeeAmount}", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = if (child?.pendingFeeAmount == 0.0) AurxonBlue else Color(0xFFB45309))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Late fee rate: ₹50/day after due date (Grace: 5 days)", fontSize = 11.sp, color = Color.Gray)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "FEE PAYMENT RECEIPTS", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(8.dp))

        listOf(
            "Receipt #RCP-2026-0891: ₹18,500 (Term 1 Tuition) • Paid on 10 Jul 2026",
            "Receipt #RCP-2026-0412: ₹4,200 (Lab & Library Fee) • Paid on 15 Apr 2026"
        ).forEach { rcp ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(text = rcp, fontSize = 12.sp, color = NavyPrimary)
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
fun StudentMainDashboard(
    school: SavedSchool?,
    onSwitchSchool: () -> Unit,
    onLogout: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("AURXON EDU — Student Portal", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
                        Text(school?.name ?: "Delhi Public School Society", fontSize = 11.sp, color = Color.Gray)
                    }
                },
                actions = {
                    IconButton(onClick = onSwitchSchool) {
                        Icon(Icons.Default.Refresh, contentDescription = "Switch School", tint = AurxonBlue)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = IceBlue)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = RoyalPurple)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Welcome Back, Aarav Sharma", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
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
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "UPCOMING ASSESSMENTS", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Periodic Test 2: Mathematics", fontWeight = FontWeight.Bold, color = NavyPrimary)
                    Text(text = "Date: 25 Sep 2026 • Syllabus: Chapters 4-7", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }
    }
}
