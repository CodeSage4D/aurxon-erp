package com.aurxon.staff

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
                    EduVaultStaffAppRoot()
                }
            }
        }
    }
}

enum class StaffAppState {
    INITIALIZING,
    UNAUTHENTICATED,
    AUTHENTICATED
}

@Composable
fun EduVaultStaffAppRoot() {
    var appState by remember { mutableStateOf(StaffAppState.INITIALIZING) }
    var currentRole by remember { mutableStateOf("TEACHER") }
    var currentUserContext by remember { mutableStateOf<UserContextDto?>(null) }

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
                        appState = StaffAppState.UNAUTHENTICATED
                    }
                }
            }
        } else {
            appState = StaffAppState.UNAUTHENTICATED
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
                        text = "Resolving institutional staff role context...",
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
            }
        }

        StaffAppState.UNAUTHENTICATED -> {
            StaffLoginScreen(
                onLoginSuccess = { userContext ->
                    currentUserContext = userContext
                    currentRole = userContext.role
                    appState = StaffAppState.AUTHENTICATED
                }
            )
        }

        StaffAppState.AUTHENTICATED -> {
            StaffRoleDashboard(
                userContext = currentUserContext,
                onLogout = {
                    SessionManager.instance.clearSession()
                    appState = StaffAppState.UNAUTHENTICATED
                }
            )
        }
    }
}

@Composable
fun StaffLoginScreen(onLoginSuccess: (UserContextDto) -> Unit) {
    var email by remember { mutableStateOf("teacher.science@dps-society.edu") }
    var password by remember { mutableStateOf("Password@123") }
    var isLoading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var selectedRole by remember { mutableStateOf("TEACHER") }

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
                    .background(Brush.linearGradient(listOf(NavyPrimary, AurxonBlue))),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "S", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "AURXON STAFF", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = NavyPrimary)
            Text(text = "Faculty, Leadership & Admin Operations", fontSize = 13.sp, color = Color.Gray)

            Spacer(modifier = Modifier.height(16.dp))

            Text(text = "QUICK ROLE DEMO SELECTOR:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AurxonBlue)
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(
                    selected = selectedRole == "TEACHER",
                    onClick = {
                        selectedRole = "TEACHER"
                        email = "teacher.science@dps-society.edu"
                    },
                    label = { Text("Teacher") }
                )
                FilterChip(
                    selected = selectedRole == "PRINCIPAL",
                    onClick = {
                        selectedRole = "PRINCIPAL"
                        email = "principal.rkp@dps-society.edu"
                    },
                    label = { Text("Principal") }
                )
                FilterChip(
                    selected = selectedRole == "ACCOUNTANT",
                    onClick = {
                        selectedRole = "ACCOUNTANT"
                        email = "accountant@dps-society.edu"
                    },
                    label = { Text("Accountant") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Official Staff Email") },
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

                                val ctx = UserContextDto(
                                    id = u.id,
                                    name = u.name,
                                    email = u.email,
                                    role = u.role,
                                    actorType = "STAFF",
                                    permissions = listOf("attendance.mark", "students.view", "leave.approve"),
                                    organizationId = "org_dps",
                                    organizationName = u.organizationName ?: "Delhi Public School Society",
                                    institutionId = "inst_rkp",
                                    institutionName = u.institutionName ?: "Delhi Public School, R.K. Puram"
                                )
                                onLoginSuccess(ctx)
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffRoleDashboard(userContext: UserContextDto?, onLogout: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }
    val role = userContext?.role ?: "TEACHER"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "AURXON STAFF — ${role.replace('_', ' ')}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
                        Text(text = userContext?.institutionName ?: "Delhi Public School", fontSize = 11.sp, color = Color.Gray)
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
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") }
                )
                if (role.equals("TEACHER", ignoreCase = true)) {
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Attendance") },
                        label = { Text("Attendance") }
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
                "PRINCIPAL", "ORG_ADMIN" -> PrincipalView(userContext, selectedTab)
                "ACCOUNTANT" -> AccountantView(userContext, selectedTab)
                else -> TeacherView(userContext, selectedTab)
            }
        }
    }
}

@Composable
fun TeacherView(userContext: UserContextDto?, tab: Int) {
    var attendanceMarked by remember { mutableStateOf(false) }

    if (tab == 0) {
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AurxonBlue)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Welcome, ${userContext?.name ?: "Faculty"}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(text = "Class Teacher: 8A | Science Faculty", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "MY ASSIGNED CLASSES TODAY", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(8.dp))
        listOf("Class 8A — Science (08:30 AM)", "Class 8B — Science (10:15 AM)", "Class 9A — Chemistry (11:30 AM)").forEach { item ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Text(text = item, modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 13.sp)
            }
        }
    } else {
        Text(text = "MARK DAILY SECTION ATTENDANCE (Class 8A)", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
        Spacer(modifier = Modifier.height(12.dp))
        if (attendanceMarked) {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
                Text(text = "✓ Section 8A Attendance Marked & Synced to ERP Database.", color = AurxonBlue, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp))
            }
        } else {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Total Students: 42 | Present: 40 | Absent: 2", fontWeight = FontWeight.Bold, color = NavyPrimary)
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { attendanceMarked = true },
                        colors = ButtonDefaults.buttonColors(containerColor = AurxonBlue),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Submit Class 8A Attendance", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun PrincipalView(userContext: UserContextDto?, tab: Int) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = NavyPrimary)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "Institutional Oversight Dashboard", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(text = userContext?.institutionName ?: "Delhi Public School, R.K. Puram", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
        }
    }
    Spacer(modifier = Modifier.height(16.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = "Total Students", fontSize = 11.sp, color = Color.Gray)
                Text(text = "2,480", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AurxonBlue)
            }
        }
        Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = IceBlue)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = "Faculty Count", fontSize = 11.sp, color = Color.Gray)
                Text(text = "142", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = RoyalPurple)
            }
        }
    }
}

@Composable
fun AccountantView(userContext: UserContextDto?, tab: Int) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = RoyalPurple)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "Fee Collections & Accounting Hub", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(text = "Daily Collections Target: ₹1,50,000", color = AccentGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}
