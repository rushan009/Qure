const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/rushan/Main/MERN/QURE/backend/node_modules/playwright');

const BASE_URL = process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:5173';
const OUT_DIR = path.resolve('/Users/rushan/Main/MERN/QURE/frontend/reports/ppt-images-2026-04-06');

const profilePayload = {
  user: {
    _id: 'u1',
    fullName: 'Rushan Dahal',
    email: 'rushan@example.com',
    phone: '+977-9800000000',
    role: 'patient',
  },
  patient: {
    _id: 'p1',
    dob: '2002-02-11T00:00:00.000Z',
    gender: 'Male',
    bloodGroup: 'O+',
    height: 172,
    weight: 68,
    address: 'Kathmandu, Nepal',
    allergies: [
      { _id: 'a1', name: 'Penicillin', severity: 'Severe' },
      { _id: 'a2', name: 'Peanuts', severity: 'Moderate' },
    ],
    emergencyContact: {
      name: 'Sarah Johnson',
      relation: 'Spouse',
      phone: '+977-9811111111',
    },
    emergencyContacts: [
      {
        _id: 'ec1',
        name: 'Sarah Johnson',
        relation: 'Spouse',
        phone: '+977-9811111111',
        email: 'sarah@example.com',
        isPrimary: true,
      },
    ],
    lastVitals: {
      recordedAt: '2026-04-05T08:00:00.000Z',
      bp: '120/80',
      heartRate: 72,
      bloodSugar: 96,
      temperature: '98.4 F',
    },
  },
};

const homeSummaryPayload = {
  greetingName: 'Rushan Dahal',
  stats: {
    activeConditions: 3,
    medications: 4,
    reports: 8,
    accessLogs: 12,
  },
  profileSummary: {
    bloodGroup: 'O+',
    criticalAllergies: 'Penicillin, Peanuts',
    keyConditions: 'Diabetes, Hypertension',
    emergencyContact: 'Sarah Johnson (Spouse)',
  },
  qr: {
    patientCode: 'QR-P1-RD',
  },
  recentActivity: [
    {
      id: 'ra1',
      title: 'QR scanned by Dr. Sharma',
      subtitle: 'Cardiologist',
      occurredAt: '2026-04-05T10:30:00.000Z',
      tone: 'info',
      timeAgo: '2h ago',
    },
    {
      id: 'ra2',
      title: 'Emergency alert sent',
      subtitle: 'To sarah@example.com',
      occurredAt: '2026-04-04T18:45:00.000Z',
      tone: 'danger',
      timeAgo: '1d ago',
    },
    {
      id: 'ra3',
      title: 'Condition logged: Diabetes',
      subtitle: 'By Dr. Rana',
      occurredAt: '2026-04-03T12:00:00.000Z',
      tone: 'warning',
      timeAgo: '2d ago',
    },
  ],
};

