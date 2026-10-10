/**
 * AttendTrack - Trainee Check-In Portal
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Strict English Certificate Validation
 */

(function () {
  'use strict';

  // 1. Firebase Initialization
  const firebaseConfig = {
    apiKey: "AIzaSyAMZ9MPm-SRsJJ4yVcjugnbZluFFTrWkYU",
    authDomain: "unrwa-attend.firebaseapp.com",
    databaseURL: "https://unrwa-attend-default-rtdb.firebaseio.com",
    projectId: "unrwa-attend",
    storageBucket: "unrwa-attend.firebasestorage.app",
    messagingSenderId: "171058306827",
    appId: "1:171058306827:web:878d2cfcffc35b19524c0e",
    measurementId: "G-PWX4CL84BV"
  };

  let db = null;
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      console.log('Firebase Realtime Database initialized successfully.');
      updateCloudStatus(true);
    } else {
      console.warn('Firebase SDK not found; using fallback local storage mode.');
      updateCloudStatus(false);
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
    updateCloudStatus(false);
  }

  function updateCloudStatus(isOnline) {
    const badge = document.getElementById('cloudStatusBadge');
    const text = document.getElementById('cloudStatusText');
    if (!badge || !text) return;
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = 'Cloud Connected / متصل';
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = 'Local Mode / وضع محلي';
    }
  }

  // Session Data & State
  let sessionData = {
    course: 'UNRWA Staff Development Training',
    location: 'Damascus Headquarters (HQ)',
    trainer: 'Staff Development Trainer',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 02:00 PM',
    sessionId: 'session_default'
  };

  // 2. Parse URL Parameters
  function initSessionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const loc = params.get('loc');
    const tr = params.get('tr');
    const d = params.get('d');
    const t = params.get('t');
    const sid = params.get('sid');

    if (c) sessionData.course = decodeURIComponent(c);
    if (loc) sessionData.location = decodeURIComponent(loc);
    if (tr) sessionData.trainer = decodeURIComponent(tr);
    if (d) sessionData.date = decodeURIComponent(d);
    if (t) sessionData.time = decodeURIComponent(t);
    if (sid) {
      sessionData.sessionId = decodeURIComponent(sid);
    } else if (c) {
      // Create deterministic session id from course and date
      sessionData.sessionId = 'session_' + encodeURIComponent((sessionData.course + '_' + sessionData.date).replace(/[^a-zA-Z0-9]/g, '_'));
    }

    renderSessionHeaders();

    // If connected to Firebase, also sync session details if active on cloud
    if (db && (!c || !sid)) {
      db.ref('active_session').once('value').then((snap) => {
        const val = snap.val();
        if (val) {
          sessionData = { ...sessionData, ...val };
          renderSessionHeaders();
        }
      }).catch(console.warn);
    }
  }

  function renderSessionHeaders() {
    const elCourse = document.getElementById('traineeCourseHeader');
    const elLoc = document.getElementById('traineeLocationHeader');
    const elTr = document.getElementById('traineeTrainerHeader');
    const elDate = document.getElementById('traineeDateHeader');
    const elTime = document.getElementById('traineeTimeHeader');
    const elCertCourse = document.getElementById('certLiveCourse');

    if (elCourse) elCourse.textContent = sessionData.course;
    if (elLoc) elLoc.textContent = sessionData.location;
    if (elTr) elTr.textContent = sessionData.trainer;
    if (elDate) elDate.textContent = sessionData.date;
    if (elTime) elTime.textContent = sessionData.time;
    if (elCertCourse) elCertCourse.textContent = sessionData.course;
  }

  // 3. Strict English Name Validation & Live Preview
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const englishRegex = /^[A-Za-z\s.'-]+$/;

  const traineeNameInput = document.getElementById('traineeNameInput');
  const nameWarning = document.getElementById('nameValidationWarning');
  const certLiveName = document.getElementById('certLiveName');

  if (traineeNameInput) {
    traineeNameInput.addEventListener('input', function () {
      const rawVal = this.value;

      if (arabicRegex.test(rawVal)) {
        if (nameWarning) nameWarning.classList.remove('hidden');
        traineeNameInput.classList.add('input-error');
      } else {
        if (nameWarning) nameWarning.classList.add('hidden');
        traineeNameInput.classList.remove('input-error');
      }

      // Update Live Certificate
      const trimmed = rawVal.trim();
      if (trimmed.length > 0) {
        if (certLiveName) certLiveName.textContent = trimmed.toUpperCase();
      } else {
        if (certLiveName) certLiveName.textContent = 'YOUR NAME IN ENGLISH';
      }
    });
  }

  // 4. Custom Department Handling
  const deptSelect = document.getElementById('deptSelect');
  const deptCustomInput = document.getElementById('deptCustomInput');
  if (deptSelect && deptCustomInput) {
    deptSelect.addEventListener('change', function () {
      if (this.value === '__custom__') {
        deptCustomInput.classList.remove('hidden');
        deptCustomInput.required = true;
        deptCustomInput.focus();
      } else {
        deptCustomInput.classList.add('hidden');
        deptCustomInput.required = false;
      }
    });
  }

  // 5. Submit Form
  const btnSubmit = document.getElementById('btnSubmitCheckin');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleCheckinSubmit);
  }

  async function handleCheckinSubmit() {
    const empNumInput = document.getElementById('empNumberInput');
    const nameInput = document.getElementById('traineeNameInput');
    const genderChecked = document.querySelector('input[name="traineeGender"]:checked');
    const deptSel = document.getElementById('deptSelect');
    const deptCustom = document.getElementById('deptCustomInput');
    const jobInput = document.getElementById('jobTitleInput');
    const gradeSel = document.getElementById('gradeSelect');

    const empNumber = empNumInput ? empNumInput.value.trim() : '';
    const traineeName = nameInput ? nameInput.value.trim() : '';
    const gender = genderChecked ? genderChecked.value : '';
    let department = deptSel ? deptSel.value : '';
    if (department === '__custom__' && deptCustom) {
      department = deptCustom.value.trim();
    }
    const jobTitle = jobInput ? jobInput.value.trim() : '';
    const grade = gradeSel ? gradeSel.value : '';

    // Validations
    if (!empNumber) {
      showToast('Please enter your UNRWA Employee Number / يرجى إدخال رقم الموظف', 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!/^\d{4,12}$/.test(empNumber)) {
      showToast('Employee number must contain numbers only (5-10 digits) / رقم الموظف يجب أن يتكون من أرقام فقط', 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!traineeName) {
      showToast('Please enter your name in English / يرجى إدخال الاسم بالإنجليزية', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (arabicRegex.test(traineeName)) {
      showToast('Arabic letters detected! Name must be English only for certificate printing / يجب كتابة الاسم باللغة الإنكليزية حصراً لطباعة الشهادة', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!englishRegex.test(traineeName)) {
      showToast('Name can only contain English letters, spaces, hyphens and dots / الاسم يجب أن يحتوي على أحرف إنكليزية فقط', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!gender) {
      showToast('Please select your gender (Male / Female) / يرجى تحديد الجنس', 'error');
      return;
    }
    if (!department || department === '__custom__') {
      showToast('Please select or specify your department / يرجى تحديد القسم أو الدائرة', 'error');
      if (deptSel) deptSel.focus();
      return;
    }
    if (!jobTitle) {
      showToast('Please enter your Job Title / يرجى كتابة المسمى الوظيفي', 'error');
      if (jobInput) jobInput.focus();
      return;
    }
    if (!grade) {
      showToast('Please select your grade / يرجى اختيار الدرجة الوظيفية', 'error');
      if (gradeSel) gradeSel.focus();
      return;
    }

    // Disable button to prevent duplicate submissions
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting / جاري التأكيد...';

    const now = new Date();
    const attendeeData = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      empNumber: empNumber,
      name: traineeName,
      gender: gender,
      department: department,
      jobTitle: jobTitle,
      grade: grade,
      course: sessionData.course,
      location: sessionData.location,
      trainer: sessionData.trainer,
      date: sessionData.date,
      time: sessionData.time,
      sessionId: sessionData.sessionId,
      timestamp: now.toISOString(),
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Send to Firebase Realtime Database
    let cloudSynced = false;
    if (db) {
      try {
        const sessionRef = db.ref('sessions/' + sessionData.sessionId + '/attendees');
        await sessionRef.push(attendeeData);
        cloudSynced = true;
        console.log('Attendee saved to Firebase Realtime Database successfully.');
      } catch (err) {
        console.error('Failed to write to Firebase:', err);
      }
    }

    // 2. Local Storage Backup
    try {
      const localAttendees = JSON.parse(localStorage.getItem('attendtrack_local_receipts_v1') || '[]');
      localAttendees.push(attendeeData);
      localStorage.setItem('attendtrack_local_receipts_v1', JSON.stringify(localAttendees));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    // Trigger Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Show Success Card
    showSuccessReceipt(attendeeData, cloudSynced);
  }

  function showSuccessReceipt(data, cloudSynced) {
    const formCard = document.getElementById('traineeFormCard');
    const successCard = document.getElementById('checkinSuccessCard');

    if (formCard) formCard.classList.add('hidden');
    if (successCard) successCard.classList.remove('hidden');

    document.getElementById('rcptNameVal').textContent = data.name;
    document.getElementById('rcptEmpNoVal').textContent = data.empNumber;
    document.getElementById('rcptGenderVal').textContent = data.gender;
    document.getElementById('rcptDeptVal').textContent = data.department;
    document.getElementById('rcptTitleVal').textContent = data.jobTitle;
    document.getElementById('rcptGradeVal').textContent = data.grade;
    document.getElementById('rcptCourseVal').textContent = data.course;
    document.getElementById('rcptLocationVal').textContent = data.location;
    document.getElementById('rcptTimeVal').textContent = data.displayTime + ' (' + data.date + ')';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (cloudSynced) {
      showToast('Attendance recorded & synced with trainer laptop live! / تم تسجيل حضورك ووصل بنجاح للابتوب المدرب!', 'success');
    } else {
      showToast('Attendance confirmed locally / تم تسجيل الحضور محلياً بنجاح', 'success');
    }
  }

  // Register Another Attendee Button
  const btnNewCheckin = document.getElementById('btnNewCheckin');
  if (btnNewCheckin) {
    btnNewCheckin.addEventListener('click', function () {
      const formCard = document.getElementById('traineeFormCard');
      const successCard = document.getElementById('checkinSuccessCard');

      if (formCard) formCard.classList.remove('hidden');
      if (successCard) successCard.classList.add('hidden');

      // Reset form fields
      const form = document.getElementById('traineeCheckinForm');
      if (form) form.reset();

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-check-circle"></i> <span data-i18n="btnConfirmAttendance">Confirm & Submit Attendance (تأكيد الحضور)</span>';
      }

      if (certLiveName) certLiveName.textContent = 'YOUR NAME IN ENGLISH';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Toast Function
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
      <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', initSessionFromUrl);

})();
