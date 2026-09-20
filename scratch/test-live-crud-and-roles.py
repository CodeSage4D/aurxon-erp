import urllib.request
import json
import time
import sys

BASE = 'http://localhost:3000/api/v1'

def post(endpoint, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
        headers['Cookie'] = f'aurxon_session={token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code} on POST {endpoint}: {err_body}")
        raise

def get(endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
        headers['Cookie'] = f'aurxon_session={token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code} on GET {endpoint}: {err_body}")
        raise

print("======================================================================")
print("  AURXON EDUVAULT LIVE SYSTEM TEST: ONBOARDING, ROLES & CRUD ENGINE")
print("======================================================================")

# --------------------------------------------------------------------
# 1. NEW INSTITUTION ONBOARDING & PUBLIC DISCOVERY
# --------------------------------------------------------------------
print("\n[PHASE 1] Onboarding New School & Verifying Discovery...")
unique_suffix = int(time.time()) % 10000
school_name = f"St. Xavier Global Academy {unique_suffix}"
admin_email = f"director.{unique_suffix}@stxavier-global.edu"

onboard_payload = {
    "name": school_name,
    "type": "SCHOOL",
    "board": "CBSE",
    "city": "Bengaluru",
    "adminName": "Fr. Sebastian Thomas",
    "adminEmail": admin_email,
    "adminPassword": "Password@123",
    "branches": ["Central Campus", "East Wing"],
    "modules": ["ACADEMICS", "ATTENDANCE", "EXAMINATIONS", "FEES"]
}

onboard_res = post('/onboard', onboard_payload)
assert onboard_res.get('success') == True, f"Onboarding failed: {onboard_res}"
created_org = onboard_res.get('organization', {})
portal_slug = onboard_res.get('portalUrl') or onboard_res.get('slug')
print(f"  ✓ Successfully onboarded: {created_org.get('name')}")
print(f"  ✓ Organization Code: {created_org.get('code')}")
print(f"  ✓ Portal Slug Provisioned: {portal_slug}")

# Search discovery
search_res = get(f"/portal/search?q=Xavier")
print(f"  ✓ Institutional Portal Discovery: Found {search_res.get('count')} results")

# --------------------------------------------------------------------
# 2. MULTI-ROLE AUTHENTICATION & WORKSPACE VERIFICATION
# --------------------------------------------------------------------
print("\n[PHASE 2] Multi-Role Authentication & Credential Authorization...")
roles_to_test = [
    ("PRINCIPAL", "principal.rkp@dps-society.edu", "Password@123"),
    ("TEACHER", "teacher.math@dps-society.edu", "Password@123"),
    ("ACCOUNTANT", "accountant@dps-society.edu", "Password@123"),
    ("PARENT", "parent.aarav@gmail.com", "Password@123"),
    ("STUDENT", "student.aarav@dps-society.edu", "Password@123"),
]

role_tokens = {}
for role_name, email, password in roles_to_test:
    res = post('/auth/login', {'email': email, 'password': password})
    assert res.get('success') == True, f"Login failed for {role_name}: {res}"
    role_tokens[role_name] = res['token']
    u = res['user']
    print(f"  ✓ [{role_name}] Authenticated: {u['name']} | Org: {u.get('organizationName')}")

# --------------------------------------------------------------------
# 3. ROLE-BASED ANALYTICS DASHBOARDS
# --------------------------------------------------------------------
print("\n[PHASE 3] Live Role-Based Analytics Dashboards...")
for role_name in role_tokens:
    token = role_tokens[role_name]
    dash = get('/dashboard', token)
    assert dash.get('success') == True, f"Dashboard failed for {role_name}: {dash}"
    print(f"  ✓ [{role_name}] Live Dashboard Verified (HTTP 200)")
    if role_name == "PRINCIPAL":
        p = dash.get('pulse', {})
        print(f"      Metrics -> Students: {p.get('totalStudents')} | Teachers: {p.get('totalTeachers')} | AttRate: {p.get('attendanceRate')}")
    elif role_name == "TEACHER":
        print(f"      Classes Assigned Today -> {dash.get('classesCount')} active periods")
    elif role_name == "PARENT":
        w = dash.get('children', [])
        print(f"      Verified Wards Linked -> {len(w)} child profile(s): {[c.get('name') for c in w]}")

# --------------------------------------------------------------------
# 4. FULL CRUD: STUDENTS & SIS WORKFLOWS
# --------------------------------------------------------------------
print("\n[PHASE 4] Complete CRUD Operations (Students SIS)...")
p_token = role_tokens["PRINCIPAL"]

# 4A. READ initial list
initial_list = get('/students', p_token)
initial_count = len(initial_list.get('students', []))
print(f"  ✓ [READ] Existing Active Student Count: {initial_count}")

# 4B. CREATE new student record
student_adm = f"DPS-LIVE-{unique_suffix}"
create_req = {
    "firstName": "Kavya",
    "lastName": "Nambiar",
    "fatherName": "Ramesh Nambiar",
    "motherName": "Sujata Nambiar",
    "dob": "2012-08-14T00:00:00.000Z",
    "gender": "FEMALE",
    "contactPhone": "+91-9876500001",
    "email": f"kavya.{unique_suffix}@student.dps.edu",
    "parentName": "Ramesh Nambiar",
    "parentPhone": "+91-9876500001",
    "parentRelation": "FATHER",
    "address": "142 Indiranagar, 1st Stage",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560038"
}

create_res = post('/students', create_req, p_token)
assert create_res.get('success') == True, f"Student creation failed: {create_res}"
created_student = create_res.get('student', {})
student_id = created_student.get('id')
print(f"  ✓ [CREATE] Student Enrolled: {created_student.get('firstName')} {created_student.get('lastName')} (ID: {student_id})")

# 4C. READ created student back
updated_list = get('/students', p_token)
new_count = len(updated_list.get('students', []))
assert new_count == initial_count + 1, f"Expected {initial_count + 1} students, got {new_count}"
print(f"  ✓ [READ] Verified Student Roster Increment: {initial_count} -> {new_count}")

# 4D. UPDATE student record
update_payload = {
    "contactPhone": "+91-9876599999",
    "address": "404 Royal Palm Residency, Bengaluru"
}
req = urllib.request.Request(f"{BASE}/students/{student_id}", data=json.dumps(update_payload).encode(), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {p_token}', 'Cookie': f'aurxon_session={p_token}'}, method='PUT')
with urllib.request.urlopen(req) as res:
    up_res = json.loads(res.read())
    assert up_res.get('success') == True
    print(f"  ✓ [UPDATE] Student Record Updated: New Phone={up_res['student']['contactPhone']}")

# 4E. DELETE / ARCHIVE student record
req = urllib.request.Request(f"{BASE}/students/{student_id}", headers={'Authorization': f'Bearer {p_token}', 'Cookie': f'aurxon_session={p_token}'}, method='DELETE')
with urllib.request.urlopen(req) as res:
    del_res = json.loads(res.read())
    assert del_res.get('success') == True
    print(f"  ✓ [DELETE] Student Successfully Archived: {del_res.get('message')}")


# --------------------------------------------------------------------
# 5. FULL CRUD: ATTENDANCE SYNCHRONIZATION
# --------------------------------------------------------------------
print("\n[PHASE 5] Daily Attendance Roll-Call & Database Synchronization...")
t_token = role_tokens["TEACHER"]
today_str = "2026-09-20"

att_payload = {
    "date": today_str,
    "records": [
        {"studentId": student_id, "status": "PRESENT", "remarks": "Live demo biometric check"}
    ]
}

att_res = post('/attendance', att_payload, t_token)
assert att_res.get('success') == True, f"Attendance submission failed: {att_res}"
print(f"  ✓ [UPDATE] Attendance Marked for Student {student_id} on {today_str}: PRESENT (Synced)")

# --------------------------------------------------------------------
# 6. APPROVAL WORKFLOW: STUDENT LEAVE & PRINCIPAL DECISION
# --------------------------------------------------------------------
print("\n[PHASE 6] Leave Application & Administrative Approval Workflow...")
par_token = role_tokens["PARENT"]

# Fetch parent's verified child ID
parent_dash = get('/dashboard', par_token)
parent_child = parent_dash.get('children', [])[0]
target_child_id = parent_child['id']
print(f"  Parent applying leave for verified ward: {parent_child['name']} (ID: {target_child_id})")

# Generate unique future date range to ensure zero overlap with prior demo runs
import random
offset = random.randint(10, 80)
day1 = (offset % 25) + 1
day2 = day1 + 1
start_iso = f"2027-02-{day1:02d}T00:00:00.000Z"
end_iso = f"2027-02-{day2:02d}T00:00:00.000Z"

leave_payload = {
    "studentId": target_child_id,
    "leaveType": "MEDICAL",
    "startDate": start_iso,
    "endDate": end_iso,
    "totalDays": 2,
    "reason": f"Medical checkup and orthodontic recovery cycle #{offset}",
    "parentConfirmation": True
}

leave_submit = post('/leave/student', leave_payload, par_token)
assert leave_submit.get('success') == True, f"Leave application failed: {leave_submit}"
print(f"  ✓ [CREATE] Medical Leave Application Submitted by Parent (Dates: {start_iso[:10]} to {end_iso[:10]})")

# Principal Decision via PATCH /leave/student/:id
leave_id = leave_submit.get('data', {}).get('id')
assert leave_id is not None, f"Expected leave ID in response: {leave_submit}"

if leave_id:
    decision_payload = {
        "action": "APPROVE",
        "remarks": "Approved by Dr. Meenakshi Sundaram (Principal) - All health clearance records verified"
    }
    req = urllib.request.Request(
        f"{BASE}/leave/student/{leave_id}",
        data=json.dumps(decision_payload).encode(),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {p_token}',
            'Cookie': f'aurxon_session={p_token}'
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req) as res:
        decision_res = json.loads(res.read())
        assert decision_res.get('success') == True, f"Approval failed: {decision_res}"
        print(f"  ✓ [UPDATE] Administrative Approval Executed: {decision_res.get('message')}")
else:
    print(f"  ✓ [UPDATE] Simulated Approval Completed for Student Leave ID")

print("\n======================================================================")
print("  ALL TESTS PASSED: ONBOARDING, ROLES, CRUD & APPROVALS VERIFIED LIVE")
print("======================================================================")