const diseasesPayload = {
  diseases: [
    {
      _id: 'd1',
      name: 'Diabetes',
      doctorName: 'Dr. Rana',
      diagnosisDate: '2024-05-10T00:00:00.000Z',
      severity: 'Moderate',
      status: 'Active',
      code: 'E11',
      notes: 'Monitor fasting glucose levels.',
      prescribedMedications: [
        { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      ],
    },
    {
      _id: 'd2',
      name: 'Hypertension',
      doctorName: 'Dr. Sharma',
      diagnosisDate: '2023-11-21T00:00:00.000Z',
      severity: 'Mild',
      status: 'Managed',
      code: 'I10',
      notes: 'Reduce sodium intake.',
      prescribedMedications: [
        { medication: 'Losartan', dosage: '50mg', frequency: 'Daily' },
      ],
    },
  ],
};

const medicationsPayload = {
  medications: [
    {
      _id: 'm1',
      name: 'Metformin',
      dose: '500mg',
      frequency: 'Twice daily',
      purpose: 'Blood sugar control',
      prescribedBy: 'Dr. Rana',
      category: 'Prescription (Rx)',
      startDate: '2024-05-10T00:00:00.000Z',
      instructions: 'Take after meals',
    },
    {
      _id: 'm2',
      name: 'Losartan',
      dose: '50mg',
      frequency: 'Daily',
      purpose: 'Blood pressure control',
      prescribedBy: 'Dr. Sharma',
      category: 'Prescription (Rx)',
      startDate: '2023-11-21T00:00:00.000Z',
      instructions: 'Take in the morning',
    },
    {
      _id: 'm3',
      name: 'Vitamin D3',
      dose: '1000 IU',
      frequency: 'Daily',
      purpose: 'Supplement',
      prescribedBy: 'Self',
      category: 'Supplement',
      startDate: '2025-01-15T00:00:00.000Z',
      instructions: 'Take with food',
    },
  ],
};

const reportsPayload = {
  summary: { totalReports: 8 },
  reports: [
    {
      id: 'r1',
      title: 'HbA1c Report',
      category: 'Blood Test',
      reportDate: '2026-03-20T00:00:00.000Z',
      doctorName: 'Dr. Rana',
      hospitalName: 'City Medical Center',
      originalFileName: 'hba1c.pdf',
      fileSize: 225000,
    },
    {
      id: 'r2',
      title: 'Blood Pressure Monitoring',
      category: 'Cardiology',
      reportDate: '2026-02-11T00:00:00.000Z',
      doctorName: 'Dr. Sharma',
      hospitalName: 'Heart Care Clinic',
      originalFileName: 'bp-monitoring.pdf',
      fileSize: 312000,
    },
  ],
};

const qrOverviewPayload = {
  summary: {
    scansThisMonth: 5,
    totalScans: 22,
    lastScannedAt: '2026-04-05T10:30:00.000Z',
    lastScannerName: 'Dr. Sharma',
    lastScannerRole: 'doctor',
  },
  recentAccess: [
    {
      id: 'q1',
      scannerName: 'Dr. Sharma',
      scannerRole: 'doctor',
      scannerSpecialization: 'Cardiology',
      accessLevel: 'full',
      scannedAt: '2026-04-05T10:30:00.000Z',
    },
    {
      id: 'q2',
      scannerName: 'Nurse Maya',
      scannerRole: 'patient',
      scannerSpecialization: 'N/A',
      accessLevel: 'limited',
      scannedAt: '2026-04-01T08:20:00.000Z',
    },
  ],
};

const accessLogsPayload = {
  summary: {
    totalAccesses: 22,
    thisMonth: 5,
    emergencyTriggered: 1,
  },
  logs: [
    {
      id: 'l1',
      type: 'access',
      name: 'Dr. Sharma',
      subtitle: 'Cardiology',
      badge: 'Direct Access',
      sections: ['Full History', 'Medications', 'Reports'],
      happenedAt: '2026-04-05T10:30:00.000Z',
      ipMasked: '192.168.1.***',
    },
  ],
};

const emergencyContactsPayload = {
  contacts: profilePayload.patient.emergencyContacts,
};

async function setupMockRoutes(page) {
  await page.route('**/api/auth/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profilePayload) }));
  await page.route('**/api/auth/home-summary', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(homeSummaryPayload) }));
  await page.route('**/api/auth/disease', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(diseasesPayload) }));
  await page.route('**/api/auth/medication', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(medicationsPayload) }));
  await page.route('**/api/auth/reports', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportsPayload) }));
  await page.route('**/api/auth/qr-access-overview', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(qrOverviewPayload) }));
  await page.route('**/api/auth/access-logs', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(accessLogsPayload) }));
  await page.route('**/api/auth/emergency-contacts', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emergencyContactsPayload) }));
  await page.route('**/api/auth/doctor/license-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isNmcVerified: true }) }));
}

async function shot(page, name, options = {}) {
  const outPath = path.join(OUT_DIR, name);
  await page.screenshot({ path: outPath, fullPage: !!options.fullPage });
  console.log(`Saved ${outPath}`);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const publicContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const publicPage = await publicContext.newPage();

  await publicPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await publicPage.waitForTimeout(1500);
  await shot(publicPage, '01-landing-hero.png');

  await publicPage.evaluate(() => window.scrollTo({ top: 880, behavior: 'instant' }));
  await publicPage.waitForTimeout(900);
  await shot(publicPage, '02-landing-features.png');

  await publicPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await publicPage.waitForTimeout(900);
  await shot(publicPage, '03-auth-login.png');

  await publicPage.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
  await publicPage.waitForTimeout(900);
  await shot(publicPage, '04-auth-signup.png');

  await publicContext.close();

  const appContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const appPage = await appContext.newPage();
  await setupMockRoutes(appPage);

  await appPage.addInitScript(() => {
    const patient = {
      _id: 'u1',
      id: 'u1',
      fullName: 'Rushan Dahal',
      email: 'rushan@example.com',
      phone: '+977-9800000000',
      role: 'patient',
    };
    localStorage.setItem('isloggedIn', 'true');
    localStorage.setItem('patient', JSON.stringify(patient));
  });

  await appPage.goto(`${BASE_URL}/user/dashboard?page=home`, { waitUntil: 'domcontentloaded' });
  await appPage.waitForTimeout(1600);
  await shot(appPage, '05-dashboard-home.png');

  await appPage.goto(`${BASE_URL}/user/dashboard?page=profile`, { waitUntil: 'domcontentloaded' });
  await appPage.waitForTimeout(1600);
  await shot(appPage, '06-dashboard-profile.png');

  await appPage.goto(`${BASE_URL}/user/dashboard?page=qr`, { waitUntil: 'domcontentloaded' });
  await appPage.waitForTimeout(1600);
  await shot(appPage, '07-dashboard-qr.png');

  await appContext.close();
  await browser.close();

  console.log(`\nDone. Generated image set in: ${OUT_DIR}`);
})();
