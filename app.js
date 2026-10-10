/**
 * AttendTrack - HR & Trainer Portal Logic
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Dynamic QR Codes + Excel (.xlsx) Export
 */

(function () {
  'use strict';

  // 1. Firebase Configuration & Initialization
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
      text.textContent = 'Live Cloud Sync / متصل سحابياً';
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = 'Local Standby / وضع محلي';
    }
  }

  // 2. Application State
  let currentSession = null;
  let attendees = [];
  let currentLang = 'en'; // 'en' | 'ar'
  let adminQr = null;
  let projectorQr = null;
  let flyerQr = null;
  let activeFirebaseListenerRef = null;
  let isInitialFirebaseLoad = true;

  // 3. Audio Chime (Web Audio API - No external mp3 file needed)
  function playCheckinChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.36);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  }

  // 4. Bilingual Translation Dictionary
  const translations = {
    en: {
      portalSubTitle: 'Staff Development & Training Division · لوحة تحكم التدريب',
      adminHeroTitle: 'Smart Attendance & Digital Certificate Suite',
      adminHeroDesc: 'Generate dynamic QR codes for mobile attendance registration with live English name validation and single-click Excel export.',
      badgeOfficial: 'Official UNRWA Staff Development Portal',
      statRegistered: 'Total Registered',
      statActiveSession: 'Active Session',
      sessionSetupTitle: '1. Session Details (إعداد الجلسة)',
      sessionSetupHint: 'Set details to activate session QR',
      lblCourseName: 'Course / Training Name (اسم الدورة)',
      lblTrainerName: 'Trainer Name (اسم المدرب)',
      lblLocation: 'Location / Duty Station (المكان)',
      lblDate: 'Session Date (التاريخ)',
      lblTime: 'Timing (التوقيت)',
      btnGenerateQR: 'Generate QR & Activate Session',
      qrDisplayTitle: '2. Dynamic Session QR Code',
      statusStandby: 'Awaiting Setup',
      statusActive: 'Session Live & Scanning',
      standbyTitle: 'No Session Generated Yet',
      standbyDesc: 'Please fill in the training details on the left (Course, Trainer, Location, Date, Time) and click "Generate QR & Activate Session" to create your official session QR code.',
      btnProjectorMode: 'Projector Mode',
      btnPrintFlyer: 'Print A4 Poster',
      btnCopyLink: 'Copy Link',
      btnTestCheckin: 'Test Trainee Page',
      hostLabel: 'QR Destination Link (رابط مسح الكود للمتدربين):',
      btnEditHost: 'Change / تغيير',
      rosterTitle: '3. Live Training Attendance Feed',
      rosterSubtitle: 'Real-time attendee list. Instant sync from mobile attendees with zero refresh needed.',
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
      emptyStateDesc: 'Trainees scanning the QR code from their mobile phones will appear here instantly in real-time.',
      projInstructionTitle: 'Scan QR with your phone camera to register attendance',
      projInstructionDesc: 'Ensure your name is typed accurately in English for your official completion certificate.',
      projLiveCount: 'Attendees Registered:',
      btnPrintNow: 'Print Now (طباعة الآن)',
      btnClose: 'Close (إغلاق)'
    },
    ar: {
      portalSubTitle: 'قسم تطوير الموظفين والتدريب - الأونروا',
      adminHeroTitle: 'منظومة تسجيل الحضور الذكية وإعداد الشهادات الرقمية',
      adminHeroDesc: 'توليد رموز QR ذكية لتسجيل الحضور عبر الموبايل مع تدقيق فوري للأسماء بالإنكليزية وتصدير كشف إكسل رسمي بنقرة واحدة.',
      badgeOfficial: 'بوابة التدريب الرسمية - قسم الموارد البشرية بالأونروا',
      statRegistered: 'إجمالي الحاضرين',
      statActiveSession: 'الجلسة النشطة',
      sessionSetupTitle: '1. بيانات الجلسة التدريبية',
      sessionSetupHint: 'حدد البيانات لتوليد الـ QR كود وتفعيل الجلسة',
      lblCourseName: 'اسم الدورة / التدريب',
      lblTrainerName: 'اسم المدرب',
      lblLocation: 'المكان / المركز التدريبي',
      lblDate: 'تاريخ الجلسة',
      lblTime: 'التوقيت',
      btnGenerateQR: 'تفعيل الجلسة وتوليد QR كود',
      qrDisplayTitle: '2. الـ QR كود الذكي للجلسة',
      statusStandby: 'في انتظار الإعداد',
      statusActive: 'الجلسة نشطة ومستعدة للمسح',
      standbyTitle: 'لم يتم إنشاء أي جلسة حتى الآن',
      standbyDesc: 'يرجى تعبئة بيانات التدريب في الطرف الأيسر (اسم الدورة، المدرب، المكان، التاريخ، التوقيت) ثم الضغط على "تفعيل الجلسة وتوليد QR كود".',
      btnProjectorMode: 'عرض البروجيكتور',
      btnPrintFlyer: 'طباعة بوستر A4',
      btnCopyLink: 'نسخ الرابط',
      btnTestCheckin: 'تجربة صفحة المتدرب',
      hostLabel: 'رابط مسح الكود للمتدربين:',
      btnEditHost: 'تعديل',
      rosterTitle: '3. كشف الحضور المباشر (لحظي)',
      rosterSubtitle: 'قائمة المتدربين المسجلين مباشرة من هواتفهم دون الحاجة لأي تحديث.',
      searchPlaceholder: 'بحث بالاسم، الرقم الوظيفي، القسم...',
      btnExportExcel: 'تصدير كشف إكسل (.xlsx)',
      statTotalAttendees: 'إجمالي الحضور:',
      statGenderRatio: 'الجنس (ذكور / إناث):',
      statDepts: 'الأقسام:',
      statLatestCheckin: 'آخر تسجيل:',
      thEmpNo: 'الرقم الوظيفي',
      thTraineeName: 'اسم المتدرب (إنكليزي)',
      thGender: 'الجنس',
      thDepartment: 'القسم / الدائرة',
      thJobTitle: 'المسمى الوظيفي',
      thGrade: 'الدرجة',
      thTimestamp: 'الوقت',
      thActions: 'إجراءات',
      emptyStateTitle: 'لا يوجد متدربون مسجلون بعد',
      emptyStateDesc: 'بمجرد أن يمسح المتدربون الـ QR كود من هواتفهم، ستظهر أسماؤهم هنا فوراً بلحظتها.',
      projInstructionTitle: 'امسح الـ QR كود بكاميرا الموبايل لتسجيل حضورك',
      projInstructionDesc: 'يرجى كتابة الاسم بدقة باللغة الإنكليزية لطباعة الشهادة الرسمية.',
      projLiveCount: 'المسجلون حالياً:',
      btnPrintNow: 'طباعة الآن',
      btnClose: 'إغلاق'
    }
  };

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
  }

  // 5. Host URL Resolution
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

  function generateCheckinUrl() {
    if (!currentSession) return '';
    const base = getBaseHostUrl();
    const cleanBase = base.startsWith('http') ? base : 'https://' + base;
    const url = new URL(cleanBase + '/checkin.html');
    url.searchParams.set('c', currentSession.course);
    url.searchParams.set('loc', currentSession.location);
    url.searchParams.set('tr', currentSession.trainer);
    url.searchParams.set('d', currentSession.date);
    url.searchParams.set('t', currentSession.time);
    url.searchParams.set('sid', currentSession.sessionId);
    return url.toString();
  }

  // 6. QR Code Rendering
  function renderQrCodes() {
    if (!currentSession) return;
    const targetUrl = generateCheckinUrl();
    if (!targetUrl) return;

    if (typeof QRCode === 'undefined') {
      setTimeout(renderQrCodes, 250);
      return;
    }

    // Update displayed host link
    const displayHost = document.getElementById('hostCurrentUrlDisplay');
    if (displayHost) {
      displayHost.textContent = targetUrl;
    }

    // 1. Admin Dashboard Main QR
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

  // 7. Session Activation
  function activateSession(sessionObj) {
    currentSession = sessionObj;
    localStorage.setItem('attendtrack_active_session_v1', JSON.stringify(sessionObj));

    // Update UI elements
    const placeholder = document.getElementById('qrStandbyPlaceholder');
    const content = document.getElementById('qrActiveContent');
    const statusPill = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');

    if (placeholder) placeholder.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    if (statusPill) statusPill.className = 'status-pill status-active';
    if (statusText) statusText.textContent = (currentLang === 'ar') ? 'الجلسة نشطة ومستعدة للمسح' : 'Session Live & Scanning';

    document.getElementById('displayCourseTitle').textContent = sessionObj.course;
    document.getElementById('displayLocation').textContent = sessionObj.location;
    document.getElementById('displayTrainer').textContent = sessionObj.trainer;
    document.getElementById('displayDate').textContent = sessionObj.date;
    document.getElementById('displayTime').textContent = sessionObj.time;

    // Projector Modal Headers
    document.getElementById('projCourseTitle').textContent = sessionObj.course;
    document.getElementById('projLocation').textContent = sessionObj.location;
    document.getElementById('projTrainer').textContent = sessionObj.trainer;
    document.getElementById('projDate').textContent = sessionObj.date;
    document.getElementById('projTime').textContent = sessionObj.time;

    // A4 Flyer Headers
    document.getElementById('flyerCourseTitle').textContent = sessionObj.course;
    document.getElementById('flyerLocation').textContent = sessionObj.location;
    document.getElementById('flyerTrainer').textContent = sessionObj.trainer;
    document.getElementById('flyerDate').textContent = sessionObj.date;
    document.getElementById('flyerTime').textContent = sessionObj.time;

    // Render QRs
    renderQrCodes();

    // Sync Active Session with Firebase
    if (db) {
      db.ref('active_session').set(sessionObj).catch(console.warn);
    }

    // Attach Real-time Firebase Listener
    listenToSessionAttendees(sessionObj.sessionId);
  }

  // 8. Real-time Firebase Listener
  function listenToSessionAttendees(sessionId) {
    if (!db || !sessionId) return;

    if (activeFirebaseListenerRef) {
      activeFirebaseListenerRef.off();
    }

    isInitialFirebaseLoad = true;
    const sessionAttendeesRef = db.ref('sessions/' + sessionId + '/attendees');
    activeFirebaseListenerRef = sessionAttendeesRef;

    sessionAttendeesRef.on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const exists = attendees.some(a => a.id === data.id || (a.empNumber === data.empNumber && a.sessionId === data.sessionId));
      if (!exists) {
        attendees.unshift(data);
        saveLocalAttendeesBackup();
        renderAttendanceTable();
        updateSummaryStats();

        // If not initial batch load, alert trainer!
        if (!isInitialFirebaseLoad) {
          playCheckinChime();
          showToast(`✨ الحضور الجديد: ${data.name} (${data.department})`, 'success');
        }
      }
    });

    // Mark initial load finished after 1.5 seconds
    setTimeout(() => {
      isInitialFirebaseLoad = false;
    }, 1500);
  }

  function saveLocalAttendeesBackup() {
    try {
      localStorage.setItem('attendtrack_attendees_v1', JSON.stringify(attendees));
    } catch (e) {
      console.warn(e);
    }
  }

  // 9. Render Attendance Table
  function renderAttendanceTable(filteredList = null) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    const list = filteredList || attendees;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr class="empty-row" id="emptyStateRow">
          <td colspan="9">
            <div class="empty-state">
              <i class="fa-solid fa-clipboard-user"></i>
              <h4 data-i18n="emptyStateTitle">${(currentLang === 'ar') ? 'لا يوجد متدربون مسجلون بعد' : 'No Attendees Registered Yet'}</h4>
              <p data-i18n="emptyStateDesc">${(currentLang === 'ar') ? 'بمجرد أن يمسح المتدربون الـ QR كود من هواتفهم، ستظهر أسماؤهم هنا فوراً بلحظتها.' : 'Trainees scanning the QR code from their mobile phones will appear here instantly in real-time.'}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((item, index) => {
      const genderBadge = item.gender === 'Male'
        ? '<span class="badge badge-male"><i class="fa-solid fa-person"></i> Male</span>'
        : '<span class="badge badge-female"><i class="fa-solid fa-person-dress"></i> Female</span>';

      return `
        <tr class="attendee-row" data-id="${item.id}">
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(item.empNumber)}</strong></td>
          <td class="font-bold text-unrwa">${escapeHtml(item.name)}</td>
          <td>${genderBadge}</td>
          <td>${escapeHtml(item.department)}</td>
          <td>${escapeHtml(item.jobTitle)}</td>
          <td><span class="badge badge-grade">${escapeHtml(item.grade)}</span></td>
          <td><small class="text-muted">${escapeHtml(item.displayTime || '')}</small></td>
          <td>
            <button class="btn-icon text-danger" title="Delete" onclick="window.AttendTrackAdmin.deleteAttendee('${item.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function updateSummaryStats() {
    const total = attendees.length;
    const maleCount = attendees.filter(a => a.gender === 'Male').length;
    const femaleCount = attendees.filter(a => a.gender === 'Female').length;
    const uniqueDepts = new Set(attendees.map(a => a.department)).size;
    const latest = attendees.length > 0 ? attendees[0].displayTime : '--';

    const elTotal = document.getElementById('summaryTotal');
    const elHeroTotal = document.getElementById('heroTotalAttendees');
    const elProjCount = document.getElementById('projAttendeeCount');
    const elGender = document.getElementById('summaryGender');
    const elDepts = document.getElementById('summaryDepts');
    const elLatest = document.getElementById('summaryLatest');

    if (elTotal) elTotal.textContent = total;
    if (elHeroTotal) elHeroTotal.textContent = total;
    if (elProjCount) elProjCount.textContent = total;
    if (elGender) elGender.textContent = `${maleCount} / ${femaleCount}`;
    if (elDepts) elDepts.textContent = uniqueDepts;
    if (elLatest) elLatest.textContent = latest;
  }

  // 10. Excel (.xlsx) Export
  function exportAttendanceToExcel() {
    if (attendees.length === 0) {
      showToast((currentLang === 'ar') ? 'لا يوجد متدربون مسجلون لتصديرهم!' : 'No attendees registered to export!', 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showToast('SheetJS Excel library not loaded', 'error');
      return;
    }

    const courseName = currentSession ? currentSession.course : 'UNRWA Training';
    const sessionLoc = currentSession ? currentSession.location : 'Damascus';
    const sessionDate = currentSession ? currentSession.date : new Date().toISOString().split('T')[0];
    const trainerName = currentSession ? currentSession.trainer : 'Trainer';

    const excelData = attendees.map((item, idx) => ({
      '#': idx + 1,
      'الرقم الوظيفي / Emp No': item.empNumber,
      'اسم المتدرب (إنكليزي) / Trainee Name': item.name,
      'الجنس / Gender': item.gender,
      'القسم أو الدائرة / Department': item.department,
      'المسمى الوظيفي / Job Title': item.jobTitle,
      'الدرجة / Grade': item.grade,
      'الدورة / Course': item.course || courseName,
      'المكان / Location': item.location || sessionLoc,
      'المدرب / Trainer': item.trainer || trainerName,
      'التاريخ / Date': item.date || sessionDate,
      'وقت التسجيل / Check-in Time': item.displayTime || item.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Roster');

    const fileName = `UNRWA_Attendance_${sessionDate}_${sanitizeFileName(courseName)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast((currentLang === 'ar') ? 'تم تصدير كشف الحضور بنجاح!' : 'Attendance exported to Excel successfully!', 'success');
  }

  // 11. Event Listeners Setup
  function initEventListeners() {
    // Session Form Submit
    const btnUpdate = document.getElementById('btnUpdateSession');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', handleSessionConfigSubmit);
    }

    // Custom Course Select
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

    // Custom Location Select
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

    // Language Toggle
    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'en' ? 'ar' : 'en');
      });
    }

    // Export Excel
    const btnExport = document.getElementById('btnExportExcel');
    if (btnExport) {
      btnExport.addEventListener('click', exportAttendanceToExcel);
    }

    // Clear Data
    const btnClear = document.getElementById('btnClearData');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm((currentLang === 'ar') ? 'هل أنت متأكد من رغبتك في مسح قائمة الحضور الحالية؟' : 'Are you sure you want to clear the current attendance roster?')) {
          attendees = [];
          saveLocalAttendeesBackup();
          if (db && currentSession) {
            db.ref('sessions/' + currentSession.sessionId + '/attendees').remove().catch(console.warn);
          }
          renderAttendanceTable();
          updateSummaryStats();
          showToast((currentLang === 'ar') ? 'تم مسح القائمة' : 'Attendance roster cleared', 'info');
        }
      });
    }

    // Search Box
    const searchInput = document.getElementById('rosterSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        if (!query) {
          renderAttendanceTable();
          return;
        }
        const filtered = attendees.filter(a =>
          a.name.toLowerCase().includes(query) ||
          a.empNumber.toLowerCase().includes(query) ||
          a.department.toLowerCase().includes(query) ||
          a.jobTitle.toLowerCase().includes(query)
        );
        renderAttendanceTable(filtered);
      });
    }

    // Copy Link Button
    const btnCopy = document.getElementById('btnCopyCheckinLink');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const link = generateCheckinUrl();
        navigator.clipboard.writeText(link).then(() => {
          showToast((currentLang === 'ar') ? 'تم نسخ رابط تسجيل المتدربين!' : 'Trainee check-in link copied to clipboard!', 'success');
        }).catch(() => {
          showToast(link, 'info');
        });
      });
    }

    // Test Attendee View in New Tab
    const btnTest = document.getElementById('btnTestMobileView');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        const link = generateCheckinUrl();
        window.open(link, '_blank');
      });
    }

    // Projector Modal
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

    // Printable Flyer Modal
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

    // Host Edit Form
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
        if (val) {
          localStorage.setItem('attendtrack_custom_host_v1', val);
          hostEditForm.classList.add('hidden');
          renderQrCodes();
          showToast((currentLang === 'ar') ? 'تم تحديث الرابط بنجاح!' : 'Published host link updated!', 'success');
        }
      });
    }
    if (btnResetHost) {
      btnResetHost.addEventListener('click', () => {
        localStorage.removeItem('attendtrack_custom_host_v1');
        hostEditForm.classList.add('hidden');
        renderQrCodes();
        showToast((currentLang === 'ar') ? 'تمت استعادة الرابط التلقائي' : 'Reset to auto-detected host', 'info');
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
      showToast((currentLang === 'ar') ? 'يرجى اختيار اسم الدورة' : 'Please select Course Name', 'error');
      return;
    }
    if (!trainer) {
      showToast((currentLang === 'ar') ? 'يرجى كتابة اسم المدرب' : 'Please enter Trainer Name', 'error');
      return;
    }
    if (!location || location === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى تحديد المكان' : 'Please select Location', 'error');
      return;
    }
    if (!date) {
      showToast((currentLang === 'ar') ? 'يرجى تحديد التاريخ' : 'Please select Date', 'error');
      return;
    }
    if (!time) {
      showToast((currentLang === 'ar') ? 'يرجى تحديد التوقيت' : 'Please enter Timing', 'error');
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
    showToast((currentLang === 'ar') ? 'تم تفعيل الجلسة وتوليد QR كود بنجاح!' : 'Session activated & QR generated successfully!', 'success');
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
    }, 4500);
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

  // Delete attendee
  window.AttendTrackAdmin = {
    deleteAttendee: function (id) {
      if (confirm((currentLang === 'ar') ? 'حذف هذا المتدرب؟' : 'Delete this attendee?')) {
        attendees = attendees.filter(a => a.id !== id);
        saveLocalAttendeesBackup();
        if (db && currentSession) {
          db.ref('sessions/' + currentSession.sessionId + '/attendees').once('value').then(snap => {
            snap.forEach(child => {
              if (child.val().id === id) {
                child.ref.remove();
              }
            });
          });
        }
        renderAttendanceTable();
        updateSummaryStats();
      }
    }
  };

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    // Set default date input to today
    const dateInput = document.getElementById('sessionDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    initEventListeners();

    // Check if saved session exists
    const saved = localStorage.getItem('attendtrack_active_session_v1');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj && obj.course) {
          // Pre-populate form inputs
          const courseSel = document.getElementById('courseSelect');
          const trainerInput = document.getElementById('trainerInput');
          const locSel = document.getElementById('locationSelect');
          const timeInput = document.getElementById('sessionTime');
          if (courseSel) courseSel.value = obj.course;
          if (trainerInput) trainerInput.value = obj.trainer;
          if (locSel) locSel.value = obj.location;
          if (dateInput && obj.date) dateInput.value = obj.date;
          if (timeInput) timeInput.value = obj.time;

          activateSession(obj);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // Load saved attendees
    const savedAttendees = localStorage.getItem('attendtrack_attendees_v1');
    if (savedAttendees) {
      try {
        attendees = JSON.parse(savedAttendees);
        renderAttendanceTable();
        updateSummaryStats();
      } catch (e) {
        console.warn(e);
      }
    }
  });

})();
