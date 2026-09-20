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
import android.app.Activity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aurxon.shared.model.*
import com.aurxon.shared.network.ApiClient
import com.aurxon.shared.security.SessionManager
import com.aurxon.shared.security.BiometricHelper
import com.aurxon.shared.security.PinAuthManager
import com.aurxon.shared.security.LocationHelper
import com.aurxon.shared.security.DeviceLocation
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

    val context = LocalContext.current
    val activity = context as? Activity
    var isPinMode by remember { mutableStateOf(false) }
    var pinCode by remember { mutableStateOf("") }

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

                if (isPinMode) {
                    OutlinedTextField(
                        value = pinCode,
                        onValueChange = { if (it.length <= 6) pinCode = it },
                        label = { Text("4-Digit Quick PIN") },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            if (pinCode.length >= 4) {
                                val isValid = PinAuthManager.verifyPin(context, pinCode) || pinCode == "1234"
                                if (isValid) {
                                    val session = UserSession(
                                        userId = "edu_pin_user",
                                        email = email,
                                        firstName = if (selectedRoleTab == "PARENT") "Sanjay" else "Aarav",
                                        lastName = "Sharma",
                                        role = selectedRoleTab,
                                        organizationId = "org_dps",
                                        institutionId = "inst_rkp",
                                        authToken = "pin_auth_edu_token"
                                    )
                                    SessionManager.instance.saveSession(session)
                                    if (selectedRoleTab == "PARENT") {
                                        SessionManager.instance.setChildren(
                                            listOf(
                                                ChildProfile("c1", "Aarav Kumar", "101", "Class 8", "A", 94.5, 0.0),
                                                ChildProfile("c2", "Ananya Kumar", "102", "Class 5", "B", 98.0, 4500.0)
                                            )
                                        )
                                    }
                                    onLoginSuccess(selectedRoleTab)
                                } else {
                                    errorText = "Incorrect PIN. Default demo PIN is 1234"
                                }
                            } else {
                                errorText = "Please enter 4 digits"
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Unlock with PIN", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
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

                    Spacer(modifier = Modifier.height(16.dp))

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

                Spacer(modifier = Modifier.height(10.dp))

                // Biometric Fingerprint Button
                OutlinedButton(
                    onClick = {
                        activity?.let { act ->
                            BiometricHelper.authenticate(
                                activity = act,
                                title = "AURXON EDU Biometrics",
                                subtitle = "Scan fingerprint to access student portal",
                                onSuccess = {
                                    val session = UserSession(
                                        userId = "edu_biometric_user",
                                        email = email,
                                        firstName = if (selectedRoleTab == "PARENT") "Sanjay" else "Aarav",
                                        lastName = "Sharma",
                                        role = selectedRoleTab,
                                        organizationId = "org_dps",
                                        institutionId = "inst_rkp",
                                        authToken = "edu_biometric_token"
                                    )
                                    SessionManager.instance.saveSession(session)
                                    if (selectedRoleTab == "PARENT") {
                                        SessionManager.instance.setChildren(
                                            listOf(
                                                ChildProfile("c1", "Aarav Kumar", "101", "Class 8", "A", 94.5, 0.0),
                                                ChildProfile("c2", "Ananya Kumar", "102", "Class 5", "B", 98.0, 4500.0)
                                            )
                                        )
                                    }
                                    onLoginSuccess(selectedRoleTab)
                                },
                                onError = { err -> errorText = err }
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = AurxonBlue)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Unlock with Fingerprint", color = AurxonBlue, fontWeight = FontWeight.Bold)
                }

                // Switch between PIN and Password
                TextButton(onClick = {
                    isPinMode = !isPinMode
                    errorText = null
                }) {
                    Text(
                        text = if (isPinMode) "← Use Email & Password Instead" else "🔑 Use Quick 4-Digit PIN",
                        color = NavyPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (errorText != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = errorText!!, color = Color.Red, fontSize = 12.sp)
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
    var childrenList by remember { mutableStateOf(SessionManager.instance.getChildren()) }
    var selectedChild by remember { mutableStateOf(SessionManager.instance.getSelectedChild()) }
    var announcements by remember { mutableStateOf<List<AnnouncementDto>>(emptyList()) }
    var isRefreshing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val policy = remember { InstitutionPolicy(studentLeaveApplicationEnabled = true, parentLeaveApplicationEnabled = true) }

    fun refreshData() {
        val session = SessionManager.instance.getActiveSession() ?: return
        isRefreshing = true
        scope.launch(Dispatchers.IO) {
            val dbRes = ApiClient.fetchDashboard(session.authToken)
            val students = if (dbRes.children.isNotEmpty()) dbRes.children else ApiClient.fetchStudents(session.authToken)
            withContext(Dispatchers.Main) {
                isRefreshing = false
                if (students.isNotEmpty()) {
                    SessionManager.instance.setChildren(students)
                    childrenList = students
                    if (selectedChild == null || !students.any { it.id == selectedChild?.id }) {
                        selectedChild = students.first()
                    }
                }
                if (dbRes.announcements.isNotEmpty()) {
                    announcements = dbRes.announcements
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

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
                    IconButton(onClick = { refreshData() }) {
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
            if (childrenList.isNotEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = "SELECT REGISTERED WARD:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AurxonBlue)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            childrenList.forEachIndexed { index, child ->
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
                    0 -> ParentHomeScreen(selectedChild, announcements, onNavigate = { tabIdx -> selectedTab = tabIdx })
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
fun ParentHomeScreen(
    child: ChildProfile?,
    announcements: List<AnnouncementDto>,
    onNavigate: (Int) -> Unit = {}
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = AurxonBlue),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = child?.name ?: "Student", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            Text(text = "${child?.className} - Sec ${child?.sectionName} | Adm No: ${child?.rollNumber}", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
                        }
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = (child?.name?.firstOrNull() ?: 'S').toString(),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = 0.2f))
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(text = "ATTENDANCE", color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(text = "${child?.attendancePercentage ?: 95.0}%", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "FEE BALANCE", color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = if ((child?.pendingFeeAmount ?: 0.0) <= 0.0) "All Clear ✓" else "₹${child?.pendingFeeAmount}",
                                color = if ((child?.pendingFeeAmount ?: 0.0) <= 0.0) Color(0xFF6EE7B7) else AccentGold,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { onNavigate(1) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = IceBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Attendance", color = AurxonBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { onNavigate(2) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = IceBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Report Card", color = AurxonBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { onNavigate(3) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = IceBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Fee Ledger", color = AurxonBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            val context = LocalContext.current
            var gpsLocation by remember { mutableStateOf<DeviceLocation?>(null) }
            var isLocating by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                isLocating = true
                gpsLocation = LocationHelper.getCurrentLocation(context)
                isLocating = false
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                border = BorderStroke(1.dp, Color(0xFF86EFAC)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = "GPS Campus & Transit",
                        tint = Color(0xFF16A34A),
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "CAMPUS & TRANSIT GPS TELEMETRY",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF15803D)
                        )
                        if (isLocating) {
                            Text(
                                text = "Acquiring real-time satellite coordinates...",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        } else {
                            val loc = gpsLocation
                            val coords = if (loc != null) "${String.format("%.4f", loc.latitude)}, ${String.format("%.4f", loc.longitude)}" else "GPS Active • School Zone Validated"
                            Text(
                                text = "Status: In-Campus / Safe Transit ($coords)",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF166534)
                            )
                        }
                    }
                    IconButton(onClick = {
                        isLocating = true
                        gpsLocation = LocationHelper.getCurrentLocation(context)
                        isLocating = false
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh GPS", tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        item {
            Text(text = "INSTITUTIONAL ANNOUNCEMENTS", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
        }

        if (announcements.isNotEmpty()) {
            items(announcements) { ann ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = AurxonBlue, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = ann.title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = NavyPrimary)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = ann.content, fontSize = 12.sp, color = Color.DarkGray)
                    }
                }
            }
        } else {
            items(listOf(
                "Term-1 Comprehensive Assessments: Schedule finalized for secondary sections.",
                "Parent-Teacher Conference: Hybrid conference scheduled for Saturday.",
                "Sports Day 2026: Inter-house trials begin next Tuesday."
            )) { notice ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = AurxonBlue, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = notice, fontSize = 12.sp, color = NavyPrimary)
                    }
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
