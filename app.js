/**
 * AttendTrack - UNRWA HR Smart Training & Attendance Portal
 * Production-ready Client Application Logic
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE & STORAGE KEYS
  // =========================================================================
  const STORAGE_KEY_SESSION = 'attendtrack_active_session_v1';
  const STORAGE_KEY_ROSTER = 'attendtrack_roster_v1';
  const STORAGE_KEY_LANG = 'attendtrack_lang_v1';
  const BROADCAST_CHANNEL_NAME = 'attendtrack_sync_channel';

  // Multi-tab synchronization channel
  let syncChannel = null;
  try {
    if ('BroadcastChannel' in window) {
      syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }

  // Active Session (starts as null until HR explicitly generates it)
  const todayISO = new Date().toISOString().split('T')[0];
  let currentSession = null;

  // Attendees List
  let attendeesList = [];

  // Active Language ('en' or 'ar')
  let currentLang = 'en';

  // QR Code Objects
  let adminQr = null;
  let projectorQr = null;
  let flyerQr = null;

  // =========================================================================
  // 2. DICTIONARY (TRANSLATIONS EN / AR)
  // =========================================================================
  const translations = {
    en: {
      navTrainer: 'HR / Trainer',
      navTrainee: 'Trainee Check-In',
      badgeOfficial: 'Official UNRWA Staff Development Portal',
      adminHeroTitle: 'Smart Attendance & Digital Certificate Suite',
      adminHeroDesc: 'Generate dynamic QR codes for mobile attendance registration with live English name validation and single-click Excel export.',
      statRegistered: 'Total Registered',
      statActiveSession: 'Active Session',
      sessionSetupTitle: '1. Session Details (إعداد الجلسة)',
      sessionSetupHint: 'Set details to activate session QR',
      lblCourseName: 'Course / Training Name (اسم الدورة)',
      optSelectCourse: '-- Select Course (اختر الدورة) --',
      lblTrainerName: 'Trainer Name (اسم المدرب)',
      lblLocation: 'Location / Duty Station (المكان)',
      optSelectLocation: '-- Select Location (اختر المكان) --',
      lblDate: 'Session Date (التاريخ)',
      lblTime: 'Timing (التوقيت)',
      btnGenerateQR: 'Generate QR & Activate Session',
      qrDisplayTitle: '2. Dynamic Session QR Code',
      statusLive: 'Active & Ready',
      statusStandby: 'Awaiting Setup',
      standbyTitle: 'No Session Generated Yet',
      standbyDesc: 'Please fill in the training details on the left (Course, Trainer, Location, Date, Time) and click "Generate QR & Activate Session" to create your official session QR code.',
      btnProjectorMode: 'Projector Mode',
      btnPrintFlyer: 'Print A4 Poster',
      btnCopyLink: 'Copy Link',
      btnTestCheckin: 'Test Attendee View',
      hostLabel: 'QR Destination Link:',
      btnEditHost: 'Change',
      rosterTitle: '3. Live Training Attendance Feed',
      rosterSubtitle: 'Real-time attendee list. Names verified in English for certificate issuance.',
      searchPlaceholder: 'Search by name, number, department...',
      btnExportExcel: 'Export to Excel (.xlsx)',
      statTotalAttendees: 'Total Attendees:',
      statGenderRatio: 'Gender (M / F):',
      statDepts: 'Departments:',
      statLatestCheckin: 'Latest Check-in:',
      thEmpNo: 'Employee #',
      thTraineeName: 'Trainee Name (English)',
      thGender: 'Gender',
      thDepartment: 'Department',
      thJobTitle: 'Title',
      thGrade: 'Grade',
      thTimestamp: 'Time',
      thActions: 'Actions',
      emptyStateTitle: 'No Attendees Registered Yet',
      emptyStateDesc: 'Scan the QR code from any smartphone to record instant attendance.',
      traineeBannerBadge: 'UNRWA Official Training Session',
      traineeFormTitle: 'Electronic Attendance Registration',
      traineeFormHint: 'Fill out your details accurately. Your name will appear on the certificate exactly as typed below.',
      lblEmpNumber: 'Employee Number (رقم الموظف)',
      helpEmpNumber: 'Your official UNRWA staff/personnel number',
      lblTraineeName: 'Trainee Name (اسم المتدرب بالإنجليزية)',
      warnEnglishOnly: 'Please write your name in English letters only. Arabic characters are not accepted for certificate printing.',
      certPreviewBadge: 'Live Certificate Name Preview (معاينة حية للاسم على الشهادة)',
      certCertifiesThat: 'This is to certify that',
      certCompleted: 'has completed the training program in',
      certVerifyPrompt: 'Verify spelling and capital letters carefully before submitting.',
      lblGender: 'Gender (الجنس)',
      optMale: 'Male (ذكر)',
      optFemale: 'Female (أنثى)',
      lblDepartment: 'Department / Programme (القسم / الدائرة)',
      optSelectDept: '-- Select Department (اختر القسم) --',
      lblJobTitle: 'Title / Job Title (المسمى الوظيفي)',
      lblGrade: 'Grade (الدرجة الوظيفية)',
      optSelectGrade: '-- Select Grade (اختر الدرجة) --',
      btnConfirmAttendance: 'Confirm & Submit Attendance (تأكيد الحضور)',
      successTitle: 'Attendance Confirmed Successfully!',
      successDesc: 'Your information has been verified and registered with UNRWA Staff Development & Training Division.',
      rcptName: 'Name:',
      rcptEmpNo: 'Employee #:',
      rcptGender: 'Gender:',
      rcptDept: 'Department:',
      rcptTitle: 'Title:',
      rcptGrade: 'Grade:',
      rcptCourse: 'Course:',
      rcptLocation: 'Location:',
      rcptTime: 'Timestamp:',
      btnRegisterAnother: 'Register Another Attendee',
      btnBackToDashboard: 'Back to HR Dashboard',
      projInstructionTitle: 'Scan QR with your phone camera to register attendance',
      projInstructionDesc: 'Ensure your name is typed accurately in English for your official completion certificate.',
      projLiveCount: 'Attendees Registered:',
      btnPrintNow: 'Print Now (طباعة الآن)',
      btnClose: 'Close (إغلاق)'
    },
    ar: {
      navTrainer: 'لوحة المدرب والـ HR',
      navTrainee: 'تسجيل المتدرب',
      badgeOfficial: 'البوابة الرسمية لتطوير الموظفين - الأونروا',
      adminHeroTitle: 'نظام الحضور الذكي وإعداد الشهادات الرقمية',
      adminHeroDesc: 'توليد رموز QR ديناميكية لتسجيل الحضور عبر الموبايل مع تدقيق فوري للأسماء بالإنجليزية وتصدير ملفات الإكسل بنقرة واحدة.',
      statRegistered: 'إجمالي المسجلين',
      statActiveSession: 'الجلسة النشطة',
      sessionSetupTitle: '1. بيانات الجلسة التدريبية',
      sessionSetupHint: 'حدد البيانات لتنشيط رمز الـ QR',
      lblCourseName: 'اسم الدورة التدريبية',
      optSelectCourse: '-- اختر الدورة التدريبية --',
      lblTrainerName: 'اسم المدرب',
      lblLocation: 'المكان / المركز الميداني',
      optSelectLocation: '-- اختر مكان التدريب --',
      lblDate: 'تاريخ الجلسة',
      lblTime: 'التوقيت',
      btnGenerateQR: 'توليد كود الـ QR وتنشيط الجلسة',
      qrDisplayTitle: '2. رمز الـ QR المباشر للحضور',
      statusLive: 'نشط وجاهز',
      statusStandby: 'في انتظار الإعداد',
      standbyTitle: 'لم يتم توليد أي جلسة تدريبية بعد',
      standbyDesc: 'يرجى اختيار الدورة التدريبية، اسم المدرب، المكان، التاريخ، والتوقيت على اليمين ثم الضغط على "توليد كود الـ QR وتنشيط الجلسة" لتوليد رمز الـ QR الرسمي الخاص بك.',
      btnProjectorMode: 'شاشة العرض (البروجيكتور)',
      btnPrintFlyer: 'طباعة بوستر A4 للطاولة',
      btnCopyLink: 'نسخ الرابط المباشر',
      btnTestCheckin: 'معاينة شاشة المتدرب',
      hostLabel: 'رابط مسح الكود:',
      btnEditHost: 'تغيير',
      rosterTitle: '3. سجل الحضور المباشر للجلسة',
      rosterSubtitle: 'قائمة الحضور اللحظية، والأسماء مدققة بالإنجليزية تمهيداً لطباعة الشهادات الرسمية.',
      searchPlaceholder: 'بحث بالاسم، رقم الموظف، القسم...',
      btnExportExcel: 'تصدير إلى إكسل (.xlsx)',
      statTotalAttendees: 'إجمالي الحضور:',
      statGenderRatio: 'الجنس (ذكور / إناث):',
      statDepts: 'عدد الأقسام:',
      statLatestCheckin: 'آخر تسجيل:',
      thEmpNo: 'رقم الموظف',
      thTraineeName: 'اسم المتدرب (بالإنجليزية)',
      thGender: 'الجنس',
      thDepartment: 'القسم / الدائرة',
      thJobTitle: 'المسمى الوظيفي',
      thGrade: 'الدرجة (Grade)',
      thTimestamp: 'وقت التسجيل',
      thActions: 'إجراءات',
      emptyStateTitle: 'لم يسجل أي متدرب بعد',
      emptyStateDesc: 'امسح رمز الـ QR بكاميرا الهاتف لتسجيل الحضور فورياً.',
      traineeBannerBadge: 'جلسة تدريبية رسمية - الأونروا',
      traineeFormTitle: 'تسجيل الحضور الإلكتروني للتدريب',
      traineeFormHint: 'يرجى ملء البيانات بدقة. سيظهر اسمك على الشهادة تماماً كما هو مكتوب أدناه.',
      lblEmpNumber: 'رقم الموظف (Employee Number)',
      helpEmpNumber: 'رقمك الوظيفي الرسمي المعتمد في الأونروا',
      lblTraineeName: 'اسم المتدرب (باللغة الإنجليزية للشهادة)',
      warnEnglishOnly: 'يرجى كتابة الاسم بالأحرف الإنجليزية فقط. الحروف العربية غير مقبولة لطباعة الشهادات.',
      certPreviewBadge: 'معاينة حية للاسم على الشهادة',
      certCertifiesThat: 'تشهد الأونروا بأن الموظف / الموظفة',
      certCompleted: 'قد أتم بنجاح البرنامج التدريبي في',
      certVerifyPrompt: 'يرجى مراجعة التهجئة والحروف الكبيرة والصغيرة بدقة قبل الإرسال.',
      lblGender: 'الجنس',
      optMale: 'ذكر (Male)',
      optFemale: 'أنثى (Female)',
      lblDepartment: 'القسم / البرنامج (Department)',
      optSelectDept: '-- اختر القسم أو البرنامج --',
      lblJobTitle: 'المسمى الوظيفي (Title)',
      lblGrade: 'الدرجة الوظيفية (Grade)',
      optSelectGrade: '-- اختر الدرجة الوظيفية --',
      btnConfirmAttendance: 'تأكيد وإرسال تسجيل الحضور',
      successTitle: 'تم تأكيد تسجيل حضورك بنجاح!',
      successDesc: 'تم التحقق من بياناتك وتوثيق حضورك لدى مكتب تطوير وتأهيل الموظفين في الأونروا.',
      rcptName: 'الاسم:',
      rcptEmpNo: 'رقم الموظف:',
      rcptGender: 'الجنس:',
      rcptDept: 'القسم:',
      rcptTitle: 'المسمى الوظيفي:',
      rcptGrade: 'الدرجة:',
      rcptCourse: 'الدورة:',
      rcptLocation: 'المكان:',
      rcptTime: 'وقت التسجيل:',
      btnRegisterAnother: 'تسجيل متدرب آخر',
      btnBackToDashboard: 'العودة إلى لوحة الـ HR',
      projInstructionTitle: 'امسح رمز الـ QR بكاميرا هاتفك لتسجيل الحضور',
      projInstructionDesc: 'تأكد من كتابة اسمك بدقة باللغة الإنجليزية لتتم طباعته على شهادتك الرسمية.',
      projLiveCount: 'عدد الحاضرين المسجلين:',
      btnPrintNow: 'طباعة الآن',
      btnClose: 'إغلاق'
    }
  };

  // =========================================================================
  // 3. INITIALIZATION
  // =========================================================================
  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    loadSavedData();
    setupEventListeners();
    setupUrlParamsHandler();
    applyLanguage(currentLang);
    renderSessionDetails();
    renderQrCodes();
    renderRosterTable();
    setupBroadcastReceiver();
  }

  function loadSavedData() {
    // Language
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      currentLang = savedLang;
    }

    // Session
    const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    if (savedSession) {
      try {
        currentSession = JSON.parse(savedSession);
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }

    // Roster
    const savedRoster = localStorage.getItem(STORAGE_KEY_ROSTER);
    if (savedRoster) {
      try {
        attendeesList = JSON.parse(savedRoster);
      } catch (e) {
        console.error('Error parsing roster', e);
      }
    }

    // Default Date input
    const dateInput = document.getElementById('sessionDate');
    if (dateInput) {
      dateInput.value = (currentSession && currentSession.date) ? currentSession.date : todayISO;
    }
  }

  // =========================================================================
  // 4. URL PARAMETER HANDLING (For Trainee Direct Check-In via QR)
  // =========================================================================
  function setupUrlParamsHandler() {
    const params = new URLSearchParams(window.location.search);

    // If session params exist in the URL, adopt them for the check-in view
    if (params.has('course') || params.has('c')) {
      if (!currentSession) {
        currentSession = {
          course: '',
          location: '',
          trainer: '',
          date: todayISO,
          time: '',
          sessionId: 'UNRWA-' + Date.now().toString(36).toUpperCase()
        };
      }
      currentSession.course = decodeURIComponent(params.get('course') || params.get('c') || currentSession.course || '');
      currentSession.location = decodeURIComponent(params.get('location') || params.get('loc') || currentSession.location || '');
      currentSession.trainer = decodeURIComponent(params.get('trainer') || params.get('tr') || currentSession.trainer || '');
      currentSession.date = decodeURIComponent(params.get('date') || params.get('d') || currentSession.date || todayISO);
      currentSession.time = decodeURIComponent(params.get('time') || params.get('t') || currentSession.time || '');
      if (params.has('sid')) {
        currentSession.sessionId = params.get('sid');
      }
    }

    // Switch to trainee view if requested or if direct scan
    if (params.get('view') === 'trainee' || params.has('c') || params.has('course')) {
      switchView('trainee');
    }
  }

  // =========================================================================
  // 5. VIEW SWITCHING & NAVIGATION
  // =========================================================================
  function switchView(viewName) {
    const adminView = document.getElementById('adminView');
    const traineeView = document.getElementById('traineeView');
    const viewBtnAdmin = document.getElementById('viewBtnAdmin');
    const viewBtnTrainee = document.getElementById('viewBtnTrainee');

    if (viewName === 'trainee') {
      adminView.classList.remove('active');
      traineeView.classList.add('active');
      viewBtnAdmin.classList.remove('active');
      viewBtnTrainee.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      traineeView.classList.remove('active');
      adminView.classList.add('active');
      viewBtnTrainee.classList.remove('active');
      viewBtnAdmin.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // =========================================================================
  // 6. LANGUAGE TOGGLE (EN / AR)
  // =========================================================================
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY_LANG, lang);

    const isRtl = lang === 'ar';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    const label = document.getElementById('currentLangLabel');
    if (label) {
      label.textContent = isRtl ? 'English' : 'العربية';
    }

    // Translate all elements with data-i18n
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });
  }

  function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(newLang);
    showToast(newLang === 'ar' ? 'تم تحويل الواجهة إلى العربية' : 'Switched to English interface', 'info');
  }

  // =========================================================================
  // 7. SESSION MANAGEMENT & QR GENERATION
  // =========================================================================
  function renderSessionDetails() {
    const standbyBox = document.getElementById('qrStandbyPlaceholder');
    const activeBox = document.getElementById('qrActiveContent');
    const liveStatus = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');
    const heroActiveSessions = document.getElementById('heroActiveSessions');

    const courseSelect = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    const locationSelect = document.getElementById('locationSelect');
    const locationCustom = document.getElementById('locationCustomInput');
    const trainerInput = document.getElementById('trainerInput');
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');

    if (!currentSession) {
      // Inactive / Standby state: wait for HR to configure
      if (standbyBox) standbyBox.classList.remove('hidden');
      if (activeBox) activeBox.classList.add('hidden');
      if (liveStatus) liveStatus.classList.remove('active');
      if (statusText) statusText.textContent = translations[currentLang]?.statusStandby || 'Awaiting Setup';
      if (heroActiveSessions) heroActiveSessions.textContent = '0';

      // Keep inputs ready for HR
      if (dateInput && !dateInput.value) dateInput.value = todayISO;
      return;
    }

    // Active state: session exists
    if (standbyBox) standbyBox.classList.add('hidden');
    if (activeBox) activeBox.classList.remove('hidden');
    if (liveStatus) liveStatus.classList.add('active');
    if (statusText) statusText.textContent = translations[currentLang]?.statusLive || 'Active & Ready';
    if (heroActiveSessions) heroActiveSessions.textContent = '1';

    // Populate form fields
    if (trainerInput) trainerInput.value = currentSession.trainer || '';
    if (dateInput) dateInput.value = currentSession.date || todayISO;
    if (timeInput) timeInput.value = currentSession.time || '';

    // Course preset check
    if (courseSelect && currentSession.course) {
      let matched = false;
      for (let i = 0; i < courseSelect.options.length; i++) {
        if (courseSelect.options[i].value === currentSession.course) {
          courseSelect.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) {
        courseSelect.value = '__custom__';
        courseCustom.classList.remove('hidden');
        courseCustom.value = currentSession.course;
      }
    }

    // Location preset check
    if (locationSelect && currentSession.location) {
      let matched = false;
      for (let i = 0; i < locationSelect.options.length; i++) {
        if (locationSelect.options[i].value === currentSession.location) {
          locationSelect.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) {
        locationSelect.value = '__custom__';
        locationCustom.classList.remove('hidden');
        locationCustom.value = currentSession.location;
      }
    }

    // Update display badges across admin, trainee, projector, and flyer
    updateDisplayBadges();
  }

  function updateDisplayBadges() {
    if (!currentSession) return;

    // Admin display box
    setText('displayCourseTitle', currentSession.course);
    setText('displayLocation', currentSession.location);
    setText('displayTrainer', currentSession.trainer);
    setText('displayDate', currentSession.date);
    setText('displayTime', currentSession.time);

    // Trainee view banners
    setText('traineeCourseHeader', currentSession.course);
    setText('traineeLocationHeader', currentSession.location);
    setText('traineeTrainerHeader', currentSession.trainer);
    setText('traineeDateHeader', currentSession.date);
    setText('traineeTimeHeader', currentSession.time);
    setText('certLiveCourse', currentSession.course);

    // Projector modal
    setText('projCourseTitle', currentSession.course);
    setText('projLocation', currentSession.location);
    setText('projTrainer', currentSession.trainer);
    setText('projDate', currentSession.date);
    setText('projTime', currentSession.time);

    // Flyer modal
    setText('flyerCourseTitle', currentSession.course);
    setText('flyerLocation', currentSession.location);
    setText('flyerTrainer', currentSession.trainer);
    setText('flyerDate', currentSession.date);
    setText('flyerTime', currentSession.time);
  }

  function getBaseHostUrl() {
    // If user configured a custom published URL (like GitHub Pages or local IP)
    const customHost = localStorage.getItem('attendtrack_custom_host_v1');
    if (customHost && customHost.trim() !== '') {
      return customHost.trim().replace(/\/+$/, '');
    }

    // If opened directly from file system (file://)
    if (window.location.protocol === 'file:') {
      return 'http://192.168.1.122:5173';
    }

    // Default to current web origin + pathname
    return window.location.origin + window.location.pathname.replace(/\/+$/, '');
  }

  function generateCheckinUrl() {
    if (!currentSession) return '';
    const base = getBaseHostUrl();
    const url = new URL(base.startsWith('http') ? base : 'http://' + base);
    url.searchParams.set('view', 'trainee');
    url.searchParams.set('c', currentSession.course);
    url.searchParams.set('loc', currentSession.location);
    url.searchParams.set('tr', currentSession.trainer);
    url.searchParams.set('d', currentSession.date);
    url.searchParams.set('t', currentSession.time);
    url.searchParams.set('sid', currentSession.sessionId);
    return url.toString();
  }

  function renderQrCodes() {
    if (!currentSession) return;
    const targetUrl = generateCheckinUrl();
    if (!targetUrl) return;

    if (typeof QRCode === 'undefined') {
      console.warn('QRCode library loading, retrying in 250ms...');
      setTimeout(renderQrCodes, 250);
      return;
    }

    // 1. Admin Card Main QR
    const qrAdminContainer = document.getElementById('qrcode');
    if (qrAdminContainer) {
      try {
        qrAdminContainer.innerHTML = '';
        adminQr = new QRCode(qrAdminContainer, {
          text: targetUrl,
          width: 210,
          height: 210,
          colorDark: '#002d62',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.error('Error rendering Admin QR:', err);
      }
    }

    // Projector and Flyer QRs are rendered on demand when modals open
  }

  function renderProjectorQr() {
    const qrProjContainer = document.getElementById('projectorQrcode');
    if (qrProjContainer && currentSession) {
      try {
        qrProjContainer.innerHTML = '';
        projectorQr = new QRCode(qrProjContainer, {
          text: generateCheckinUrl(),
          width: 320,
          height: 320,
          colorDark: '#001a3a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (err) {
        console.error('Error rendering Projector QR:', err);
      }
    }
  }

  function renderFlyerQr() {
    const qrFlyerContainer = document.getElementById('flyerQrcode');
    if (qrFlyerContainer && currentSession) {
      try {
        qrFlyerContainer.innerHTML = '';
        flyerQr = new QRCode(qrFlyerContainer, {
          text: generateCheckinUrl(),
          width: 210,
          height: 210,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (err) {
        console.error('Error rendering Flyer QR:', err);
      }
    }
  }

  function handleSessionFormSubmit(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    try {
      const courseSelect = document.getElementById('courseSelect');
      const courseCustom = document.getElementById('courseCustomInput');
      const locationSelect = document.getElementById('locationSelect');
      const locationCustom = document.getElementById('locationCustomInput');
      const trainerInput = document.getElementById('trainerInput');
      const dateInput = document.getElementById('sessionDate');
      const timeInput = document.getElementById('sessionTime');

      // Validation
      if (!courseSelect || !courseSelect.value) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار اسم الدورة التدريبية' : 'Please select a course name', 'error');
        if (courseSelect) courseSelect.focus();
        return false;
      }

      let selectedCourse = courseSelect.value;
      if (selectedCourse === '__custom__') {
        selectedCourse = courseCustom ? courseCustom.value.trim() : '';
        if (!selectedCourse) {
          showToast(currentLang === 'ar' ? 'يرجى كتابة اسم الدورة المخصصة' : 'Please type custom course name', 'error');
          if (courseCustom) courseCustom.focus();
          return false;
        }
      }

      const trainerName = trainerInput ? trainerInput.value.trim() : '';
      if (!trainerName) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال اسم المدرب' : 'Please enter trainer name', 'error');
        if (trainerInput) trainerInput.focus();
        return false;
      }

      if (!locationSelect || !locationSelect.value) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار مكان التدريب' : 'Please select training location', 'error');
        if (locationSelect) locationSelect.focus();
        return false;
      }

      let selectedLocation = locationSelect.value;
      if (selectedLocation === '__custom__') {
        selectedLocation = locationCustom ? locationCustom.value.trim() : '';
        if (!selectedLocation) {
          showToast(currentLang === 'ar' ? 'يرجى كتابة اسم المكان المخصص' : 'Please type custom venue', 'error');
          if (locationCustom) locationCustom.focus();
          return false;
        }
      }

      const sessionDate = dateInput ? dateInput.value : '';
      if (!sessionDate) {
        showToast(currentLang === 'ar' ? 'يرجى تحديد تاريخ الجلسة' : 'Please select session date', 'error');
        if (dateInput) dateInput.focus();
        return false;
      }

      const sessionTime = timeInput ? timeInput.value.trim() : '';
      if (!sessionTime) {
        showToast(currentLang === 'ar' ? 'يرجى تحديد توقيت الجلسة' : 'Please enter session timing', 'error');
        if (timeInput) timeInput.focus();
        return false;
      }

      // Set new active session with HR exact inputs
      currentSession = {
        course: selectedCourse,
        trainer: trainerName,
        location: selectedLocation,
        date: sessionDate,
        time: sessionTime,
        sessionId: 'UNRWA-' + Date.now().toString(36).toUpperCase()
      };

      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentSession));
      renderSessionDetails();
      renderQrCodes();

      // Pulse animation on QR container
      const qrContainer = document.getElementById('qrCodeContainer');
      if (qrContainer) {
        qrContainer.style.transform = 'scale(1.05)';
        setTimeout(() => { qrContainer.style.transform = 'scale(1)'; }, 250);
      }

      showToast(currentLang === 'ar' ? 'تم توليد كود الـ QR وتنشيط الجلسة بنجاح!' : 'Session QR Code generated & activated successfully!', 'success');
      return false;
    } catch (err) {
      console.error('Submission error:', err);
      showToast('Error: ' + err.message, 'error');
      return false;
    }
  }

  // =========================================================================
  // 8. TRAINEE CHECK-IN LOGIC & STRICT VALIDATIONS
  // =========================================================================
  function setupTraineeNameLivePreview() {
    const nameInput = document.getElementById('traineeNameInput');
    const certLiveName = document.getElementById('certLiveName');
    const nameWarn = document.getElementById('nameValidationWarning');

    if (!nameInput) return;

    nameInput.addEventListener('input', (e) => {
      let val = e.target.value;

      // Detect Arabic or non-English characters
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
      if (arabicPattern.test(val)) {
        nameWarn.classList.remove('hidden');
        // Strip Arabic chars to enforce English
        val = val.replace(/[\u0600-\u06FF\u0750-\u077F]/g, '');
        e.target.value = val;
      } else {
        nameWarn.classList.add('hidden');
      }

      // Format to Title Case nicely (e.g. "mohammad al-ghanem" -> "Mohammad Al-Ghanem")
      const formatted = toTitleCase(val);

      if (formatted.trim() === '') {
        certLiveName.textContent = currentLang === 'ar' ? 'اسمك باللغة الإنجليزية للشهادة' : 'YOUR NAME IN ENGLISH';
        certLiveName.style.opacity = '0.5';
      } else {
        certLiveName.textContent = formatted;
        certLiveName.style.opacity = '1';
      }
    });

    nameInput.addEventListener('blur', (e) => {
      e.target.value = toTitleCase(e.target.value.trim());
    });
  }

  function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\b\w+/g, function (word) {
      // Keep words like Al-, El- or Roman numerals handled nicely
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  function handleTraineeFormSubmit(e) {
    e.preventDefault();

    const empNumberInput = document.getElementById('empNumberInput');
    const traineeNameInput = document.getElementById('traineeNameInput');
    const genderChecked = document.querySelector('input[name="traineeGender"]:checked');
    const deptSelect = document.getElementById('deptSelect');
    const deptCustomInput = document.getElementById('deptCustomInput');
    const jobTitleInput = document.getElementById('jobTitleInput');
    const gradeSelect = document.getElementById('gradeSelect');

    const empNumber = empNumberInput.value.trim();
    const traineeName = toTitleCase(traineeNameInput.value.trim());
    const gender = genderChecked ? genderChecked.value : '';
    let department = deptSelect.value;
    if (department === '__custom__') {
      department = deptCustomInput.value.trim() || 'General Department';
    }
    const jobTitle = jobTitleInput.value.trim();
    const grade = gradeSelect.value;

    // Field Verifications
    if (!empNumber) {
      showToast(currentLang === 'ar' ? 'يرجى إدخال رقم الموظف' : 'Please enter your Employee Number', 'error');
      empNumberInput.focus();
      return;
    }

    if (!traineeName || traineeName.length < 3) {
      showToast(currentLang === 'ar' ? 'يرجى كتابة اسمك كاملاً بالإنجليزية' : 'Please enter your full name in English', 'error');
      traineeNameInput.focus();
      return;
    }

    if (!gender) {
      showToast(currentLang === 'ar' ? 'يرجى اختيار الجنس (ذكر / أنثى)' : 'Please select gender', 'error');
      return;
    }

    if (!department) {
      showToast(currentLang === 'ar' ? 'يرجى اختيار القسم أو البرنامج' : 'Please select your department', 'error');
      deptSelect.focus();
      return;
    }

    if (!jobTitle) {
      showToast(currentLang === 'ar' ? 'يرجى كتابة المسمى الوظيفي' : 'Please enter your Job Title', 'error');
      jobTitleInput.focus();
      return;
    }

    if (!grade) {
      showToast(currentLang === 'ar' ? 'يرجى اختيار الدرجة الوظيفية (Grade)' : 'Please select your Grade', 'error');
      gradeSelect.focus();
      return;
    }

    // Check duplicate check-in for same session
    const isDuplicate = attendeesList.some(
      (a) => a.empNumber === empNumber && a.sessionId === currentSession.sessionId
    );
    if (isDuplicate) {
      showToast(
        currentLang === 'ar' 
          ? 'تنبيه: رقم الموظف هذا مسجل مسبقاً في هذه الجلسة!' 
          : 'Notice: This Employee Number is already checked into this session!', 
        'error'
      );
    }

    const timestamp = new Date().toLocaleString();
    const newAttendee = {
      id: 'ATT-' + Date.now().toString(36),
      sessionId: currentSession.sessionId,
      course: currentSession.course,
      location: currentSession.location,
      trainer: currentSession.trainer,
      date: currentSession.date,
      empNumber: empNumber,
      traineeName: traineeName,
      gender: gender,
      department: department,
      jobTitle: jobTitle,
      grade: grade,
      timestamp: timestamp
    };

    // Save to roster
    attendeesList.unshift(newAttendee);
    localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(attendeesList));

    // Broadcast update to HR tabs
    broadcastRosterUpdate();

    // Trigger Confetti Celebration!
    triggerConfetti();

    // Show Confirmation Receipt
    displaySuccessReceipt(newAttendee);
    showToast(currentLang === 'ar' ? 'تم تسجيل حضورك بنجاح!' : 'Attendance registered successfully!', 'success');
  }

  function displaySuccessReceipt(att) {
    document.getElementById('traineeFormCard').classList.add('hidden');
    const successCard = document.getElementById('checkinSuccessCard');
    successCard.classList.remove('hidden');

    setText('rcptNameVal', att.traineeName);
    setText('rcptEmpNoVal', att.empNumber);
    setText('rcptGenderVal', att.gender === 'Male' ? 'Male (ذكر)' : 'Female (أنثى)');
    setText('rcptDeptVal', att.department);
    setText('rcptTitleVal', att.jobTitle);
    setText('rcptGradeVal', att.grade);
    setText('rcptCourseVal', att.course);
    setText('rcptLocationVal', att.location);
    setText('rcptTimeVal', att.timestamp);

    window.scrollTo({ top: successCard.offsetTop - 40, behavior: 'smooth' });
  }

  function resetTraineeFormForNew() {
    document.getElementById('traineeCheckinForm').reset();
    document.getElementById('certLiveName').textContent = currentLang === 'ar' ? 'اسمك باللغة الإنجليزية للشهادة' : 'YOUR NAME IN ENGLISH';
    document.getElementById('checkinSuccessCard').classList.add('hidden');
    document.getElementById('traineeFormCard').classList.remove('hidden');
    document.getElementById('deptCustomInput').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // 9. LIVE ROSTER RENDERING & REAL-TIME STATS
  // =========================================================================
  function renderRosterTable(filteredData = null) {
    const list = filteredData || attendeesList;
    const tbody = document.getElementById('attendanceTableBody');
    const emptyRow = document.getElementById('emptyStateRow');

    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (emptyRow) {
        tbody.appendChild(emptyRow);
        emptyRow.classList.remove('hidden');
      } else {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="9">
              <div class="empty-state">
                <i class="fa-solid fa-clipboard-user"></i>
                <h4>${currentLang === 'ar' ? 'لم يسجل أي متدرب بعد' : 'No Attendees Registered Yet'}</h4>
                <p>${currentLang === 'ar' ? 'امسح رمز الـ QR بكاميرا الهاتف لتسجيل الحضور فورياً.' : 'Scan the QR code from any smartphone to record instant attendance.'}</p>
              </div>
            </td>
          </tr>
        `;
      }
      updateRosterStats(list);
      return;
    }

    let rowsHtml = '';
    list.forEach((item, index) => {
      const isMale = item.gender === 'Male';
      const genderClass = isMale ? 'male' : 'female';
      const genderIcon = isMale ? 'fa-person' : 'fa-person-dress';
      const genderText = isMale ? (currentLang === 'ar' ? 'ذكر' : 'Male') : (currentLang === 'ar' ? 'أنثى' : 'Female');

      rowsHtml += `
        <tr>
          <td><span class="text-muted font-bold">${index + 1}</span></td>
          <td><span class="emp-no-code">${escapeHtml(item.empNumber)}</span></td>
          <td>
            <div class="name-cell-wrapper">
              <span class="trainee-name-bold">${escapeHtml(item.traineeName)}</span>
              <small class="text-muted">${escapeHtml(item.course || '')}</small>
            </div>
          </td>
          <td>
            <span class="gender-badge ${genderClass}">
              <i class="fa-solid ${genderIcon}"></i>
              ${genderText}
            </span>
          </td>
          <td><span class="dept-pill">${escapeHtml(item.department)}</span></td>
          <td>${escapeHtml(item.jobTitle)}</td>
          <td><span class="grade-pill">${escapeHtml(item.grade)}</span></td>
          <td><small class="text-muted">${escapeHtml(item.timestamp)}</small></td>
          <td>
            <button class="btn btn-danger-outline btn-sm delete-attendee-btn" data-id="${item.id}" title="Remove record">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;

    // Attach delete listeners
    tbody.querySelectorAll('.delete-attendee-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteAttendee(id);
      });
    });

    updateRosterStats(list);
  }

  function updateRosterStats(list) {
    const total = list.length;
    let maleCount = 0;
    let femaleCount = 0;
    const deptsSet = new Set();

    list.forEach((item) => {
      if (item.gender === 'Male') maleCount++;
      if (item.gender === 'Female') femaleCount++;
      if (item.department) deptsSet.add(item.department);
    });

    setText('heroTotalAttendees', total);
    setText('summaryTotal', total);
    setText('summaryGender', `${maleCount} / ${femaleCount}`);
    setText('summaryDepts', deptsSet.size);
    setText('summaryLatest', list.length > 0 ? list[0].timestamp : '--');
    setText('projAttendeeCount', total);
  }

  function deleteAttendee(id) {
    const confirmMsg = currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this attendee record?';
    if (!confirm(confirmMsg)) return;

    attendeesList = attendeesList.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(attendeesList));
    renderRosterTable();
    broadcastRosterUpdate();
    showToast(currentLang === 'ar' ? 'تم حذف السجل' : 'Record removed', 'info');
  }

  function clearAllAttendees() {
    if (attendeesList.length === 0) return;
    const confirmMsg = currentLang === 'ar' ? 'تحذير: هل أنت متأكد من مسح كافة سجلات الحضور؟' : 'Warning: Are you sure you want to clear all attendance records?';
    if (!confirm(confirmMsg)) return;

    attendeesList = [];
    localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(attendeesList));
    renderRosterTable();
    broadcastRosterUpdate();
    showToast(currentLang === 'ar' ? 'تم تفريغ قائمة الحضور' : 'Attendance roster cleared', 'info');
  }

  function handleRosterSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderRosterTable();
      return;
    }

    const filtered = attendeesList.filter((item) => {
      return (
        (item.traineeName && item.traineeName.toLowerCase().includes(q)) ||
        (item.empNumber && item.empNumber.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.jobTitle && item.jobTitle.toLowerCase().includes(q)) ||
        (item.grade && item.grade.toLowerCase().includes(q))
      );
    });

    renderRosterTable(filtered);
  }

  // =========================================================================
  // 10. EXCEL EXPORT (.XLSX) VIA SHEETJS
  // =========================================================================
  function exportRosterToExcel() {
    if (attendeesList.length === 0) {
      showToast(currentLang === 'ar' ? 'لا يوجد متدربون مسجلون لتصديرهم إلى إكسل' : 'No registered attendees to export yet.', 'warning');
      return;
    }

    try {
      // Structure clean tabular data for HR
      const exportData = attendeesList.map((item, index) => ({
        '#': index + 1,
        'Employee Number': item.empNumber,
        'Trainee Name (English)': item.traineeName,
        'Gender': item.gender,
        'Department': item.department,
        'Job Title': item.jobTitle,
        'Grade': item.grade,
        'Course Name': item.course || currentSession.course,
        'Location / Venue': item.location || currentSession.location,
        'Trainer': item.trainer || currentSession.trainer,
        'Session Date': item.date || currentSession.date,
        'Check-In Timestamp': item.timestamp
      }));

      // Create Worksheet & Workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths
      const colWidths = [
        { wch: 5 },   // #
        { wch: 18 },  // Employee Number
        { wch: 28 },  // Trainee Name
        { wch: 10 },  // Gender
        { wch: 28 },  // Department
        { wch: 22 },  // Job Title
        { wch: 14 },  // Grade
        { wch: 32 },  // Course Name
        { wch: 28 },  // Location
        { wch: 24 },  // Trainer
        { wch: 14 },  // Session Date
        { wch: 22 }   // Timestamp
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Roster');

      // Clean file naming
      const safeCourse = (currentSession.course || 'Training').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const fileName = `UNRWA_Attendance_${safeCourse}_${currentSession.date}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      showToast(currentLang === 'ar' ? 'تم تحميل ملف الإكسل بنجاح!' : 'Excel file exported successfully!', 'success');
    } catch (err) {
      console.error('Export error', err);
      showToast(currentLang === 'ar' ? 'حدث خطأ أثناء تصدير ملف الإكسل' : 'Error exporting Excel file', 'error');
    }
  }

  // =========================================================================
  // 11. MULTI-TAB REAL-TIME SYNCHRONIZATION
  // =========================================================================
  function setupBroadcastReceiver() {
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'ROSTER_UPDATED') {
          const savedRoster = localStorage.getItem(STORAGE_KEY_ROSTER);
          if (savedRoster) {
            attendeesList = JSON.parse(savedRoster);
            renderRosterTable();
          }
        }
      };
    }

    // Also fallback to storage event
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY_ROSTER && e.newValue) {
        attendeesList = JSON.parse(e.newValue);
        renderRosterTable();
      }
    });
  }

  function broadcastRosterUpdate() {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ROSTER_UPDATED', timestamp: Date.now() });
    }
  }

  // =========================================================================
  // 12. PROJECTOR & FLYER MODAL CONTROLS
  // =========================================================================
  function openProjectorModal() {
    if (!currentSession) {
      showToast(currentLang === 'ar' ? 'يرجى إعداد الجلسة وتوليد كود الـ QR أولاً' : 'Please generate a session QR code first!', 'warning');
      return;
    }
    const modal = document.getElementById('projectorModal');
    modal.classList.remove('hidden');
    renderProjectorQr();
  }

  function closeProjectorModal() {
    document.getElementById('projectorModal').classList.add('hidden');
  }

  function openPrintFlyerModal() {
    if (!currentSession) {
      showToast(currentLang === 'ar' ? 'يرجى إعداد الجلسة وتوليد كود الـ QR أولاً' : 'Please generate a session QR code first!', 'warning');
      return;
    }
    const modal = document.getElementById('printFlyerModal');
    modal.classList.remove('hidden');
    renderFlyerQr();
  }

  function closePrintFlyerModal() {
    document.getElementById('printFlyerModal').classList.add('hidden');
  }

  function executePrint() {
    window.print();
  }

  function copyCheckinLink() {
    if (!currentSession) {
      showToast(currentLang === 'ar' ? 'يرجى إعداد الجلسة وتوليد كود الـ QR أولاً' : 'Please generate a session QR code first!', 'warning');
      return;
    }
    const url = generateCheckinUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast(currentLang === 'ar' ? 'تم نسخ رابط التسجيل إلى الحافظة' : 'Check-in link copied to clipboard!', 'success');
      }).catch(() => {
        prompt(currentLang === 'ar' ? 'انسخ الرابط:' : 'Copy link:', url);
      });
    } else {
      prompt(currentLang === 'ar' ? 'انسخ الرابط:' : 'Copy link:', url);
    }
  }

  // =========================================================================
  // 13. UI CELEBRATIONS & TOASTS
  // =========================================================================
  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0072bc', '#00a3e0', '#10b981', '#f59e0b', '#002d62']
      });
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // =========================================================================
  // 14. EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // View Switchers
    document.getElementById('viewBtnAdmin').addEventListener('click', () => switchView('admin'));
    document.getElementById('viewBtnTrainee').addEventListener('click', () => switchView('trainee'));
    document.getElementById('btnTestMobileView').addEventListener('click', () => switchView('trainee'));
    document.getElementById('btnReturnToAdmin').addEventListener('click', () => switchView('admin'));

    // Language Toggle
    document.getElementById('langToggleBtn').addEventListener('click', toggleLanguage);

    // Session Form & Button
    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) sessionForm.addEventListener('submit', handleSessionFormSubmit);
    const btnUpdateSession = document.getElementById('btnUpdateSession');
    if (btnUpdateSession) btnUpdateSession.addEventListener('click', handleSessionFormSubmit);

    // Course & Location custom toggles
    const courseSelect = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    courseSelect.addEventListener('change', () => {
      if (courseSelect.value === '__custom__') {
        courseCustom.classList.remove('hidden');
        courseCustom.focus();
      } else {
        courseCustom.classList.add('hidden');
      }
    });

    const locationSelect = document.getElementById('locationSelect');
    const locationCustom = document.getElementById('locationCustomInput');
    locationSelect.addEventListener('change', () => {
      if (locationSelect.value === '__custom__') {
        locationCustom.classList.remove('hidden');
        locationCustom.focus();
      } else {
        locationCustom.classList.add('hidden');
      }
    });

    const deptSelect = document.getElementById('deptSelect');
    const deptCustom = document.getElementById('deptCustomInput');
    deptSelect.addEventListener('change', () => {
      if (deptSelect.value === '__custom__') {
        deptCustom.classList.remove('hidden');
        deptCustom.focus();
      } else {
        deptCustom.classList.add('hidden');
      }
    });

    // Trainee Form & Button
    setupTraineeNameLivePreview();
    const traineeForm = document.getElementById('traineeCheckinForm');
    if (traineeForm) traineeForm.addEventListener('submit', handleTraineeFormSubmit);
    const btnSubmitCheckin = document.getElementById('btnSubmitCheckin');
    if (btnSubmitCheckin) btnSubmitCheckin.addEventListener('click', handleTraineeFormSubmit);
    document.getElementById('btnNewCheckin').addEventListener('click', resetTraineeFormForNew);

    // Toolbar Buttons
    document.getElementById('btnOpenProjector').addEventListener('click', openProjectorModal);
    document.getElementById('btnCloseProjector').addEventListener('click', closeProjectorModal);
    document.getElementById('btnPrintFlyer').addEventListener('click', openPrintFlyerModal);
    document.getElementById('btnClosePrintFlyer').addEventListener('click', closePrintFlyerModal);
    document.getElementById('btnExecutePrint').addEventListener('click', executePrint);
    document.getElementById('btnCopyCheckinLink').addEventListener('click', copyCheckinLink);

    // Roster Actions
    document.getElementById('rosterSearch').addEventListener('input', handleRosterSearch);
    document.getElementById('btnExportExcel').addEventListener('click', exportRosterToExcel);
    document.getElementById('btnClearData').addEventListener('click', clearAllAttendees);

    // Host URL Configuration Listeners
    setupHostUrlControls();

    // ESC to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProjectorModal();
        closePrintFlyerModal();
      }
    });
  }

  function setupHostUrlControls() {
    const displayEl = document.getElementById('hostCurrentUrlDisplay');
    const editForm = document.getElementById('hostEditForm');
    const inputEl = document.getElementById('customHostInput');
    const toggleBtn = document.getElementById('btnToggleHostEdit');
    const saveBtn = document.getElementById('btnSaveHost');
    const resetBtn = document.getElementById('btnResetHost');

    function refreshDisplay() {
      const current = getBaseHostUrl();
      if (displayEl) displayEl.textContent = current;
      if (inputEl) inputEl.value = current;
    }

    refreshDisplay();

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        editForm.classList.toggle('hidden');
        if (!editForm.classList.contains('hidden')) {
          inputEl.focus();
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const val = inputEl.value.trim();
        if (val) {
          localStorage.setItem('attendtrack_custom_host_v1', val);
          refreshDisplay();
          renderQrCodes();
          editForm.classList.add('hidden');
          showToast(currentLang === 'ar' ? 'تم تحديث رابط مسح الكود' : 'QR Destination Link updated!', 'success');
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem('attendtrack_custom_host_v1');
        refreshDisplay();
        renderQrCodes();
        editForm.classList.add('hidden');
        showToast(currentLang === 'ar' ? 'تمت استعادة الرابط الافتراضي' : 'Reset to default host URL', 'info');
      });
    }
  }

  // =========================================================================
  // HELPER UTILITIES
  // =========================================================================
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
