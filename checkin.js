/**
 * AttendTrack - Trainee Check-In Portal
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Full Bilingual Support + Single-line Layout
 */

(function () {
  'use strict';

  // 1. Core State & Language (Declared first to avoid TDZ errors)
  let currentLang = 'ar'; // Default Arabic for Syria Field

  let sessionData = {
    course: 'UNRWA Staff Development Training',
    location: 'Damascus Headquarters (HQ)',
    trainer: 'Staff Development Trainer',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 02:00 PM',
    sessionId: 'session_default'
  };

  // 2. Bilingual Dictionary
  const translations = {
    ar: {
      portalSubTitle: 'بوابة تسجيل المتدربين',
      cloudOnline: 'متصل',
      traineeBannerBadge: 'جلسة تدريبية رسمية معتمدة',
      traineeFormTitle: 'تسجيل الحضور الإلكتروني',
      traineeFormHint: 'يرجى تعبئة البيانات بدقة. سيظهر اسمك على الشهادة تماماً كما هو مكتوب أدناه.',
      lblEmpNumber: 'الرقم الوظيفي',
      helpEmpNumber: 'رقمك الوظيفي المعتمد في الأونروا',
      phEmpNumber: 'مثال: 10458291',
      lblTraineeName: 'اسم المتدرب (باللغة الإنكليزية)',
      warnEnglishOnly: 'يرجى كتابة الاسم بالأحرف الإنجليزية فقط لطباعة الشهادة الرسمية.',
      certPreviewBadge: 'معاينة الاسم على الشهادة',
      certVerifyPrompt: 'تأكد من صحة كتابة الاسم والحروف الكبيرة قبل تأكيد الحضور.',
      lblGender: 'الجنس',
      optMale: 'ذكر',
      optFemale: 'أنثى',
      lblDepartment: 'القسم / الدائرة',
      optSelectDept: '-- اختر القسم أو البرنامج --',
      optCustomDept: '+ قسم أو دائرة أخرى...',
      phCustomDept: 'اكتب اسم القسم هنا...',
      lblJobTitle: 'المسمى الوظيفي',
      phJobTitle: 'مثال: مسؤول إداري، معلم',
      lblGrade: 'الدرجة الوظيفية',
      optSelectGrade: '-- اختر الدرجة --',
      optContract: 'عقد / مياومة (Contract)',
      optVolunteer: 'متطوع / متدرب (Volunteer)',
      btnConfirmAttendance: 'تأكيد وتسجيل الحضور',
      btnSubmitting: 'جاري تسجيل الحضور...',
      successTitle: 'تم تسجيل حضورك بنجاح!',
      successDesc: 'تم التحقق من بياناتك وتوثيق حضورك في السجلات الرسمية لقسم تطوير الموظفين والتدريب.',
      btnRegisterAnother: 'تسجيل زميل آخر',
      rcptName: 'الاسم:',
      rcptEmpNo: 'الرقم الوظيفي:',
      rcptGender: 'الجنس:',
      rcptDept: 'القسم:',
      rcptTitle: 'المسمى الوظيفي:',
      rcptGrade: 'الدرجة:',
      rcptCourse: 'الدورة:',
      rcptLocation: 'المكان:',
      rcptTime: 'الوقت:'
    },
    en: {
      portalSubTitle: 'Trainee Attendance Portal',
      cloudOnline: 'Online',
      traineeBannerBadge: 'Official UNRWA Training Session',
      traineeFormTitle: 'Electronic Attendance Registration',
      traineeFormHint: 'Fill out your details accurately. Your name will appear on the certificate exactly as typed below.',
      lblEmpNumber: 'Employee Number',
      helpEmpNumber: 'Your official UNRWA personnel number',
      phEmpNumber: 'e.g. 10458291',
      lblTraineeName: 'Trainee Name (English)',
      warnEnglishOnly: 'Please write your name in English letters only for official certificate issuance.',
      certPreviewBadge: 'Certificate Name Preview',
      certVerifyPrompt: 'Verify spelling and capitalization carefully before submitting.',
      lblGender: 'Gender',
      optMale: 'Male',
      optFemale: 'Female',
      lblDepartment: 'Department / Programme',
      optSelectDept: '-- Select Department --',
      optCustomDept: '+ Other / Custom Department...',
      phCustomDept: 'Type custom department here...',
      lblJobTitle: 'Job Title',
      phJobTitle: 'e.g. Administrative Officer, Teacher',
      lblGrade: 'Grade',
      optSelectGrade: '-- Select Grade --',
      optContract: 'Daily Paid / Contract',
      optVolunteer: 'Volunteer / Intern',
      btnConfirmAttendance: 'Confirm & Submit Attendance',
      btnSubmitting: 'Submitting Attendance...',
      successTitle: 'Attendance Confirmed Successfully!',
      successDesc: 'Your information has been verified and registered live with UNRWA Staff Development & Training Division.',
      btnRegisterAnother: 'Register Another Colleague',
      rcptName: 'Name:',
      rcptEmpNo: 'Employee #:',
      rcptGender: 'Gender:',
      rcptDept: 'Department:',
      rcptTitle: 'Job Title:',
      rcptGrade: 'Grade:',
      rcptCourse: 'Course:',
      rcptLocation: 'Location:',
      rcptTime: 'Timestamp:'
    }
  };

  // 3. Firebase Configuration & Safe Initialization
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
      console.log('Firebase Realtime Database initialized in Trainee Portal.');
    } else {
      console.warn('Firebase SDK not found; local storage mode enabled.');
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }

  function updateCloudStatus(isOnline) {
    const badge = document.getElementById('cloudStatusBadge');
    const text = document.getElementById('cloudStatusText');
    if (!badge || !text) return;
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = (currentLang === 'ar') ? 'متصل' : 'Online';
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = (currentLang === 'ar') ? 'محلي' : 'Local';
    }
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    const langLabel = document.getElementById('currentLangLabel');
    if (langLabel) {
      langLabel.textContent = (lang === 'ar') ? 'English' : 'العربية';
    }

    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    const empInput = document.getElementById('empNumberInput');
    if (empInput && dict.phEmpNumber) empInput.placeholder = dict.phEmpNumber;

    const jobInput = document.getElementById('jobTitleInput');
    if (jobInput && dict.phJobTitle) jobInput.placeholder = dict.phJobTitle;

    const deptCustom = document.getElementById('deptCustomInput');
    if (deptCustom && dict.phCustomDept) deptCustom.placeholder = dict.phCustomDept;

    updateCloudStatus(db !== null);
  }

  // 4. Parse URL Parameters
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
      sessionData.sessionId = 'session_' + encodeURIComponent((sessionData.course + '_' + sessionData.date).replace(/[^a-zA-Z0-9]/g, '_'));
    }

    renderSessionHeaders();

    // If query params were missing, try fetching active session from Firebase with a safe timeout
    if (db && (!c || !sid)) {
      const fetchPromise = db.ref('active_session').once('value');
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
      Promise.race([fetchPromise, timeoutPromise]).then((snap) => {
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

  // 5. Strict English Name Validation & Live Preview
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const englishRegex = /^[A-Za-z\s.'-]+$/;

  function initNameInputListener() {
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

        const trimmed = rawVal.trim();
        if (trimmed.length > 0) {
          if (certLiveName) certLiveName.textContent = trimmed.toUpperCase();
        } else {
          if (certLiveName) certLiveName.textContent = 'YOUR NAME IN ENGLISH';
        }
      });
    }
  }

  // 6. Custom Department Handling
  function initDepartmentListener() {
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
  }

  // 7. Language Switcher Button
  function initLanguageListener() {
    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
      });
    }
  }

  // 8. Submit Form with Timeout Protection
  function initSubmitListener() {
    const btnSubmit = document.getElementById('btnSubmitCheckin');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleCheckinSubmit);
    }
  }

  async function handleCheckinSubmit() {
    const btnSubmit = document.getElementById('btnSubmitCheckin');
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

    const dict = translations[currentLang];

    // Validations
    if (!empNumber) {
      showToast((currentLang === 'ar') ? 'يرجى إدخال الرقم الوظيفي' : 'Please enter Employee Number', 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!/^\d{4,12}$/.test(empNumber)) {
      showToast((currentLang === 'ar') ? 'الرقم الوظيفي يجب أن يتكون من أرقام فقط' : 'Employee number must be digits only', 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!traineeName) {
      showToast((currentLang === 'ar') ? 'يرجى كتابة الاسم باللغة الإنكليزية' : 'Please enter your name in English', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (arabicRegex.test(traineeName)) {
      showToast((currentLang === 'ar') ? 'تم اكتشاف حروف عربية! يرجى كتابة الاسم بالإنكليزية لطباعة الشهادة' : 'Arabic characters detected! Please write name in English.', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!englishRegex.test(traineeName)) {
      showToast((currentLang === 'ar') ? 'الاسم يجب أن يحتوي على حروف إنكليزية فقط' : 'Name must contain English letters only', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!gender) {
      showToast((currentLang === 'ar') ? 'يرجى تحديد الجنس (ذكر / أنثى)' : 'Please select your gender', 'error');
      return;
    }
    if (!department || department === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى تحديد القسم أو البرنامج' : 'Please select Department', 'error');
      if (deptSel) deptSel.focus();
      return;
    }
    if (!jobTitle) {
      showToast((currentLang === 'ar') ? 'يرجى كتابة المسمى الوظيفي' : 'Please enter Job Title', 'error');
      if (jobInput) jobInput.focus();
      return;
    }
    if (!grade) {
      showToast((currentLang === 'ar') ? 'يرجى اختيار الدرجة الوظيفية' : 'Please select Grade', 'error');
      if (gradeSel) gradeSel.focus();
      return;
    }

    // Disable button to prevent double tap
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${dict.btnSubmitting}`;
    }

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

    // 1. Send to Firebase Realtime Database with 3.5s timeout guarantee
    let cloudSynced = false;
    if (db) {
      try {
        const sessionRef = db.ref('sessions/' + sessionData.sessionId + '/attendees');
        const pushPromise = sessionRef.push(attendeeData);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 3500));
        await Promise.race([pushPromise, timeoutPromise]);
        cloudSynced = true;
        console.log('Saved to Firebase Realtime Database.');
      } catch (err) {
        console.warn('Firebase network timeout or error, continuing with local confirmation:', err);
      }
    }

    // 2. Local Backup
    try {
      const localAttendees = JSON.parse(localStorage.getItem('attendtrack_local_receipts_v1') || '[]');
      localAttendees.push(attendeeData);
      localStorage.setItem('attendtrack_local_receipts_v1', JSON.stringify(localAttendees));
    } catch (e) {
      console.warn(e);
    }

    // Trigger Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    showSuccessReceipt(attendeeData, cloudSynced);
  }

  function showSuccessReceipt(data, cloudSynced) {
    const formCard = document.getElementById('traineeFormCard');
    const successCard = document.getElementById('checkinSuccessCard');

    if (formCard) formCard.classList.add('hidden');
    if (successCard) successCard.classList.remove('hidden');

    const genderDisplay = data.gender === 'Male' 
      ? ((currentLang === 'ar') ? 'ذكر (Male)' : 'Male') 
      : ((currentLang === 'ar') ? 'أنثى (Female)' : 'Female');

    document.getElementById('rcptNameVal').textContent = data.name;
    document.getElementById('rcptEmpNoVal').textContent = data.empNumber;
    document.getElementById('rcptGenderVal').textContent = genderDisplay;
    document.getElementById('rcptDeptVal').textContent = data.department;
    document.getElementById('rcptTitleVal').textContent = data.jobTitle;
    document.getElementById('rcptGradeVal').textContent = data.grade;
    document.getElementById('rcptCourseVal').textContent = data.course;
    document.getElementById('rcptLocationVal').textContent = data.location;
    document.getElementById('rcptTimeVal').textContent = data.displayTime + ' (' + data.date + ')';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (cloudSynced) {
      showToast((currentLang === 'ar') ? 'تم تسجيل حضورك ووصل لشاشة المدرب مباشرة!' : 'Attendance registered live to trainer dashboard!', 'success');
    } else {
      showToast((currentLang === 'ar') ? 'تم تسجيل الحضور محلياً بنجاح' : 'Attendance confirmed locally', 'success');
    }
  }

  // Register Another Colleague
  function initRegisterAnotherListener() {
    const btnNewCheckin = document.getElementById('btnNewCheckin');
    const btnSubmit = document.getElementById('btnSubmitCheckin');
    const certLiveName = document.getElementById('certLiveName');

    if (btnNewCheckin) {
      btnNewCheckin.addEventListener('click', function () {
        const formCard = document.getElementById('traineeFormCard');
        const successCard = document.getElementById('checkinSuccessCard');

        if (formCard) formCard.classList.remove('hidden');
        if (successCard) successCard.classList.add('hidden');

        const form = document.getElementById('traineeCheckinForm');
        if (form) form.reset();

        const dict = translations[currentLang];
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span data-i18n="btnConfirmAttendance">${dict.btnConfirmAttendance}</span>`;
        }

        if (certLiveName) certLiveName.textContent = 'YOUR NAME IN ENGLISH';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
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

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    initSessionFromUrl();
    initNameInputListener();
    initDepartmentListener();
    initLanguageListener();
    initSubmitListener();
    initRegisterAnotherListener();
  });

})();
