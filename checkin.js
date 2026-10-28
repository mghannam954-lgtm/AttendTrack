/**
 * AttendTrack - Trainee Check-In Portal Logic
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Strict Language Separation
 */

(function () {
  'use strict';

  // 1. Core State & Language
  let currentLang = 'ar'; // Default Arabic for Syria Field

  let sessionData = {
    course: 'UNRWA Staff Development Training',
    location: 'Damascus Headquarters (HQ)',
    trainer: 'Staff Development Trainer',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 02:00 PM',
    sessionId: 'session_default'
  };

  // 2. Catalogs for Bilingual Dynamic Dropdowns
  const departmentCatalog = [
    { key: 'education', en: 'Education Programme', ar: 'برنامج التعليم' },
    { key: 'health', en: 'Health Programme', ar: 'برنامج الصحة' },
    { key: 'rssp', en: 'Relief & Social Services Programme (RSSP)', ar: 'برنامج الإغاثة والخدمات الاجتماعية (RSSP)' },
    { key: 'hr', en: 'Human Resources Department (HR)', ar: 'دائرة الموارد البشرية (HR)' },
    { key: 'procurement', en: 'Procurement & Logistics Department', ar: 'دائرة المشتريات والخدمات اللوجستية' },
    { key: 'finance', en: 'Finance Department', ar: 'دائرة الشؤون المالية' },
    { key: 'security', en: 'Safety & Security Division', ar: 'قسم الأمن والسلامة' },
    { key: 'imtd', en: 'Information Management & Technology (IMTD)', ar: 'دائرة تكنولوجيا المعلومات (IMTD)' },
    { key: 'icip', en: 'Infrastructure & Camp Improvement (ICIP)', ar: 'دائرة الهندسة وتحسين المخيمات (ICIP)' },
    { key: 'operations', en: 'Field Operations & Area Administration', ar: 'إدارة العمليات والمناطق' }
  ];

  const gradeCatalog = [
    { key: 'Grade 5', en: 'Grade 5', ar: 'الدرجة 5' },
    { key: 'Grade 6', en: 'Grade 6', ar: 'الدرجة 6' },
    { key: 'Grade 7', en: 'Grade 7', ar: 'الدرجة 7' },
    { key: 'Grade 8', en: 'Grade 8', ar: 'الدرجة 8' },
    { key: 'Grade 9', en: 'Grade 9', ar: 'الدرجة 9' },
    { key: 'Grade 10', en: 'Grade 10', ar: 'الدرجة 10' },
    { key: 'Grade 11', en: 'Grade 11', ar: 'الدرجة 11' },
    { key: 'Grade 12', en: 'Grade 12', ar: 'الدرجة 12' },
    { key: 'Grade 13', en: 'Grade 13', ar: 'الدرجة 13' },
    { key: 'Grade 14', en: 'Grade 14', ar: 'الدرجة 14' },
    { key: 'Grade 15', en: 'Grade 15', ar: 'الدرجة 15' },
    { key: 'Grade 16', en: 'Grade 16', ar: 'الدرجة 16' },
    { key: 'Grade 17', en: 'Grade 17', ar: 'الدرجة 17' },
    { key: 'Grade 18+', en: 'Grade 18+', ar: 'الدرجة 18 فما فوق' },
    { key: 'Principal Level (PL)', en: 'Principal Level (PL)', ar: 'الدرجة القيادية (PL)' },
    { key: 'Daily Paid / Contract', en: 'Daily Paid / Contract', ar: 'عقد / مياومة' },
    { key: 'Volunteer / Intern', en: 'Volunteer / Intern', ar: 'متطوع / متدرب' }
  ];

  // 3. Bilingual Translation Dictionary
  const translations = {
    ar: {
      portalSubTitle: 'بوابة تسجيل الحضور الإلكتروني',
      cloudOnline: 'متصل سحابياً',
      cloudOffline: 'وضع محلي',
      traineeBannerBadge: 'جلسة تدريبية رسمية معتمدة',
      traineeFormTitle: 'تسجيل الحضور الإلكتروني',
      traineeFormHint: 'يرجى التحقق من صحة البيانات بدقة. سيتم إصدار الشهادة الرسمية بناءً على الاسم المدخل.',
      lblEmpNumber: 'الرقم الوظيفي',
      helpEmpNumber: 'رقمك الوظيفي المعتمد في سجلات الأونروا',
      phEmpNumber: 'مثال: 10458291',
      lblTraineeName: 'اسم المتدرب (باللغة الإنكليزية)',
      phTraineeName: 'مثال: Mohammad Al-Ghanem',
      warnEnglishOnly: 'يرجى كتابة الاسم بالأحرف الإنكليزية فقط لطباعة الشهادة الرسمية.',
      certPreviewBadge: 'معاينة الاسم على الشهادة الرسمية',
      certVerifyPrompt: 'يرجى التأكد من التهجئة الصحيحة للاسم والحروف الكبيرة قبل تأكيد الحضور.',
      lblGender: 'الجنس',
      optMale: 'ذكر',
      optFemale: 'أنثى',
      lblDepartment: 'القسم أو البرنامج',
      optSelectDept: '-- اختر القسم أو البرنامج --',
      optCustomDept: '+ قسم أو برنامج آخر...',
      phCustomDept: 'اكتب اسم القسم هنا...',
      lblJobTitle: 'المسمى الوظيفي',
      phJobTitle: 'مثال: مسؤول إداري، معلم، ممرض',
      lblGrade: 'الدرجة الوظيفية',
      optSelectGrade: '-- اختر الدرجة الوظيفية --',
      btnConfirmAttendance: 'تأكيد وتسجيل الحضور',
      btnSubmitting: 'جاري تسجيل الحضور...',
      successTitle: 'تم تسجيل الحضور بنجاح',
      successDesc: 'تم توثيق حضورك رسمياً في سجلات قسم تطوير الموظفين والتدريب بدائرة الموارد البشرية.',
      btnRegisterAnother: 'تسجيل زميل آخر',
      btnGoToEval: 'تقييم التدريب الآن (استمارة سرية)',
      rcptName: 'الاسم الكامل:',
      rcptEmpNo: 'الرقم الوظيفي:',
      rcptGender: 'الجنس:',
      rcptDept: 'القسم / البرنامج:',
      rcptTitle: 'المسمى الوظيفي:',
      rcptGrade: 'الدرجة الوظيفية:',
      rcptCourse: 'الدورة التدريبية:',
      rcptLocation: 'مكان التدريب:',
      rcptTime: 'وقت التسجيل:',
      toastEmpReq: 'يرجى إدخال الرقم الوظيفي.',
      toastEmpDigits: 'الرقم الوظيفي يجب أن يتكون من أرقام فقط.',
      toastNameReq: 'يرجى كتابة الاسم باللغة الإنكليزية.',
      toastNameArabicWarn: 'تم إدخال أحرف عربية! يجب كتابة الاسم بالأحرف الإنكليزية فقط لإصدار الشهادة.',
      toastNameInvalid: 'الاسم يجب أن يتكون من حروف إنكليزية فقط.',
      toastGenderReq: 'يرجى تحديد الجنس.',
      toastDeptReq: 'يرجى اختيار القسم أو البرنامج.',
      toastJobReq: 'يرجى كتابة المسمى الوظيفي.',
      toastGradeReq: 'يرجى اختيار الدرجة الوظيفية.'
    },
    en: {
      portalSubTitle: 'Electronic Attendance Registration Portal',
      cloudOnline: 'Cloud Connected',
      cloudOffline: 'Local Mode',
      traineeBannerBadge: 'Official Accredited Training Session',
      traineeFormTitle: 'Electronic Attendance Registration',
      traineeFormHint: 'Please verify your details carefully. Your official certificate will be generated using the exact name entered below.',
      lblEmpNumber: 'Employee Number',
      helpEmpNumber: 'Your official UNRWA personnel number',
      phEmpNumber: 'e.g. 10458291',
      lblTraineeName: 'Trainee Full Name (in English)',
      phTraineeName: 'e.g. Mohammad Al-Ghanem',
      warnEnglishOnly: 'Please enter English letters only for official certificate printing.',
      certPreviewBadge: 'Official Certificate Name Preview',
      certVerifyPrompt: 'Please verify spelling and capitalization carefully before submitting.',
      lblGender: 'Gender',
      optMale: 'Male',
      optFemale: 'Female',
      lblDepartment: 'Department / Programme',
      optSelectDept: '-- Select Department or Programme --',
      optCustomDept: '+ Other / Custom Department...',
      phCustomDept: 'Type custom department here...',
      lblJobTitle: 'Job Title',
      phJobTitle: 'e.g. Administrative Officer, Teacher, Nurse',
      lblGrade: 'Grade',
      optSelectGrade: '-- Select Grade --',
      btnConfirmAttendance: 'Confirm & Submit Attendance',
      btnSubmitting: 'Submitting Attendance...',
      successTitle: 'Attendance Confirmed Successfully',
      successDesc: 'Your attendance has been officially documented with the UNRWA Staff Development & Training Division.',
      btnRegisterAnother: 'Register Another Colleague',
      btnGoToEval: 'Evaluate Training Now (Anonymous Form)',
      rcptName: 'Full Name:',
      rcptEmpNo: 'Employee Number:',
      rcptGender: 'Gender:',
      rcptDept: 'Department / Programme:',
      rcptTitle: 'Job Title:',
      rcptGrade: 'Grade:',
      rcptCourse: 'Course Title:',
      rcptLocation: 'Training Venue:',
      rcptTime: 'Check-in Time:',
      toastEmpReq: 'Please enter your employee number.',
      toastEmpDigits: 'Employee number must contain numbers only.',
      toastNameReq: 'Please enter your full name in English.',
      toastNameArabicWarn: 'Arabic characters detected! Please write your name in English letters only.',
      toastNameInvalid: 'Name must contain English letters only.',
      toastGenderReq: 'Please select your gender.',
      toastDeptReq: 'Please select your department or programme.',
      toastJobReq: 'Please enter your job title.',
      toastGradeReq: 'Please select your grade.'
    }
  };

  // 4. Firebase Configuration & Safe Initialization
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
    const dict = translations[currentLang];
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = dict.cloudOnline;
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = dict.cloudOffline;
    }
  }

  // 5. Dynamic Dropdowns Population
  function populateDepartmentSelect(lang) {
    const sel = document.getElementById('deptSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectDept}</option>`;
    departmentCatalog.forEach(d => {
      const text = d[lang];
      const isSelected = (currentVal === d.en || currentVal === d.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    html += `<option value="__custom__" ${currentVal === '__custom__' ? 'selected' : ''}>${dict.optCustomDept}</option>`;
    sel.innerHTML = html;
  }

  function populateGradeSelect(lang) {
    const sel = document.getElementById('gradeSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectGrade}</option>`;
    gradeCatalog.forEach(g => {
      const text = g[lang];
      const isSelected = (currentVal === g.en || currentVal === g.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    sel.innerHTML = html;
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

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.placeholder = dict[key];
    });

    populateDepartmentSelect(lang);
    populateGradeSelect(lang);
    updateCloudStatus(db !== null);
  }

  // 6. Parse URL Parameters
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

  // 7. Strict English Name Validation & Live Preview
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

  // 8. Custom Department Handling
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

  // 9. Language Switcher Button
  function initLanguageListener() {
    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
      });
    }
  }

  // 10. Submit Form with Timeout Protection
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
      showToast(dict.toastEmpReq, 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!/^\d{4,12}$/.test(empNumber)) {
      showToast(dict.toastEmpDigits, 'error');
      if (empNumInput) empNumInput.focus();
      return;
    }
    if (!traineeName) {
      showToast(dict.toastNameReq, 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (arabicRegex.test(traineeName)) {
      showToast(dict.toastNameArabicWarn, 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!englishRegex.test(traineeName)) {
      showToast(dict.toastNameInvalid, 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!gender) {
      showToast(dict.toastGenderReq, 'error');
      return;
    }
    if (!department || department === '__custom__') {
      showToast(dict.toastDeptReq, 'error');
      if (deptSel) deptSel.focus();
      return;
    }
    if (!jobTitle) {
      showToast(dict.toastJobReq, 'error');
      if (jobInput) jobInput.focus();
      return;
    }
    if (!grade) {
      showToast(dict.toastGradeReq, 'error');
      if (gradeSel) gradeSel.focus();
      return;
    }

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

    try {
      const localAttendees = JSON.parse(localStorage.getItem('attendtrack_local_receipts_v1') || '[]');
      localAttendees.push(attendeeData);
      localStorage.setItem('attendtrack_local_receipts_v1', JSON.stringify(localAttendees));
    } catch (e) {
      console.warn(e);
    }

    showSuccessReceipt(attendeeData, cloudSynced);
  }

  function showSuccessReceipt(data, cloudSynced) {
    const formCard = document.getElementById('traineeFormCard');
    const successCard = document.getElementById('checkinSuccessCard');

    if (formCard) formCard.classList.add('hidden');
    if (successCard) successCard.classList.remove('hidden');

    const genderDisplay = data.gender === 'Male'
      ? ((currentLang === 'ar') ? 'ذكر' : 'Male')
      : ((currentLang === 'ar') ? 'أنثى' : 'Female');

    document.getElementById('rcptNameVal').textContent = data.name;
    document.getElementById('rcptEmpNoVal').textContent = data.empNumber;
    document.getElementById('rcptGenderVal').textContent = genderDisplay;
    document.getElementById('rcptDeptVal').textContent = data.department;
    document.getElementById('rcptTitleVal').textContent = data.jobTitle;
    document.getElementById('rcptGradeVal').textContent = data.grade;
    document.getElementById('rcptCourseVal').textContent = data.course;
    document.getElementById('rcptLocationVal').textContent = data.location;
    document.getElementById('rcptTimeVal').textContent = data.displayTime + ' (' + data.date + ')';

    const btnEval = document.getElementById('btnGoToEvaluation');
    if (btnEval) {
      const evalParams = new URLSearchParams();
      evalParams.set('c', sessionData.course);
      evalParams.set('loc', sessionData.location);
      evalParams.set('tr', sessionData.trainer);
      evalParams.set('d', sessionData.date);
      evalParams.set('t', sessionData.time);
      evalParams.set('sid', sessionData.sessionId);
      btnEval.href = 'eval.html?' + evalParams.toString();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const btnNew = document.getElementById('btnNewCheckin');
    if (btnNew) {
      btnNew.onclick = () => {
        const form = document.getElementById('traineeCheckinForm');
        if (form) form.reset();
        const btnSubmit = document.getElementById('btnSubmitCheckin');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> <span>${translations[currentLang].btnConfirmAttendance}</span>`;
        }
        const certLiveName = document.getElementById('certLiveName');
        if (certLiveName) certLiveName.textContent = 'YOUR NAME IN ENGLISH';
        const nameWarning = document.getElementById('nameValidationWarning');
        if (nameWarning) nameWarning.classList.add('hidden');

        if (successCard) successCard.classList.add('hidden');
        if (formCard) formCard.classList.remove('hidden');
      };
    }
  }

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

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    initSessionFromUrl();
    initNameInputListener();
    initDepartmentListener();
    initLanguageListener();
    initSubmitListener();
    applyLanguage(currentLang);
  });

})();
