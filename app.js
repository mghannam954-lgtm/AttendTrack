/**
 * AttendTrack - HR & Trainer Portal Logic (Sessions Archive & Folders)
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Isolated Course Folders + Dedicated Excel Exports
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
  let allSessions = []; // Array of session objects: { sessionId, course, trainer, location, date, time, attendees: [], isExpanded: bool }
  let currentLang = 'en'; // 'en' | 'ar'
  let adminQr = null;
  let projectorQr = null;
  let flyerQr = null;
  let isInitialFirebaseLoad = true;

  // 3. Audio Chime (Web Audio API)
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
      statActiveSession: 'Active Sessions',
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
      sessionsArchiveTitle: '3. Training Courses Archive & Attendance Folders (سجلات الدورات وقوائم الحضور)',
      sessionsArchiveSubtitle: 'Each course has its own folder, isolated attendance roster, and dedicated Excel download button.',
      searchArchivePh: 'Search courses or attendees...',
      thEmpNo: 'Employee #',
      thTraineeName: 'Trainee Name (English)',
      thGender: 'Gender',
      thDepartment: 'Department',
      thJobTitle: 'Title',
      thGrade: 'Grade',
      thTimestamp: 'Time',
      thActions: 'Actions',
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
      statActiveSession: 'الدورات المفتوحة',
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
      sessionsArchiveTitle: '3. أرشيف الدورات التدريبية وسجلات الحضور المستقلة',
      sessionsArchiveSubtitle: 'كل دورة يتم إنشاؤها لها مجلد خاص، قائمة حضور مستقلة تماماً، وزر مباشر لتحميل ملف الإكسل الخاص بها.',
      searchArchivePh: 'بحث بالدورة أو بالاسم...',
      thEmpNo: 'الرقم الوظيفي',
      thTraineeName: 'اسم المتدرب (إنكليزي)',
      thGender: 'الجنس',
      thDepartment: 'القسم / الدائرة',
      thJobTitle: 'المسمى الوظيفي',
      thGrade: 'الدرجة',
      thTimestamp: 'الوقت',
      thActions: 'إجراءات',
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

    renderSessionsAccordion();
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

  // 6. QR Code Rendering
  function renderQrCodes() {
    if (!currentSession) return;
    const targetUrl = generateCheckinUrl(currentSession);
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

    // Ensure session is in allSessions
    let existingIndex = allSessions.findIndex(s => s.sessionId === sessionObj.sessionId);
    if (existingIndex >= 0) {
      allSessions[existingIndex] = { ...allSessions[existingIndex], ...sessionObj, isExpanded: true };
    } else {
      allSessions.unshift({ ...sessionObj, attendees: [], isExpanded: true });
    }
    saveLocalSessions();

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

    // Sync Session meta with Firebase
    if (db) {
      db.ref('active_session').set(sessionObj).catch(console.warn);
      db.ref('sessions/' + sessionObj.sessionId + '/meta').set(sessionObj).catch(console.warn);
    }

    // Refresh accordion UI
    renderSessionsAccordion();
    updateGlobalStats();
  }

  // 8. Real-time Firebase Sync for ALL Sessions
  function initRealtimeFirebaseSync() {
    if (!db) return;

    // Listen to sessions node
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

        // Check for new attendees in this session
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
          showToast(`✨ تسجيل جديد في [${newAttendeeArrival.course}]: ${newAttendeeArrival.attendee.name} (${newAttendeeArrival.attendee.department})`, 'success');
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

  // 9. Render Sessions Folders Accordion
  function renderSessionsAccordion(searchQuery = '') {
    const container = document.getElementById('sessionsAccordionContainer');
    if (!container) return;

    if (allSessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
          <h4>${(currentLang === 'ar') ? 'لا توجد دورات تدريبية منشأة بعد' : 'No Training Sessions Created Yet'}</h4>
          <p>${(currentLang === 'ar') ? 'قم بتعبئة بيانات الدورة في الأعلى واضغط "تفعيل الجلسة وتوليد QR كود" لإنشاء مجلد الدورة وكشف حضورها.' : 'Fill out session details above and click "Generate QR & Activate Session" to create your first course folder.'}</p>
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
          <p>${(currentLang === 'ar') ? 'لا توجد نتائج مطابقة لبحثك.' : 'No courses or attendees matching your search.'}</p>
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
        ? `<span class="badge-live-now"><span class="pulse-dot"></span> ${(currentLang === 'ar') ? 'مباشر الآن' : 'Live Now'}</span>`
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
                <i class="fa-solid fa-clipboard-user"></i>
                <h5>${(currentLang === 'ar') ? 'لا يوجد حضور مسجلون في هذه الدورة بعد' : 'No Attendees Registered in This Course Yet'}</h5>
                <p><small>${(currentLang === 'ar') ? 'امسح الـ QR كود المخصص لهذه الدورة لتسجيل الحضور فورياً.' : 'Scan the QR code for this session to register attendees in real-time.'}</small></p>
              </div>
            </td>
          </tr>
        `;
      } else {
        tableRows = (session.attendees || []).map((att, idx) => {
          const genderBadge = att.gender === 'Male'
            ? '<span class="badge badge-male"><i class="fa-solid fa-person"></i> Male</span>'
            : '<span class="badge badge-female"><i class="fa-solid fa-person-dress"></i> Female</span>';

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
                <button class="btn-icon text-danger" title="Delete Attendee" onclick="event.stopPropagation(); window.AttendTrackAdmin.deleteAttendee('${session.sessionId}', '${att.id}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      return `
        <div class="session-folder ${activeClass} ${expandedClass}" id="folder_${session.sessionId}">
          <!-- Folder Header (Always Visible) -->
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
              
              <!-- Attendee Counter -->
              <span class="folder-attendee-counter" title="Total Attendees">
                <i class="fa-solid fa-users text-unrwa"></i>
                <b>${attendeeCount}</b> ${(currentLang === 'ar') ? 'متدرب' : 'Attendees'}
              </span>

              <!-- Dedicated Excel Button for THIS COURSE ONLY -->
              <button type="button" class="btn-folder-excel" onclick="window.AttendTrackAdmin.exportSessionExcel('${session.sessionId}')" title="Download Excel for this course">
                <i class="fa-solid fa-file-excel"></i>
                <span>${(currentLang === 'ar') ? 'تصدير إكسل (.xlsx)' : 'Export Excel'}</span>
              </button>

              <!-- Activate QR Code Button (if not already active) -->
              ${!isActive ? `
                <button type="button" class="btn-folder-activate" onclick="window.AttendTrackAdmin.activateSessionQr('${session.sessionId}')" title="Make this the active QR code">
                  <i class="fa-solid fa-qrcode"></i>
                  <span>${(currentLang === 'ar') ? 'تفعيل الكود' : 'Activate QR'}</span>
                </button>
              ` : ''}

              <!-- Delete Folder Button -->
              <button type="button" class="btn-icon text-danger" onclick="window.AttendTrackAdmin.deleteSession('${session.sessionId}')" title="Delete Course">
                <i class="fa-solid fa-trash-can"></i>
              </button>

              <!-- Toggle Chevron -->
              <div class="folder-chevron" onclick="window.AttendTrackAdmin.toggleFolder('${session.sessionId}')">
                <i class="fa-solid fa-chevron-down"></i>
              </div>

            </div>

          </div>

          <!-- Folder Body (Drawer / Accordion View) -->
          <div class="folder-body">
            
            <!-- Quick Course Stats -->
            <div class="folder-summary-stats">
              <div class="folder-stat-pill">
                <span>${(currentLang === 'ar') ? 'المسجلون:' : 'Registered:'}</span>
                <strong>${attendeeCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${(currentLang === 'ar') ? 'ذكور / إناث:' : 'Gender (M/F):'}</span>
                <strong>${maleCount} / ${femaleCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${(currentLang === 'ar') ? 'الأقسام:' : 'Departments:'}</span>
                <strong>${deptsCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${(currentLang === 'ar') ? 'رابط التسجيل:' : 'Check-in URL:'}</span>
                <a href="${generateCheckinUrl(session)}" target="_blank" style="color: var(--un-blue-primary); font-size: 0.8rem; text-decoration: underline;">
                  ${(currentLang === 'ar') ? 'فتح استمارة المتدرب' : 'Open Form'}
                </a>
              </div>
            </div>

            <!-- Table of Attendees for this Course -->
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th width="40">#</th>
                    <th>${(currentLang === 'ar') ? 'الرقم الوظيفي' : 'Employee #'}</th>
                    <th>${(currentLang === 'ar') ? 'اسم المتدرب (إنكليزي)' : 'Trainee Name (English)'}</th>
                    <th>${(currentLang === 'ar') ? 'الجنس' : 'Gender'}</th>
                    <th>${(currentLang === 'ar') ? 'القسم / الدائرة' : 'Department'}</th>
                    <th>${(currentLang === 'ar') ? 'المسمى الوظيفي' : 'Title'}</th>
                    <th>${(currentLang === 'ar') ? 'الدرجة' : 'Grade'}</th>
                    <th>${(currentLang === 'ar') ? 'وقت التسجيل' : 'Time'}</th>
                    <th>${(currentLang === 'ar') ? 'إجراء' : 'Action'}</th>
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

  // 10. Update Global Top Hero Stats
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

    // In projector mode, show attendee count for currently active session
    if (elProjCount && currentSession) {
      const activeObj = allSessions.find(s => s.sessionId === currentSession.sessionId);
      elProjCount.textContent = activeObj ? (activeObj.attendees || []).length : 0;
    }
  }

  // 11. Excel Export FOR A SPECIFIC SESSION ONLY
  function exportSessionExcel(sessionId) {
    const session = allSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      showToast('Session not found', 'error');
      return;
    }

    const sessionAttendees = session.attendees || [];
    if (sessionAttendees.length === 0) {
      showToast((currentLang === 'ar') ? `لا يوجد حضور مسجلون في دورة [${session.course}] لتصديرهم!` : `No attendees registered in [${session.course}] to export!`, 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showToast('SheetJS Excel library not loaded', 'error');
      return;
    }

    const excelData = sessionAttendees.map((item, idx) => ({
      '#': idx + 1,
      'الرقم الوظيفي / Emp No': item.empNumber,
      'اسم المتدرب (إنكليزي) / Trainee Name': item.name,
      'الجنس / Gender': item.gender,
      'القسم أو الدائرة / Department': item.department,
      'المسمى الوظيفي / Job Title': item.jobTitle,
      'الدرجة / Grade': item.grade,
      'الدورة / Course': session.course,
      'المكان / Location': session.location,
      'المدرب / Trainer': session.trainer,
      'التاريخ / Date': session.date,
      'وقت التسجيل / Check-in Time': item.displayTime || item.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(session.course));

    const fileName = `UNRWA_${session.date}_${sanitizeFileName(session.course)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast((currentLang === 'ar') ? `تم تصدير ملف إكسل الخاص بدورة [${session.course}] بنجاح!` : `Excel downloaded for [${session.course}] successfully!`, 'success');
  }

  // 12. Global Interface for Inline Actions
  window.AttendTrackAdmin = {
    toggleFolder: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        s.isExpanded = !s.isExpanded;
        const el = document.getElementById('folder_' + sessionId);
        if (el) {
          el.classList.toggle('expanded', s.isExpanded);
        }
      }
    },

    activateSessionQr: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        activateSession(s);
        showToast((currentLang === 'ar') ? `تم تفعيل الـ QR كود لدورة: ${s.course}` : `Active QR switched to: ${s.course}`, 'info');
      }
    },

    exportSessionExcel: function (sessionId) {
      exportSessionExcel(sessionId);
    },

    deleteAttendee: function (sessionId, attendeeId) {
      if (confirm((currentLang === 'ar') ? 'هل أنت متأكد من حذف هذا المتدرب؟' : 'Are you sure you want to delete this attendee?')) {
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
          showToast((currentLang === 'ar') ? 'تم حذف المتدرب' : 'Attendee deleted', 'info');
        }
      }
    },

    deleteSession: function (sessionId) {
      const session = allSessions.find(s => s.sessionId === sessionId);
      const name = session ? session.course : '';
      if (confirm((currentLang === 'ar') ? `هل أنت متأكد من حذف دورة [${name}] بالكامل مع جميع سجلات حضورها؟` : `Are you sure you want to delete course [${name}] and all its attendance records?`)) {
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
        showToast((currentLang === 'ar') ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully', 'info');
      }
    }
  };

  // 13. Event Listeners Setup
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

    // Clear All Sessions Archive
    const btnClearAll = document.getElementById('btnClearAllSessions');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm((currentLang === 'ar') ? 'هل أنت متأكد من مسح كامل أرشيف الدورات؟' : 'Are you sure you want to clear the entire courses archive?')) {
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
          showToast((currentLang === 'ar') ? 'تم مسح الأرشيف بالكامل' : 'Archive cleared', 'info');
        }
      });
    }

    // Search Box
    const searchInput = document.getElementById('archiveSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderSessionsAccordion(this.value);
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

    // Unique session ID per creation
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
    showToast((currentLang === 'ar') ? `تم تفعيل دورة [${course}] وإنشاء مجلدها بنجاح!` : `Session [${course}] activated & folder created!`, 'success');
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

  function sanitizeSheetName(str) {
    return str.replace(/[\\/*?:[\]]/g, '_').substring(0, 31);
  }

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    // Set default date input to today
    const dateInput = document.getElementById('sessionDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    initEventListeners();

    // Load saved sessions archive
    const savedSessions = localStorage.getItem('attendtrack_all_sessions_v2');
    if (savedSessions) {
      try {
        allSessions = JSON.parse(savedSessions);
      } catch (e) {
        console.warn(e);
      }
    }

    // Check if saved active session exists
    const saved = localStorage.getItem('attendtrack_active_session_v1');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj && obj.course) {
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
    } else {
      renderSessionsAccordion();
      updateGlobalStats();
    }

    // Start Real-time Firebase Sync
    initRealtimeFirebaseSync();
  });

})();
