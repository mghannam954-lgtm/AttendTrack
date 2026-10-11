/**
 * AttendTrack - HR & Trainer Portal Logic
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Isolated Course Folders + Strict Language Separation
 */

(function () {
  'use strict';

  // 1. Application State & Language (Declared first to avoid TDZ ReferenceError)
  let currentLang = 'ar'; // Default Arabic for HR Portal
  let currentSession = null;
  let allSessions = [];
  let adminQr = null;
  let projectorQr = null;
  let flyerQr = null;
  let isInitialFirebaseLoad = true;

  // 2. Firebase Configuration & Initialization
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
      console.log('Firebase Realtime Database initialized in Admin Portal.');
      updateAdminCloudStatus(true);
    } else {
      console.warn('Firebase SDK not found; using local mode.');
      updateAdminCloudStatus(false);
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
    updateAdminCloudStatus(false);
  }

  function updateAdminCloudStatus(isOnline) {
    const badge = document.getElementById('adminCloudStatus');
    const text = document.getElementById('adminCloudText');
    if (!badge || !text) return;
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = (currentLang === 'ar') ? 'متصل سحابياً' : 'Cloud Connected';
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = (currentLang === 'ar') ? 'وضع محلي' : 'Local Mode';
    }
  }

  // 3. Catalogs for Bilingual Dynamic Dropdowns
  const courseCatalog = [
    { key: 'conflict_resolution', en: 'Conflict Resolution & Anger Management', ar: 'حل النزاعات وإدارة الغضب' },
    { key: 'effective_communication', en: 'Effective Communication & Team Building', ar: 'مهارات التواصل الفعال وبناء الفريق' },
    { key: 'code_of_conduct', en: 'UN Code of Conduct & Ethics Awareness', ar: 'مدونة قواعد السلوك وأخلاقيات العمل' },
    { key: 'supervisory_skills', en: 'Supervisory Skills & Modern Leadership', ar: 'المهارات الإشرافية والقيادة الحديثة' },
    { key: 'stress_management', en: 'Psychosocial Support & Stress Management', ar: 'الدعم النفسي والاجتماعي وإدارة ضغوط العمل' },
    { key: 'field_safety', en: 'Humanitarian Principles & Safety in Field', ar: 'المبادئ الإنسانية والسلامة الميدانية' },
    { key: 'cybersecurity', en: 'Cybersecurity & UNRWA Data Protection', ar: 'الأمن السيبراني وحماية البيانات' },
    { key: 'epas_system', en: 'e-PAS Performance Management System', ar: 'نظام إدارة الأداء وتقييم الموظفين (e-PAS)' }
  ];

  const locationCatalog = [
    { key: 'hq_damascus', en: 'Damascus - UNRWA Headquarters (HQ)', ar: 'دمشق - رئاسة الأونروا (HQ)' },
    { key: 'dtc', en: 'Damascus - Damascus Training Centre (DTC)', ar: 'دمشق - معهد دمشق المتوسط (DTC)' },
    { key: 'mezzeh', en: 'Damascus Area Office - Mezzeh', ar: 'مكتب منطقة دمشق - المزة' },
    { key: 'daraa', en: 'Daraa Area Office', ar: 'مكتب منطقة درعا' },
    { key: 'homs', en: 'Homs Area Office', ar: 'مكتب منطقة حمص' },
    { key: 'hama', en: 'Hama Area Office', ar: 'مكتب منطقة حماة' },
    { key: 'latakia', en: 'Latakia / Tartous Sub-Office', ar: 'مكتب اللاذقية وطرطوس' }
  ];

  // 4. Clean Audio Chime (Official Notification Sound)
  function playCheckinChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.33);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  // 5. Bilingual Translation Dictionaries
  const translations = {
    en: {
      portalSubTitle: 'Staff Development & Training Division · UNRWA HQ',
      adminHeroTitle: 'UNRWA Training & Attendance Management Portal',
      adminHeroDesc: 'Official electronic attendance tracking and automated training documentation system.',
      badgeOfficial: 'Official UNRWA Staff Development Console',
      badgeHrConsole: 'HR Console',
      cloudOnline: 'Cloud Connected',
      cloudOffline: 'Local Mode',
      statRegistered: 'Total Registered Attendees',
      statActiveSession: 'Active Training Sessions',
      sessionSetupTitle: 'Training Session Configuration',
      sessionSetupHint: 'Enter session parameters to generate active check-in QR code',
      lblCourseName: 'Training Course Title',
      lblTrainerName: 'Trainer Name',
      lblLocation: 'Training Venue / Location',
      lblDate: 'Session Date',
      lblTime: 'Session Timing',
      optSelectCourse: '-- Select Training Course --',
      optCustomCourse: '+ Enter Custom Course Title...',
      phCustomCourse: 'Type custom course title here...',
      phTrainer: 'e.g. Dr. Ahmad Al-Khatib',
      optSelectLocation: '-- Select Training Venue --',
      optCustomLocation: '+ Enter Custom Venue...',
      phCustomLocation: 'Type custom venue/room name...',
      phTime: 'e.g. 09:00 AM - 02:00 PM',
      btnGenerateQR: 'Activate Session & Generate QR',
      qrDisplayTitle: 'Session Attendance QR Code',
      statusStandby: 'Awaiting Session Setup',
      statusActive: 'Session Live & Ready for Scanning',
      standbyTitle: 'No Active Session Configured',
      standbyDesc: 'Fill in the training parameters on the left and click "Activate Session & Generate QR" to display the official session QR code.',
      btnProjectorMode: 'Projector Mode',
      btnPrintFlyer: 'Print A4 Poster',
      btnCopyLink: 'Copy Check-in Link',
      btnTestCheckin: 'Test Trainee View',
      hostLabel: 'Trainee Check-In URL:',
      btnEditHost: 'Change URL',
      sessionsArchiveTitle: 'Training Sessions Archive & Attendance Records',
      sessionsArchiveSubtitle: 'Each course has a dedicated record folder, independent attendee roster, and direct Excel download.',
      searchArchivePh: 'Search by course, trainer, or attendee...',
      thEmpNo: 'Employee #',
      thTraineeName: 'Trainee Name (English)',
      thGender: 'Gender',
      thDepartment: 'Department',
      thJobTitle: 'Job Title',
      thGrade: 'Grade',
      thTimestamp: 'Check-in Time',
      thActions: 'Actions',
      projInstructionTitle: 'Scan QR with phone camera to record official attendance',
      projInstructionDesc: 'Ensure your name is typed accurately in English for official certificate issuance.',
      projLiveCount: 'Registered Attendees:',
      btnPrintNow: 'Print Poster',
      btnClose: 'Close',
      flyerHeaderTitle: 'HUMAN RESOURCES · STAFF DEVELOPMENT & TRAINING DIVISION',
      flyerBadge: 'OFFICIAL TRAINING ATTENDANCE',
      flyerInstructionsTitle: 'Electronic Attendance Instructions:',
      flyerStep1: 'Open your smartphone camera and point it at this QR Code.',
      flyerStep2: 'Tap the notification banner to open the UNRWA Attendance Portal.',
      flyerStep3: 'Enter your Employee Number and Full Name in English.',
      flyerStep4: 'Verify the live certificate preview on your screen to ensure correct spelling.',
      flyerStep5: 'Click "Confirm & Submit Attendance" to record your presence.',
      noSessionsTitle: 'No Training Sessions Created Yet',
      noSessionsDesc: 'Configure course parameters above and click "Activate Session & Generate QR" to initialize your first session folder.',
      noFilterResults: 'No courses or attendees matching your search.',
      noAttendeesYet: 'No Attendees Registered Yet',
      noAttendeesYetSub: 'Scan the session QR code to register attendees in real-time.',
      badgeLiveNow: 'Active Session',
      lblAttendeesCount: 'Attendees',
      btnExportExcel: 'Export Excel (.xlsx)',
      btnActivateQR: 'Activate QR',
      statTotalRegistered: 'Registered:',
      statGenderRatio: 'Gender (M/F):',
      statDepartments: 'Departments:',
      statCheckinLink: 'Check-in URL:',
      linkOpenForm: 'Open Form',
      confirmClearArchive: 'Are you sure you want to delete all session archives? This action cannot be undone.',
      confirmDeleteAttendee: 'Are you sure you want to remove this attendee?',
      confirmDeleteSession: 'Are you sure you want to delete this course and all its attendance records?',
      toastLinkCopied: 'Check-in link copied to clipboard.',
      toastHostUpdated: 'Host URL updated successfully.',
      toastHostReset: 'Host URL reset to auto-detection.',
      toastSessionActivated: 'Session activated and folder created successfully.',
      toastSessionDeleted: 'Course deleted successfully.',
      toastArchiveCleared: 'Archive cleared successfully.',
      toastAttendeeDeleted: 'Attendee removed.',
      excelHeaderEmpNo: 'Employee Number',
      excelHeaderName: 'Trainee Name (English)',
      excelHeaderGender: 'Gender',
      excelHeaderDept: 'Department',
      excelHeaderJob: 'Job Title',
      excelHeaderGrade: 'Grade',
      excelHeaderCourse: 'Course Title',
      excelHeaderLocation: 'Venue',
      excelHeaderTrainer: 'Trainer',
      excelHeaderDate: 'Date',
      excelHeaderTime: 'Check-in Time'
    },
    ar: {
      portalSubTitle: 'قسم تطوير الموظفين والتدريب · رئاسة الأونروا',
      adminHeroTitle: 'بوابة إدارة التدريب وتطوير الموظفين - الأونروا',
      adminHeroDesc: 'المنظومة الرسمية لإدارة الحضور الإلكتروني والتوثيق المعتمد للدورات التدريبية.',
      badgeOfficial: 'بوابة التدريب الرسمية - دائرة الموارد البشرية',
      badgeHrConsole: 'لوحة المشرف',
      cloudOnline: 'متصل سحابياً',
      cloudOffline: 'وضع محلي',
      statRegistered: 'إجمالي الحضور المسجلين',
      statActiveSession: 'الدورات التدريبية النشطة',
      sessionSetupTitle: 'بيانات الجلسة التدريبية',
      sessionSetupHint: 'حدد تفاصيل الجلسة لتوليد رمز الـ QR وتفعيل التسجيل',
      lblCourseName: 'اسم الدورة التدريبية',
      lblTrainerName: 'اسم المدرب',
      lblLocation: 'مكان التدريب / المركز',
      lblDate: 'تاريخ الجلسة',
      lblTime: 'التوقيت',
      optSelectCourse: '-- اختر الدورة التدريبية --',
      optCustomCourse: '+ إدخال اسم دورة أخرى...',
      phCustomCourse: 'اكتب اسم الدورة هنا...',
      phTrainer: 'مثال: د. أحمد الخطيب',
      optSelectLocation: '-- اختر مكان التدريب --',
      optCustomLocation: '+ تحديد مكان آخر...',
      phCustomLocation: 'اكتب اسم المركز أو القاعة هنا...',
      phTime: 'مثال: 09:00 صباحاً - 02:00 ظهراً',
      btnGenerateQR: 'تفعيل الجلسة وتوليد رمز QR',
      qrDisplayTitle: 'رمز الحضور للجلسة (QR Code)',
      statusStandby: 'في انتظار إعداد الجلسة',
      statusActive: 'الجلسة نشطة ومستعدة للمسح',
      standbyTitle: 'لم يتم تفعيل أي جلسة حالياً',
      standbyDesc: 'يرجى تعبئة بيانات التدريب في الطرف الأيمن والضغط على "تفعيل الجلسة وتوليد رمز QR" لعرض رمز الحضور الرسمي.',
      btnProjectorMode: 'عرض البروجيكتور',
      btnPrintFlyer: 'طباعة إعلان A4',
      btnCopyLink: 'نسخ رابط الحضور',
      btnTestCheckin: 'تجربة صفحة المتدرب',
      hostLabel: 'رابط تسجيل حضور المتدربين:',
      btnEditHost: 'تعديل الرابط',
      sessionsArchiveTitle: 'سجل الدورات التدريبية وقوائم الحضور',
      sessionsArchiveSubtitle: 'لكل دورة مجلد خاص وقائمة حضور مستقلة مع إمكانية تنزيل ملف الإكسل الرسمي مباشرة.',
      searchArchivePh: 'بحث باسم الدورة، المدرب، أو المتدرب...',
      thEmpNo: 'الرقم الوظيفي',
      thTraineeName: 'اسم المتدرب (بالإنكليزية)',
      thGender: 'الجنس',
      thDepartment: 'القسم / الدائرة',
      thJobTitle: 'المسمى الوظيفي',
      thGrade: 'الدرجة',
      thTimestamp: 'وقت التسجيل',
      thActions: 'إجراء',
      projInstructionTitle: 'امسح الرمز بكاميرا الهاتف لتسجيل الحضور الرسمي',
      projInstructionDesc: 'يرجى كتابة الاسم بدقة باللغة الإنكليزية لطباعة الشهادة الرسمية.',
      projLiveCount: 'المسجلون حالياً:',
      btnPrintNow: 'طباعة الإعلان',
      btnClose: 'إغلاق',
      flyerHeaderTitle: 'الموارد البشرية · قسم تطوير الموظفين والتدريب',
      flyerBadge: 'كشف الحضور الرسمي للتدريب',
      flyerInstructionsTitle: 'تعليمات تسجيل الحضور الإلكتروني:',
      flyerStep1: 'افتح تطبيق الكاميرا على هاتفك المحمول ووجّهه نحو هذا الرمز.',
      flyerStep2: 'اضغط على الرابط الظاهر لفتح استمارة الحضور الرسمية للأونروا.',
      flyerStep3: 'أدخل رقمك الوظيفي واسمك الكامل باللغة الإنكليزية.',
      flyerStep4: 'تأكد من معاينة الاسم على الشهادة الظاهرة في شاشتك للتحقق من صحة التهجئة.',
      flyerStep5: 'اضغط "تأكيد وتسجيل الحضور" لتوثيق حضورك رسمياً.',
      noSessionsTitle: 'لا توجد دورات تدريبية مسجلة بعد',
      noSessionsDesc: 'قم بإدخال بيانات الجلسة في الأعلى واضغط "تفعيل الجلسة وتوليد رمز QR" لإنشاء مجلد الدورة وكشف الحضور.',
      noFilterResults: 'لا توجد نتائج مطابقة لبحثك.',
      noAttendeesYet: 'لا يوجد حضور مسجلون في هذه الدورة بعد',
      noAttendeesYetSub: 'امسح رمز الحضور المخصص لهذه الجلسة لتسجيل المشاركين فورياً.',
      badgeLiveNow: 'الجلسة النشطة',
      lblAttendeesCount: 'مشارك',
      btnExportExcel: 'تصدير إكسل (.xlsx)',
      btnActivateQR: 'تفعيل الرمز',
      statTotalRegistered: 'المسجلون:',
      statGenderRatio: 'النوع (ذكور / إناث):',
      statDepartments: 'الأقسام:',
      statCheckinLink: 'رابط التسجيل:',
      linkOpenForm: 'فتح الاستمارة',
      confirmClearArchive: 'هل أنت متأكد من رغبتك في مسح كامل أرشيف الدورات التدريبية؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteAttendee: 'هل أنت متأكد من حذف هذا المتدرب من سجل الحضور؟',
      confirmDeleteSession: 'هل أنت متأكد من حذف هذه الدورة بالكامل مع كافة سجلات الحضور الخاصة بها؟',
      toastLinkCopied: 'تم نسخ رابط الحضور إلى الحافظة بنجاح.',
      toastHostUpdated: 'تم تحديث عنوان الرابط بنجاح.',
      toastHostReset: 'تمت استعادة العنوان التلقائي.',
      toastSessionActivated: 'تم تفعيل الجلسة وإنشاء مجلد الحضور بنجاح.',
      toastSessionDeleted: 'تم حذف الدورة التدريبية بنجاح.',
      toastArchiveCleared: 'تم مسح سجل الدورات بنجاح.',
      toastAttendeeDeleted: 'تم حذف المتدرب من القائمة.',
      excelHeaderEmpNo: 'الرقم الوظيفي',
      excelHeaderName: 'اسم المتدرب (بالإنكليزية)',
      excelHeaderGender: 'الجنس',
      excelHeaderDept: 'القسم أو البرنامج',
      excelHeaderJob: 'المسمى الوظيفي',
      excelHeaderGrade: 'الدرجة الوظيفية',
      excelHeaderCourse: 'الدورة التدريبية',
      excelHeaderLocation: 'مكان التدريب',
      excelHeaderTrainer: 'اسم المدرب',
      excelHeaderDate: 'تاريخ الدورة',
      excelHeaderTime: 'وقت التسجيل'
    }
  };

  // 6. Dynamic Dropdowns Population (Pure language per choice)
  function populateCourseSelect(lang) {
    const sel = document.getElementById('courseSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectCourse}</option>`;
    courseCatalog.forEach(c => {
      const text = c[lang];
      const isSelected = (currentVal === c.en || currentVal === c.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    html += `<option value="__custom__" ${currentVal === '__custom__' ? 'selected' : ''}>${dict.optCustomCourse}</option>`;
    sel.innerHTML = html;
  }

  function populateLocationSelect(lang) {
    const sel = document.getElementById('locationSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectLocation}</option>`;
    locationCatalog.forEach(loc => {
      const text = loc[lang];
      const isSelected = (currentVal === loc.en || currentVal === loc.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    html += `<option value="__custom__" ${currentVal === '__custom__' ? 'selected' : ''}>${dict.optCustomLocation}</option>`;
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

    populateCourseSelect(lang);
    populateLocationSelect(lang);
    updateAdminCloudStatus(db !== null);

    const statusText = document.getElementById('qrStatusText');
    if (statusText) {
      statusText.textContent = currentSession ? dict.statusActive : dict.statusStandby;
    }

    renderSessionsAccordion();
  }

  // 7. Host URL Resolution
  function getBaseHostUrl() {
    const customHost = localStorage.getItem('attendtrack_custom_host_v1');
    if (customHost && customHost.trim() !== '') {
      return customHost.trim().replace(/\/+$/, '');
    }

    if (window.location.protocol === 'file:') {
      return 'https://unrwa-training.netlify.app';
    }

    return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '').replace(/\/+$/, '');
  }

  function generateCheckinUrl(session = null) {
    const targetSession = session || currentSession;
    if (!targetSession) return '';
    const base = getBaseHostUrl();
    const cleanBase = base.startsWith('http') ? base : 'https://' + base;
    const url = new URL(cleanBase + '/checkin.html');
    url.searchParams.set('c', targetSession.course);
    url.searchParams.set('loc', targetSession.location);
    url.searchParams.set('tr', targetSession.trainer);
    url.searchParams.set('d', targetSession.date);
    url.searchParams.set('t', targetSession.time);
    url.searchParams.set('sid', targetSession.sessionId);
    return url.toString();
  }

  // 8. QR Code Rendering
  function renderQrCodes() {
    if (!currentSession) return;
    const targetUrl = generateCheckinUrl(currentSession);
    if (!targetUrl) return;

    if (typeof QRCode === 'undefined') {
      setTimeout(renderQrCodes, 250);
      return;
    }

    const displayHost = document.getElementById('hostCurrentUrlDisplay');
    if (displayHost) {
      displayHost.textContent = targetUrl;
    }

    // 1. Admin Dashboard QR
    const qrAdminContainer = document.getElementById('qrcode');
    if (qrAdminContainer) {
      qrAdminContainer.innerHTML = '';
      adminQr = new QRCode(qrAdminContainer, {
        text: targetUrl,
        width: 210,
        height: 210,
        colorDark: '#002d62',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // 2. Projector Modal QR
    const qrProjContainer = document.getElementById('projectorQrcode');
    if (qrProjContainer) {
      qrProjContainer.innerHTML = '';
      projectorQr = new QRCode(qrProjContainer, {
        text: targetUrl,
        width: 320,
        height: 320,
        colorDark: '#002d62',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // 3. A4 Table Flyer QR
    const qrFlyerContainer = document.getElementById('flyerQrcode');
    if (qrFlyerContainer) {
      qrFlyerContainer.innerHTML = '';
      flyerQr = new QRCode(qrFlyerContainer, {
        text: targetUrl,
        width: 220,
        height: 220,
        colorDark: '#002d62',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  // 9. Session Activation
  function activateSession(sessionObj) {
    currentSession = sessionObj;
    localStorage.setItem('attendtrack_active_session_v1', JSON.stringify(sessionObj));

    let existingIndex = allSessions.findIndex(s => s.sessionId === sessionObj.sessionId);
    if (existingIndex >= 0) {
      allSessions[existingIndex] = { ...allSessions[existingIndex], ...sessionObj, isExpanded: true };
    } else {
      allSessions.unshift({ ...sessionObj, attendees: [], isExpanded: true });
    }
    saveLocalSessions();

    const placeholder = document.getElementById('qrStandbyPlaceholder');
    const content = document.getElementById('qrActiveContent');
    const statusPill = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');
    const dict = translations[currentLang];

    if (placeholder) placeholder.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    if (statusPill) statusPill.className = 'status-pill status-active';
    if (statusText) statusText.textContent = dict.statusActive;

    document.getElementById('displayCourseTitle').textContent = sessionObj.course;
    document.getElementById('displayLocation').textContent = sessionObj.location;
    document.getElementById('displayTrainer').textContent = sessionObj.trainer;
    document.getElementById('displayDate').textContent = sessionObj.date;
    document.getElementById('displayTime').textContent = sessionObj.time;

    // Projector Modal
    document.getElementById('projCourseTitle').textContent = sessionObj.course;
    document.getElementById('projLocation').textContent = sessionObj.location;
    document.getElementById('projTrainer').textContent = sessionObj.trainer;
    document.getElementById('projDate').textContent = sessionObj.date;
    document.getElementById('projTime').textContent = sessionObj.time;

    // A4 Flyer
    document.getElementById('flyerCourseTitle').textContent = sessionObj.course;
    document.getElementById('flyerLocation').textContent = sessionObj.location;
    document.getElementById('flyerTrainer').textContent = sessionObj.trainer;
    document.getElementById('flyerDate').textContent = sessionObj.date;
    document.getElementById('flyerTime').textContent = sessionObj.time;

    renderQrCodes();

    if (db) {
      db.ref('active_session').set(sessionObj).catch(console.warn);
      db.ref('sessions/' + sessionObj.sessionId + '/meta').set(sessionObj).catch(console.warn);
    }

    renderSessionsAccordion();
    updateGlobalStats();
  }

  // 10. Real-time Firebase Sync
  function initRealtimeFirebaseSync() {
    if (!db) return;

    db.ref('sessions').on('value', (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        allSessions = [];
        saveLocalSessions();
        renderSessionsAccordion();
        updateGlobalStats();
        return;
      }

      let hasChanges = false;
      let newAttendeeArrival = null;

      Object.keys(val).forEach(sid => {
        const remoteSession = val[sid];
        const meta = remoteSession.meta || {};
        const remoteAttendeesMap = remoteSession.attendees || {};
        const remoteAttendeesList = Object.values(remoteAttendeesMap);

        let localSession = allSessions.find(s => s.sessionId === sid);
        if (!localSession) {
          localSession = {
            sessionId: sid,
            course: meta.course || 'Training Session',
            trainer: meta.trainer || 'Trainer',
            location: meta.location || 'UNRWA Station',
            date: meta.date || new Date().toISOString().split('T')[0],
            time: meta.time || '09:00 AM - 02:00 PM',
            attendees: [],
            isExpanded: (currentSession && currentSession.sessionId === sid)
          };
          allSessions.push(localSession);
          hasChanges = true;
        }

        const prevCount = localSession.attendees.length;
        localSession.attendees = remoteAttendeesList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (!isInitialFirebaseLoad && localSession.attendees.length > prevCount) {
          hasChanges = true;
          newAttendeeArrival = {
            attendee: localSession.attendees[0],
            course: localSession.course
          };
        }
      });

      if (hasChanges || isInitialFirebaseLoad) {
        saveLocalSessions();
        renderSessionsAccordion();
        updateGlobalStats();

        if (newAttendeeArrival && !isInitialFirebaseLoad) {
          playCheckinChime();
          const dict = translations[currentLang];
          const msg = (currentLang === 'ar')
            ? `تسجيل حضور جديد في [${newAttendeeArrival.course}]: ${newAttendeeArrival.attendee.name} (${newAttendeeArrival.attendee.department})`
            : `New check-in in [${newAttendeeArrival.course}]: ${newAttendeeArrival.attendee.name} (${newAttendeeArrival.attendee.department})`;
          showToast(msg, 'success');
        }
      }
    });

    setTimeout(() => {
      isInitialFirebaseLoad = false;
    }, 2000);
  }

  function saveLocalSessions() {
    try {
      localStorage.setItem('attendtrack_all_sessions_v2', JSON.stringify(allSessions));
    } catch (e) {
      console.warn(e);
    }
  }

  // 11. Render Sessions Archive Folders
  function renderSessionsAccordion(searchQuery = '') {
    const container = document.getElementById('sessionsAccordionContainer');
    if (!container) return;
    const dict = translations[currentLang];

    if (allSessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.8rem; color: var(--text-light); margin-bottom: 0.85rem;"></i>
          <h4>${dict.noSessionsTitle}</h4>
          <p>${dict.noSessionsDesc}</p>
        </div>
      `;
      return;
    }

    const filtered = allSessions.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const inCourse = s.course.toLowerCase().includes(q);
      const inTrainer = s.trainer.toLowerCase().includes(q);
      const inLocation = s.location.toLowerCase().includes(q);
      const inAttendees = (s.attendees || []).some(a =>
        a.name.toLowerCase().includes(q) ||
        a.empNumber.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)
      );
      return inCourse || inTrainer || inLocation || inAttendees;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${dict.noFilterResults}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(session => {
      const isActive = currentSession && currentSession.sessionId === session.sessionId;
      const attendeeCount = (session.attendees || []).length;
      const expandedClass = session.isExpanded ? 'expanded' : '';
      const activeClass = isActive ? 'is-active-session' : '';

      const liveBadge = isActive
        ? `<span class="badge-live-now">${dict.badgeLiveNow}</span>`
        : '';

      const maleCount = (session.attendees || []).filter(a => a.gender === 'Male').length;
      const femaleCount = (session.attendees || []).filter(a => a.gender === 'Female').length;
      const deptsCount = new Set((session.attendees || []).map(a => a.department)).size;

      // Table Rows
      let tableRows = '';
      if (attendeeCount === 0) {
        tableRows = `
          <tr class="empty-row">
            <td colspan="9">
              <div class="empty-state" style="padding: 1.5rem;">
                <h5>${dict.noAttendeesYet}</h5>
                <p><small>${dict.noAttendeesYetSub}</small></p>
              </div>
            </td>
          </tr>
        `;
      } else {
        tableRows = (session.attendees || []).map((att, idx) => {
          const genderText = att.gender === 'Male'
            ? ((currentLang === 'ar') ? 'ذكر' : 'Male')
            : ((currentLang === 'ar') ? 'أنثى' : 'Female');

          const genderBadge = att.gender === 'Male'
            ? `<span class="badge badge-male">${genderText}</span>`
            : `<span class="badge badge-female">${genderText}</span>`;

          return `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${escapeHtml(att.empNumber)}</strong></td>
              <td class="font-bold text-unrwa">${escapeHtml(att.name)}</td>
              <td>${genderBadge}</td>
              <td>${escapeHtml(att.department)}</td>
              <td>${escapeHtml(att.jobTitle)}</td>
              <td><span class="badge badge-grade">${escapeHtml(att.grade)}</span></td>
              <td><small class="text-muted">${escapeHtml(att.displayTime || '')}</small></td>
              <td>
                <button class="btn-icon text-danger" title="${dict.thActions}" onclick="event.stopPropagation(); window.AttendTrackAdmin.deleteAttendee('${session.sessionId}', '${att.id}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      return `
        <div class="session-folder ${activeClass} ${expandedClass}" id="folder_${session.sessionId}">
          <!-- Folder Header -->
          <div class="folder-header" onclick="window.AttendTrackAdmin.toggleFolder('${session.sessionId}')">
            
            <div class="folder-left-info">
              <div class="folder-icon-box">
                <i class="fa-solid ${isActive ? 'fa-folder-open' : 'fa-folder'}"></i>
              </div>
              <div class="folder-title-group">
                <h3 class="folder-course-title">
                  <span>${escapeHtml(session.course)}</span>
                  ${liveBadge}
                </h3>
                <div class="folder-meta-row">
                  <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(session.location)}</span>
                  <span><i class="fa-solid fa-user-tie"></i> ${escapeHtml(session.trainer)}</span>
                  <span><i class="fa-solid fa-calendar"></i> ${escapeHtml(session.date)}</span>
                  <span><i class="fa-solid fa-clock"></i> ${escapeHtml(session.time)}</span>
                </div>
              </div>
            </div>

            <!-- Folder Right Controls -->
            <div class="folder-right-controls" onclick="event.stopPropagation();">
              
              <span class="folder-attendee-counter" title="${dict.lblAttendeesCount}">
                <b>${attendeeCount}</b> ${dict.lblAttendeesCount}
              </span>

              <button type="button" class="btn-folder-excel" onclick="window.AttendTrackAdmin.exportSessionExcel('${session.sessionId}')" title="${dict.btnExportExcel}">
                <i class="fa-solid fa-file-excel"></i>
                <span>${dict.btnExportExcel}</span>
              </button>

              ${!isActive ? `
                <button type="button" class="btn-folder-activate" onclick="window.AttendTrackAdmin.activateSessionQr('${session.sessionId}')" title="${dict.btnActivateQR}">
                  <i class="fa-solid fa-qrcode"></i>
                  <span>${dict.btnActivateQR}</span>
                </button>
              ` : ''}

              <button type="button" class="btn-icon text-danger" onclick="window.AttendTrackAdmin.deleteSession('${session.sessionId}')" title="${dict.confirmDeleteSession}">
                <i class="fa-solid fa-trash-can"></i>
              </button>

              <div class="folder-chevron" onclick="window.AttendTrackAdmin.toggleFolder('${session.sessionId}')">
                <i class="fa-solid fa-chevron-down"></i>
              </div>

            </div>

          </div>

          <!-- Folder Body -->
          <div class="folder-body">
            
            <div class="folder-summary-stats">
              <div class="folder-stat-pill">
                <span>${dict.statTotalRegistered}</span>
                <strong>${attendeeCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statGenderRatio}</span>
                <strong>${maleCount} / ${femaleCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statDepartments}</span>
                <strong>${deptsCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statCheckinLink}</span>
                <a href="${generateCheckinUrl(session)}" target="_blank" style="color: var(--un-blue-primary); font-size: 0.8rem; text-decoration: underline;">
                  ${dict.linkOpenForm}
                </a>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th width="40">#</th>
                    <th>${dict.thEmpNo}</th>
                    <th>${dict.thTraineeName}</th>
                    <th>${dict.thGender}</th>
                    <th>${dict.thDepartment}</th>
                    <th>${dict.thJobTitle}</th>
                    <th>${dict.thGrade}</th>
                    <th>${dict.thTimestamp}</th>
                    <th>${dict.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      `;
    }).join('');
  }

  // 12. Update Global Stats
  function updateGlobalStats() {
    let grandTotal = 0;
    allSessions.forEach(s => {
      grandTotal += (s.attendees || []).length;
    });

    const elHeroTotal = document.getElementById('heroTotalAttendees');
    const elActiveSessions = document.getElementById('heroActiveSessions');
    const elProjCount = document.getElementById('projAttendeeCount');

    if (elHeroTotal) elHeroTotal.textContent = grandTotal;
    if (elActiveSessions) elActiveSessions.textContent = allSessions.length;

    if (elProjCount && currentSession) {
      const activeObj = allSessions.find(s => s.sessionId === currentSession.sessionId);
      elProjCount.textContent = activeObj ? (activeObj.attendees || []).length : 0;
    }
  }

  // 13. Isolated Excel Export (100% pure language headers)
  function exportSessionExcel(sessionId) {
    const session = allSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      showToast('Session not found', 'error');
      return;
    }

    const dict = translations[currentLang];
    const sessionAttendees = session.attendees || [];
    if (sessionAttendees.length === 0) {
      showToast((currentLang === 'ar') ? `لا يوجد حضور مسجلون في دورة [${session.course}] لتصديرهم.` : `No attendees registered in [${session.course}] to export.`, 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showToast('SheetJS Excel library not loaded', 'error');
      return;
    }

    const headers = {
      idx: '#',
      empNo: dict.excelHeaderEmpNo,
      name: dict.excelHeaderName,
      gender: dict.excelHeaderGender,
      dept: dict.excelHeaderDept,
      job: dict.excelHeaderJob,
      grade: dict.excelHeaderGrade,
      course: dict.excelHeaderCourse,
      location: dict.excelHeaderLocation,
      trainer: dict.excelHeaderTrainer,
      date: dict.excelHeaderDate,
      time: dict.excelHeaderTime
    };

    const excelData = sessionAttendees.map((item, idx) => ({
      [headers.idx]: idx + 1,
      [headers.empNo]: item.empNumber,
      [headers.name]: item.name,
      [headers.gender]: (item.gender === 'Male') ? ((currentLang === 'ar') ? 'ذكر' : 'Male') : ((currentLang === 'ar') ? 'أنثى' : 'Female'),
      [headers.dept]: item.department,
      [headers.job]: item.jobTitle,
      [headers.grade]: item.grade,
      [headers.course]: session.course,
      [headers.location]: session.location,
      [headers.trainer]: session.trainer,
      [headers.date]: session.date,
      [headers.time]: item.displayTime || item.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(session.course));

    const fileName = `UNRWA_${session.date}_${sanitizeFileName(session.course)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast((currentLang === 'ar') ? `تم تصدير ملف إكسل الخاص بدورة [${session.course}] بنجاح.` : `Excel file downloaded for [${session.course}].`, 'success');
  }

  // 14. Global Actions
  window.AttendTrackAdmin = {
    toggleFolder: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        s.isExpanded = !s.isExpanded;
        const el = document.getElementById('folder_' + sessionId);
        if (el) el.classList.toggle('expanded', s.isExpanded);
      }
    },

    activateSessionQr: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        activateSession(s);
        const dict = translations[currentLang];
        showToast((currentLang === 'ar') ? `تم تفعيل الرمز لدورة: ${s.course}` : `Active session switched to: ${s.course}`, 'info');
      }
    },

    exportSessionExcel: function (sessionId) {
      exportSessionExcel(sessionId);
    },

    deleteAttendee: function (sessionId, attendeeId) {
      const dict = translations[currentLang];
      if (confirm(dict.confirmDeleteAttendee)) {
        const session = allSessions.find(s => s.sessionId === sessionId);
        if (session) {
          session.attendees = (session.attendees || []).filter(a => a.id !== attendeeId);
          saveLocalSessions();

          if (db) {
            db.ref('sessions/' + sessionId + '/attendees').once('value').then(snap => {
              snap.forEach(child => {
                if (child.val().id === attendeeId) {
                  child.ref.remove();
                }
              });
            });
          }

          renderSessionsAccordion();
          updateGlobalStats();
          showToast(dict.toastAttendeeDeleted, 'info');
        }
      }
    },

    deleteSession: function (sessionId) {
      const session = allSessions.find(s => s.sessionId === sessionId);
      const name = session ? session.course : '';
      const dict = translations[currentLang];

      if (confirm((currentLang === 'ar') ? `هل أنت متأكد من حذف دورة [${name}] بالكامل مع كافة سجلات الحضور؟` : `Are you sure you want to delete course [${name}] and all its attendee records?`)) {
        allSessions = allSessions.filter(s => s.sessionId !== sessionId);
        saveLocalSessions();

        if (db) {
          db.ref('sessions/' + sessionId).remove().catch(console.warn);
        }

        if (currentSession && currentSession.sessionId === sessionId) {
          currentSession = allSessions.length > 0 ? allSessions[0] : null;
          if (currentSession) {
            activateSession(currentSession);
          } else {
            localStorage.removeItem('attendtrack_active_session_v1');
            const placeholder = document.getElementById('qrStandbyPlaceholder');
            const content = document.getElementById('qrActiveContent');
            if (placeholder) placeholder.classList.remove('hidden');
            if (content) content.classList.add('hidden');
          }
        }

        renderSessionsAccordion();
        updateGlobalStats();
        showToast(dict.toastSessionDeleted, 'info');
      }
    }
  };

  // 15. Event Listeners Setup
  function initEventListeners() {
    const btnUpdate = document.getElementById('btnUpdateSession');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', handleSessionConfigSubmit);
    }

    const courseSel = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    if (courseSel && courseCustom) {
      courseSel.addEventListener('change', function () {
        if (this.value === '__custom__') {
          courseCustom.classList.remove('hidden');
          courseCustom.focus();
        } else {
          courseCustom.classList.add('hidden');
        }
      });
    }

    const locSel = document.getElementById('locationSelect');
    const locCustom = document.getElementById('locationCustomInput');
    if (locSel && locCustom) {
      locSel.addEventListener('change', function () {
        if (this.value === '__custom__') {
          locCustom.classList.remove('hidden');
          locCustom.focus();
        } else {
          locCustom.classList.add('hidden');
        }
      });
    }

    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'en' ? 'ar' : 'en');
      });
    }

    const btnClearAll = document.getElementById('btnClearAllSessions');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        const dict = translations[currentLang];
        if (confirm(dict.confirmClearArchive)) {
          allSessions = [];
          currentSession = null;
          saveLocalSessions();
          localStorage.removeItem('attendtrack_active_session_v1');

          if (db) {
            db.ref('sessions').remove().catch(console.warn);
            db.ref('active_session').remove().catch(console.warn);
          }

          const placeholder = document.getElementById('qrStandbyPlaceholder');
          const content = document.getElementById('qrActiveContent');
          if (placeholder) placeholder.classList.remove('hidden');
          if (content) content.classList.add('hidden');

          renderSessionsAccordion();
          updateGlobalStats();
          showToast(dict.toastArchiveCleared, 'info');
        }
      });
    }

    const searchInput = document.getElementById('archiveSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderSessionsAccordion(this.value);
      });
    }

    const btnCopy = document.getElementById('btnCopyCheckinLink');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const link = generateCheckinUrl();
        const dict = translations[currentLang];
        navigator.clipboard.writeText(link).then(() => {
          showToast(dict.toastLinkCopied, 'success');
        }).catch(() => {
          showToast(link, 'info');
        });
      });
    }

    const btnTest = document.getElementById('btnTestMobileView');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        const link = generateCheckinUrl();
        window.open(link, '_blank');
      });
    }

    const btnProj = document.getElementById('btnOpenProjector');
    const modalProj = document.getElementById('projectorModal');
    const btnCloseProj = document.getElementById('btnCloseProjector');
    if (btnProj && modalProj) {
      btnProj.addEventListener('click', () => {
        modalProj.classList.remove('hidden');
        renderQrCodes();
      });
    }
    if (btnCloseProj && modalProj) {
      btnCloseProj.addEventListener('click', () => {
        modalProj.classList.add('hidden');
      });
    }

    const btnFlyer = document.getElementById('btnPrintFlyer');
    const modalFlyer = document.getElementById('printFlyerModal');
    const btnCloseFlyer = document.getElementById('btnClosePrintFlyer');
    const btnExecPrint = document.getElementById('btnExecutePrint');
    if (btnFlyer && modalFlyer) {
      btnFlyer.addEventListener('click', () => {
        modalFlyer.classList.remove('hidden');
        renderQrCodes();
      });
    }
    if (btnCloseFlyer && modalFlyer) {
      btnCloseFlyer.addEventListener('click', () => {
        modalFlyer.classList.add('hidden');
      });
    }
    if (btnExecPrint) {
      btnExecPrint.addEventListener('click', () => {
        window.print();
      });
    }

    const btnToggleHost = document.getElementById('btnToggleHostEdit');
    const hostEditForm = document.getElementById('hostEditForm');
    const customHostInput = document.getElementById('customHostInput');
    const btnSaveHost = document.getElementById('btnSaveHost');
    const btnResetHost = document.getElementById('btnResetHost');

    if (btnToggleHost && hostEditForm) {
      btnToggleHost.addEventListener('click', () => {
        hostEditForm.classList.toggle('hidden');
        if (customHostInput) customHostInput.value = getBaseHostUrl();
      });
    }
    if (btnSaveHost && customHostInput) {
      btnSaveHost.addEventListener('click', () => {
        const val = customHostInput.value.trim();
        const dict = translations[currentLang];
        if (val) {
          localStorage.setItem('attendtrack_custom_host_v1', val);
          hostEditForm.classList.add('hidden');
          renderQrCodes();
          showToast(dict.toastHostUpdated, 'success');
        }
      });
    }
    if (btnResetHost) {
      btnResetHost.addEventListener('click', () => {
        const dict = translations[currentLang];
        localStorage.removeItem('attendtrack_custom_host_v1');
        hostEditForm.classList.add('hidden');
        renderQrCodes();
        showToast(dict.toastHostReset, 'info');
      });
    }
  }

  function handleSessionConfigSubmit() {
    const courseSel = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    const trainerInput = document.getElementById('trainerInput');
    const locSel = document.getElementById('locationSelect');
    const locCustom = document.getElementById('locationCustomInput');
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');

    let course = courseSel ? courseSel.value : '';
    if (course === '__custom__' && courseCustom) course = courseCustom.value.trim();

    const trainer = trainerInput ? trainerInput.value.trim() : '';

    let location = locSel ? locSel.value : '';
    if (location === '__custom__' && locCustom) location = locCustom.value.trim();

    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value.trim() : '';

    if (!course || course === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى اختيار اسم الدورة التدريبية.' : 'Please select Course Name.', 'error');
      return;
    }
    if (!trainer) {
      showToast((currentLang === 'ar') ? 'يرجى كتابة اسم المدرب.' : 'Please enter Trainer Name.', 'error');
      return;
    }
    if (!location || location === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى تحديد مكان التدريب.' : 'Please select Venue / Location.', 'error');
      return;
    }
    if (!date) {
      showToast((currentLang === 'ar') ? 'يرجى تحديد تاريخ الجلسة.' : 'Please select Date.', 'error');
      return;
    }
    if (!time) {
      showToast((currentLang === 'ar') ? 'يرجى إدخال توقيت الجلسة.' : 'Please enter Timing.', 'error');
      return;
    }

    const sessionId = 'session_' + encodeURIComponent((course + '_' + date).replace(/[^a-zA-Z0-9]/g, '_'));

    const sessionObj = {
      course: course,
      trainer: trainer,
      location: location,
      date: date,
      time: time,
      sessionId: sessionId
    };

    activateSession(sessionObj);
    const dict = translations[currentLang];
    showToast((currentLang === 'ar') ? `تم تفعيل دورة [${course}] بنجاح.` : `Session [${course}] activated successfully.`, 'success');
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function sanitizeFileName(str) {
    return str.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 30);
  }

  function sanitizeSheetName(str) {
    return str.replace(/[\\/*?:[\]]/g, '_').substring(0, 31);
  }

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('sessionDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    initEventListeners();
    applyLanguage(currentLang);

    const savedSessions = localStorage.getItem('attendtrack_all_sessions_v2');
    if (savedSessions) {
      try {
        allSessions = JSON.parse(savedSessions);
      } catch (e) {
        console.warn(e);
      }
    }

    currentSession = null;
    const placeholder = document.getElementById('qrStandbyPlaceholder');
    const content = document.getElementById('qrActiveContent');
    const statusPill = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');
    const dict = translations[currentLang];

    if (placeholder) placeholder.classList.remove('hidden');
    if (content) content.classList.add('hidden');
    if (statusPill) statusPill.className = 'status-pill';
    if (statusText) statusText.textContent = dict.statusStandby;

    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) sessionForm.reset();

    renderSessionsAccordion();
    updateGlobalStats();
    initRealtimeFirebaseSync();
  });

})();
