import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJSON<T>(filename: string, defaultData: T): T {
  try {
    ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      writeJSON(filename, defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || raw.trim() === '') {
      writeJSON(filename, defaultData);
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    writeJSON(filename, defaultData);
    return defaultData;
  }
}

function writeJSON<T>(filename: string, data: T) {
  ensureDir(DATA_DIR);
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      throw new Error(`Failed to write ${filename}: ${e}`);
    }
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const jsonDB = {
  reports: {
    getAll(): any[] {
      return readJSON<{ reports: any[] }>('reports.json', { reports: [] }).reports;
    },
    save(reports: any[]) {
      writeJSON('reports.json', { reports });
    },
    add(report: any) {
      const reports = this.getAll();
      reports.unshift(report);
      if (reports.length > 5000) reports.length = 5000;
      this.save(reports);
    },
    update(id: string, updates: Partial<any>): any | null {
      const reports = this.getAll();
      const index = reports.findIndex((r: any) => r.id === id);
      if (index === -1) return null;
      reports[index] = { ...reports[index], ...updates, updatedAt: Date.now() };
      this.save(reports);
      return reports[index];
    },
    delete(id: string): boolean {
      const reports = this.getAll();
      const filtered = reports.filter((r: any) => r.id !== id);
      if (filtered.length === reports.length) return false;
      this.save(filtered);
      return true;
    },
    getById(id: string): any | null {
      return this.getAll().find((r: any) => r.id === id) || null;
    },
    count(filter?: (r: any) => boolean): number {
      const all = this.getAll();
      return filter ? all.filter(filter).length : all.length;
    },
    find(filter: (r: any) => boolean, limit = 100, offset = 0): any[] {
      return this.getAll().filter(filter).slice(offset, offset + limit);
    },
  },

  users: {
    getAll(): any[] {
      return readJSON<{ users: any[] }>('users.json', { users: [] }).users;
    },
    save(users: any[]) {
      writeJSON('users.json', { users });
    },
    add(user: any) {
      const users = this.getAll();
      users.push(user);
      this.save(users);
    },
    update(id: string, updates: Partial<any>): any | null {
      const users = this.getAll();
      const index = users.findIndex((u: any) => u.id === id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...updates };
      this.save(users);
      return users[index];
    },
    delete(id: string): boolean {
      const users = this.getAll();
      const filtered = users.filter((u: any) => u.id !== id);
      if (filtered.length === users.length) return false;
      this.save(filtered);
      return true;
    },
    getByEmail(email: string): any | null {
      return this.getAll().find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    getById(id: string): any | null {
      return this.getAll().find((u: any) => u.id === id) || null;
    },
    count(): number {
      return this.getAll().length;
    },
  },

  chats: {
    getAll(): any[] {
      return readJSON<{ messages: any[] }>('chats.json', { messages: [] }).messages;
    },
    save(messages: any[]) {
      writeJSON('chats.json', { messages });
    },
    add(message: any) {
      const messages = this.getAll();
      messages.push(message);
      this.save(messages);
    },
    getByChatId(chatId: string): any[] {
      return this.getAll().filter((m: any) => m.chatId === chatId).sort((a: any, b: any) => a.timestamp - b.timestamp);
    },
    getByReportId(reportId: string): any[] {
      return this.getAll().filter((m: any) => m.reportId === reportId).sort((a: any, b: any) => a.timestamp - b.timestamp);
    },
    markRead(chatId: string, userId: string) {
      const messages = this.getAll();
      let changed = false;
      messages.forEach((m: any) => {
        if (m.chatId === chatId && m.senderId !== userId) {
          m.isRead = true;
          changed = true;
        }
      });
      if (changed) this.save(messages);
    },
    count(): number {
      return this.getAll().length;
    },
  },

  announcements: {
    getAll(): any[] {
      return readJSON<{ announcements: any[] }>('announcements.json', { announcements: [] }).announcements;
    },
    save(announcements: any[]) {
      writeJSON('announcements.json', { announcements });
    },
    add(announcement: any) {
      const announcements = this.getAll();
      announcements.unshift(announcement);
      this.save(announcements);
    },
    update(id: string, updates: Partial<any>): any | null {
      const announcements = this.getAll();
      const index = announcements.findIndex((a: any) => a.id === id);
      if (index === -1) return null;
      announcements[index] = { ...announcements[index], ...updates };
      this.save(announcements);
      return announcements[index];
    },
    delete(id: string): boolean {
      const announcements = this.getAll();
      const filtered = announcements.filter((a: any) => a.id !== id);
      if (filtered.length === announcements.length) return false;
      this.save(filtered);
      return true;
    },
    getActive(): any[] {
      const now = Date.now();
      return this.getAll().filter((a: any) => a.isActive && (!a.expiresAt || a.expiresAt > now));
    },
    count(): number {
      return this.getAll().length;
    },
  },

  budget: {
    getAll(): any[] {
      return readJSON<{ budget: any[] }>('budget.json', { budget: [] }).budget;
    },
    save(budget: any[]) {
      writeJSON('budget.json', { budget });
    },
    add(entry: any) {
      const budget = this.getAll();
      budget.push(entry);
      this.save(budget);
    },
    update(id: string, updates: Partial<any>): any | null {
      const budget = this.getAll();
      const index = budget.findIndex((b: any) => b.id === id);
      if (index === -1) return null;
      budget[index] = { ...budget[index], ...updates };
      this.save(budget);
      return budget[index];
    },
    delete(id: string): boolean {
      const budget = this.getAll();
      const filtered = budget.filter((b: any) => b.id !== id);
      if (filtered.length === budget.length) return false;
      this.save(filtered);
      return true;
    },
    getByMonth(month: number, year: number): any[] {
      return this.getAll().filter((b: any) => b.month === month && b.year === year);
    },
    count(): number {
      return this.getAll().length;
    },
  },

  resourceRequests: {
    getAll(): any[] {
      return readJSON<{ resourceRequests: any[] }>('resource-requests.json', { resourceRequests: [] }).resourceRequests;
    },
    save(resourceRequests: any[]) {
      writeJSON('resource-requests.json', { resourceRequests });
    },
    add(request: any) {
      const requests = this.getAll();
      requests.push(request);
      this.save(requests);
    },
    update(id: string, updates: Partial<any>): any | null {
      const requests = this.getAll();
      const index = requests.findIndex((r: any) => r.id === id);
      if (index === -1) return null;
      requests[index] = { ...requests[index], ...updates };
      this.save(requests);
      return requests[index];
    },
    delete(id: string): boolean {
      const requests = this.getAll();
      const filtered = requests.filter((r: any) => r.id !== id);
      if (filtered.length === requests.length) return false;
      this.save(filtered);
      return true;
    },
    getByWorker(workerId: string): any[] {
      return this.getAll().filter((r: any) => r.workerId === workerId);
    },
    getByReport(reportId: string): any[] {
      return this.getAll().filter((r: any) => r.reportId === reportId);
    },
    count(): number {
      return this.getAll().length;
    },
  },

  gamification: {
    getAll(): any[] {
      return readJSON<{ gamification: any[] }>('gamification.json', { gamification: [] }).gamification;
    },
    save(gamification: any[]) {
      writeJSON('gamification.json', { gamification });
    },
    getOrCreate(userId: string): any {
      const records = this.getAll();
      let record = records.find((g: any) => g.userId === userId);
      if (!record) {
        record = {
          userId,
          points: 0,
          reportsSubmitted: 0,
          reportsVerified: 0,
          reportsResolved: 0,
          badges: [],
          rank: 'Newcomer',
          streakDays: 0,
          lastActivity: Date.now(),
          leaderboardPosition: records.length + 1,
        };
        records.push(record);
        this.save(records);
      }
      return record;
    },
    update(userId: string, updates: Partial<any>): any | null {
      const records = this.getAll();
      const index = records.findIndex((g: any) => g.userId === userId);
      if (index === -1) return null;
      records[index] = { ...records[index], ...updates };
      this.save(records);
      return records[index];
    },
    getLeaderboard(): any[] {
      const sorted = this.getAll().sort((a: any, b: any) => b.points - a.points);
      sorted.forEach((g: any, i: number) => { g.leaderboardPosition = i + 1; });
      this.save(sorted);
      return sorted;
    },
    addPoints(userId: string, points: number) {
      const record = this.getOrCreate(userId);
      record.points += points;
      record.lastActivity = Date.now();
      if (record.points >= 1000) record.rank = 'Legend';
      else if (record.points >= 500) record.rank = 'Hero';
      else if (record.points >= 200) record.rank = 'Champion';
      else if (record.points >= 100) record.rank = 'Advocate';
      else if (record.points >= 50) record.rank = 'Contributor';
      else record.rank = 'Newcomer';
      const records = this.getAll();
      const index = records.findIndex((g: any) => g.userId === userId);
      if (index !== -1) {
        records[index] = record;
        this.save(records);
      }
    },
    count(): number {
      return this.getAll().length;
    },
  },

  predictions: {
    getAll(): any[] {
      return readJSON<{ predictions: any[] }>('predictions.json', { predictions: [] }).predictions;
    },
    save(predictions: any[]) {
      writeJSON('predictions.json', { predictions });
    },
    add(prediction: any) {
      const predictions = this.getAll();
      predictions.push(prediction);
      this.save(predictions);
    },
    count(): number {
      return this.getAll().length;
    },
  },

  initDefaults() {
    const users = this.users.getAll();
    if (users.length === 0) {
      const now = Date.now();
      this.users.add({
        id: 'admin-001',
        email: 'admin@roadtrack.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        createdAt: now,
        isActive: true,
        citizenPoints: 0,
        citizenReports: 0,
        citizenResolved: 0,
        citizenBadges: [],
      });
      this.users.add({
        id: 'worker-001',
        email: 'worker@roadtrack.com',
        password: 'worker123',
        name: 'Field Worker',
        role: 'field_worker',
        createdAt: now,
        isActive: true,
        workerZone: 'Zone A',
        workerSkills: ['pothole', 'road', 'crack'],
        citizenPoints: 0,
        citizenReports: 0,
        citizenResolved: 0,
        citizenBadges: [],
      });
    }

    const budget = this.budget.getAll();
    if (budget.length === 0) {
      const now = new Date();
      const categories = [
        { name: 'Road Repair', alloc: 50000 },
        { name: 'Street Lights', alloc: 20000 },
        { name: 'Drainage', alloc: 30000 },
        { name: 'Sidewalks', alloc: 25000 },
        { name: 'Emergency', alloc: 15000 },
      ];
      const entries = categories.map((cat, i) => ({
        id: `budget-${now.getFullYear()}-${now.getMonth()}-${i}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        category: cat.name,
        allocated: cat.alloc,
        spent: Math.floor(Math.random() * cat.alloc * 0.7),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        createdAt: now.getTime(),
      }));
      this.budget.save(entries);
    }
  },

  seedMockData() {
    this.initDefaults();
    if (this.reports.count() > 0 && this.users.count() > 2 && this.budget.count() >= 5 && this.announcements.count() > 0) return;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const damageTypes = ['pothole', 'crack', 'sinkhole', 'road', 'light', 'drainage', 'other'] as const;
    const statuses = ['active', 'verified', 'in_progress', 'resolved', 'ghost'] as const;
    const neighborhoods = ['Downtown', 'Industrial District', 'Northside', 'Southside', 'Waterfront', 'Midtown', 'East End', 'West Park'];
    const streets = ['Main St', 'Oak Ave', 'Elm Blvd', 'Pine Rd', 'Cedar Ln', 'Maple Dr', '5th Ave', 'Broadway', 'Park Ave', 'River Rd'];
    const descriptions = [
      'Large pothole causing traffic delays',
      'Deep crack spreading across lane',
      'Street light out for 3 days',
      'Water pooling from broken drain',
      'Sinkhole forming near sidewalk',
      'Road surface crumbling badly',
      'Illegal dumping on roadside',
      'Faded road markings dangerous',
      'Manhole cover missing',
      'Traffic signal malfunctioning',
      'Bridge railing damaged',
      'Sidewalk severely cracked',
      'Flooding during rain',
      'Pothole damaging vehicles',
      'Gas leak suspected near crack',
    ];

    const baseLat = 40.7128;
    const baseLng = -74.006;

    const mockReports = [];
    const imageUrls = [
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f91?w=400',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400',
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400',
      'https://images.unsplash.com/photo-1591271300850-22d6784e0a7f?w=400',
      '',
    ];
    for (let i = 0; i < 50; i++) {
      const createdAt = now - Math.floor(Math.random() * 30) * day;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const severity = Math.floor(Math.random() * 10) + 1;
      const verifications = Math.floor(Math.random() * 8) + 1;
      const isResolved = status === 'resolved';
      const isInProgress = status === 'in_progress';
      const lat = baseLat + (Math.random() - 0.5) * 0.08;
      const lng = baseLng + (Math.random() - 0.5) * 0.08;

      mockReports.push({
        id: `rep-mock-${i.toString(36)}`,
        imageUrl: imageUrls[i % imageUrls.length],
        lat,
        lng,
        address: `${Math.floor(Math.random() * 900 + 100)} ${streets[Math.floor(Math.random() * streets.length)]}`,
        damageType: damageTypes[Math.floor(Math.random() * damageTypes.length)],
        severity,
        status,
        priority: Math.min(10, Math.max(1, severity + Math.floor(Math.random() * 3))),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        userId: i % 3 === 0 ? `citizen-${(i % 5) + 1}` : undefined,
        deviceId: `device-${i % 10}`,
        isAnonymous: Math.random() > 0.7,
        verificationCount: verifications,
        upvotes: Array.from({ length: verifications }, (_, j) => `user-${j}`),
        createdAt,
        updatedAt: createdAt + (isResolved ? Math.floor(Math.random() * 14) * day : 0),
        resolvedAt: isResolved ? createdAt + Math.floor(Math.random() * 14) * day : undefined,
        assignedTo: isInProgress || isResolved ? 'worker-001' : undefined,
        assignedAt: isInProgress || isResolved ? createdAt + day : undefined,
        notes: isInProgress ? 'Scheduled for repair next week' : undefined,
        aiValidated: Math.random() > 0.3,
        aiConfidence: Math.random() * 0.4 + 0.6,
        fraudFlag: Math.random() > 0.95,
        fraudReason: Math.random() > 0.95 ? 'GPS mismatch detected' : undefined,
        workerLocationVerified: Math.random() > 0.5,
        slaDeadline: createdAt + 7 * day,
        slaBreached: status !== 'resolved' && createdAt + 7 * day < now,
        repairCost: isResolved ? Math.floor(Math.random() * 5000 + 200) : undefined,
        neighborhood: neighborhoods[Math.floor(Math.random() * neighborhoods.length)],
        chatId: isInProgress ? `chat-${i}` : undefined,
        beforeImages: [],
        afterImages: isResolved ? [`/api/placeholder/400/300`] : [],
        mergedCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 2 : undefined,
      });
    }

    mockReports.sort((a, b) => b.createdAt - a.createdAt);
    this.reports.save(mockReports);

    const citizenUsers = [];
    const citizenNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Martinez'];
    for (let i = 0; i < 5; i++) {
      citizenUsers.push({
        id: `citizen-${i + 1}`,
        email: `citizen${i + 1}@example.com`,
        password: 'citizen123',
        name: citizenNames[i],
        role: 'citizen',
        createdAt: now - 30 * day,
        isActive: true,
        citizenPoints: Math.floor(Math.random() * 500),
        citizenReports: Math.floor(Math.random() * 20) + 1,
        citizenResolved: Math.floor(Math.random() * 10),
        citizenBadges: ['First Report', 'Community Hero', 'Eagle Eye'].slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }
    this.users.save([...this.users.getAll(), ...citizenUsers]);

    citizenUsers.forEach((u) => {
      const records = this.gamification.getAll();
      const existing = records.find((g: any) => g.userId === u.id);
      if (!existing) {
        this.gamification.getOrCreate(u.id);
        this.gamification.update(u.id, {
          points: u.citizenPoints,
          reportsSubmitted: u.citizenReports,
          reportsVerified: Math.floor(Math.random() * 15),
          reportsResolved: u.citizenResolved,
          badges: u.citizenBadges,
          rank: u.citizenPoints >= 200 ? 'Champion' : u.citizenPoints >= 100 ? 'Advocate' : 'Contributor',
          streakDays: Math.floor(Math.random() * 14) + 1,
          lastActivity: now - Math.floor(Math.random() * 3) * day,
        });
      }
    });

    const mockMessages = [];
    for (let i = 0; i < 15; i++) {
      mockMessages.push({
        id: `msg-mock-${i}`,
        chatId: `chat-${Math.floor(i / 3)}`,
        reportId: `rep-mock-${Math.floor(i / 3) * 3}`,
        senderId: i % 2 === 0 ? 'worker-001' : `citizen-${(i % 5) + 1}`,
        senderName: i % 2 === 0 ? 'Field Worker' : citizenNames[i % 5],
        senderRole: i % 2 === 0 ? 'worker' : 'citizen',
        content: [
          'On my way to the location now',
          'Can you send me the exact address?',
          'The damage is worse than the photo shows',
          'I need additional materials for this repair',
          'ETA 15 minutes',
          'Can you confirm this is the right spot?',
          'Repair completed, uploading after photos',
          'Thank you for the quick response!',
          'The area is now safe for traffic',
          'Need to reschedule due to weather',
        ][i % 10],
        timestamp: now - (15 - i) * 60 * 60 * 1000,
        isRead: true,
      });
    }
    this.chats.save(mockMessages);

    const mockAnnouncements = [
      {
        id: 'ann-mock-1',
        title: 'Water Main Repair - 5th Avenue',
        content: 'Water main repair starting on 5th Ave between Oak and Elm. Expect delays from 2 PM - 6 PM today.',
        type: 'neighborhood',
        neighborhood: 'Downtown',
        createdBy: 'admin-001',
        createdAt: now - 2 * day,
        expiresAt: now + day,
        isActive: true,
        recipientCount: 1200,
      },
      {
        id: 'ann-mock-2',
        title: 'City-Wide Pothole Blitz This Weekend',
        content: 'Road crews will be working across all zones this weekend to address critical potholes. Thank you for your patience.',
        type: 'blast',
        createdBy: 'admin-001',
        createdAt: now - day,
        isActive: true,
        recipientCount: 50000,
      },
      {
        id: 'ann-mock-3',
        title: 'New Reporting Feature Available',
        content: 'You can now upload videos and voice notes with your reports. Make reporting easier than ever!',
        type: 'system',
        createdBy: 'admin-001',
        createdAt: now - 5 * day,
        isActive: true,
        recipientCount: 100000,
      },
    ];
    this.announcements.save(mockAnnouncements);

    const mockPredictions = [
      {
        id: 'pred-mock-1',
        damageType: 'pothole',
        lat: baseLat + 0.02,
        lng: baseLng - 0.01,
        neighborhood: 'Industrial District',
        probability: 0.85,
        predictedDate: now + 14 * day,
        basis: 'Historical pattern: 23 similar incidents in past year, heavy truck traffic increasing',
        createdAt: now - day,
      },
      {
        id: 'pred-mock-2',
        damageType: 'drainage',
        lat: baseLat - 0.015,
        lng: baseLng + 0.02,
        neighborhood: 'Waterfront',
        probability: 0.72,
        predictedDate: now + 21 * day,
        basis: 'Seasonal flooding pattern: 15 drainage failures during last rainy season',
        createdAt: now - day,
      },
      {
        id: 'pred-mock-3',
        damageType: 'sinkhole',
        lat: baseLat + 0.03,
        lng: baseLng + 0.01,
        neighborhood: 'Northside',
        probability: 0.45,
        predictedDate: now + 45 * day,
        basis: 'Underground water main age: 47 years, 3 nearby sinkholes in past 2 years',
        createdAt: now - day,
      },
      {
        id: 'pred-mock-4',
        damageType: 'crack',
        lat: baseLat - 0.025,
        lng: baseLng - 0.015,
        neighborhood: 'Southside',
        probability: 0.68,
        predictedDate: now + 30 * day,
        basis: 'Road age analysis: surface degradation rate 2x normal, temperature stress patterns',
        createdAt: now - day,
      },
      {
        id: 'pred-mock-5',
        damageType: 'light',
        lat: baseLat + 0.01,
        lng: baseLng + 0.03,
        neighborhood: 'East End',
        probability: 0.55,
        predictedDate: now + 10 * day,
        basis: 'Electrical infrastructure age: 32 years, 8 outages in past quarter',
        createdAt: now - day,
      },
    ];
    this.predictions.save(mockPredictions);

    const mockResourceRequests = [
      {
        id: 'res-mock-1',
        reportId: 'rep-mock-0',
        workerId: 'worker-001',
        resource: 'Cold Patch Asphalt',
        quantity: 10,
        unit: 'bags',
        status: 'approved',
        createdAt: now - 3 * day,
        notes: 'Need for downtown pothole repairs',
      },
      {
        id: 'res-mock-2',
        reportId: 'rep-mock-3',
        workerId: 'worker-001',
        resource: 'Concrete Mix',
        quantity: 5,
        unit: 'bags',
        status: 'pending',
        createdAt: now - day,
        notes: 'Sidewalk repair on Main St',
      },
      {
        id: 'res-mock-3',
        reportId: 'rep-mock-5',
        workerId: 'worker-001',
        resource: 'LED Street Light',
        quantity: 2,
        unit: 'pieces',
        status: 'fulfilled',
        createdAt: now - 7 * day,
        notes: 'Replacement for Oak Ave lights',
      },
    ];
    this.resourceRequests.save(mockResourceRequests);
  },
};

export const storage = {
  async get(): Promise<any[]> {
    return jsonDB.reports.getAll();
  },
  async set(reports: any[]): Promise<void> {
    jsonDB.reports.save(reports);
  },
  async add(report: any): Promise<void> {
    jsonDB.reports.add(report);
  },
  async update(id: string, updates: Partial<any>): Promise<any | null> {
    return jsonDB.reports.update(id, updates);
  },
  async delete(id: string): Promise<boolean> {
    return jsonDB.reports.delete(id);
  },
  getLastUpdated(): number {
    const reports = jsonDB.reports.getAll();
    if (reports.length === 0) return Date.now();
    return Math.max(...reports.map((r: any) => r.updatedAt));
  },
  getSync(): any[] {
    return jsonDB.reports.getAll();
  },
  setSync(reports: any[]): void {
    jsonDB.reports.save(reports);
  },
  addSync(report: any): void {
    jsonDB.reports.add(report);
  },
  updateSync(id: string, updates: Partial<any>): any | null {
    return jsonDB.reports.update(id, updates);
  },
};
