// SAVAGE END-TO-END ADMIN WORKFLOW TESTS!!! 🎭🔥🎭

import request from 'supertest';
import express from 'express';
import { testPool, testUtils } from '../setup';
import authRoutes from '../../routes/auth';
import workerRoutes from '../../routes/workers';
import eventRoutes from '../../routes/events';
import checkinRoutes from '../../routes/checkins';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkinRoutes);

describe('🎭 ADMIN WORKFLOW E2E TESTS - COMPLETE ADMIN JOURNEYS!!! 💀', () => {
  let adminToken: string;
  let sessionId: string;

  beforeEach(async () => {
    // Login as admin before each test
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ password: process.env.ADMIN_PASSWORD || 'admin123' })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    adminToken = loginResponse.body.data.token;
    sessionId = loginResponse.body.data.sessionId;
  });

  describe('🔥 Complete Admin Dashboard Workflow', () => {
    it('should load dashboard with all statistics', async () => {
      // Create test data for statistics
      const worker1 = await testUtils.createTestWorker();
      const worker2 = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({ isActive: true });
      await testUtils.createTestCheckIn(worker1.id, event.id);
      await testUtils.createTestCheckIn(worker2.id, event.id);

      // Get worker stats
      const workerStatsResponse = await request(app)
        .get('/api/workers/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(workerStatsResponse.body.success).toBe(true);
      expect(workerStatsResponse.body.data.totalWorkers).toBeGreaterThan(0);

      // Get event stats
      const eventStatsResponse = await request(app)
        .get('/api/events/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(eventStatsResponse.body.success).toBe(true);
      expect(eventStatsResponse.body.data.totalEvents).toBeGreaterThan(0);

      // Get check-in stats
      const checkinStatsResponse = await request(app)
        .get('/api/checkins/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(checkinStatsResponse.body.success).toBe(true);
      expect(checkinStatsResponse.body.data.totalCheckIns).toBeGreaterThan(0);

      // Get recent check-ins
      const recentCheckinsResponse = await request(app)
        .get('/api/checkins/recent/10')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(recentCheckinsResponse.body.success).toBe(true);
      expect(recentCheckinsResponse.body.data.checkIns).toBeDefined();
    });
  });

  describe('🔥 Complete Worker Management Workflow', () => {
    it('should perform full CRUD operations on workers', async () => {
      // CREATE: Add new worker
      const newWorkerData = {
        firstName: 'Admin',
        lastName: 'Created',
        dateOfBirth: '1990-01-01',
        email: 'admin.created@test.com',
        phone: '555-ADMIN',
        streetAddress: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'USA'
      };

      const createResponse = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send(newWorkerData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdWorker = createResponse.body.data;

      // READ: Get workers list
      const listResponse = await request(app)
        .get('/api/workers?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.some((w: any) => w.id === createdWorker.id)).toBe(true);

      // UPDATE: Modify worker
      const updateData = {
        firstName: 'Updated',
        lastName: 'Admin'
      };

      const updateResponse = await request(app)
        .put(`/api/workers/${createdWorker.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.firstName).toBe('Updated');

      // DELETE: Remove worker
      const deleteResponse = await request(app)
        .delete(`/api/workers/${createdWorker.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/workers/${createdWorker.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(404);

      expect(verifyResponse.body.success).toBe(false);
    });

    it('should perform bulk operations on workers', async () => {
      // Create multiple workers
      const worker1 = await testUtils.createTestWorker({ firstName: 'Bulk1' });
      const worker2 = await testUtils.createTestWorker({ firstName: 'Bulk2' });
      const worker3 = await testUtils.createTestWorker({ firstName: 'Bulk3' });

      // Bulk delete
      const bulkDeleteResponse = await request(app)
        .post('/api/workers/bulk/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send({ workerIds: [worker1.id, worker2.id, worker3.id] })
        .expect(200);

      expect(bulkDeleteResponse.body.success).toBe(true);
      expect(bulkDeleteResponse.body.data.deletedCount).toBe(3);
      expect(bulkDeleteResponse.body.data.totalRequested).toBe(3);
    });
  });

  describe('🔥 Complete Event Management Workflow', () => {
    it('should perform full event lifecycle management', async () => {
      // CREATE: Add new event
      const newEventData = {
        name: 'Admin Created Event',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        location: 'Admin Location',
        isActive: false
      };

      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send(newEventData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdEvent = createResponse.body.data;

      // UPDATE: Modify event
      const updateData = {
        name: 'Updated Admin Event',
        isActive: true
      };

      const updateResponse = await request(app)
        .put(`/api/events/${createdEvent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Admin Event');
      expect(updateResponse.body.data.isActive).toBe(true);

      // ACTIVATE: Set as active event
      const activateResponse = await request(app)
        .post(`/api/events/${createdEvent.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(activateResponse.body.success).toBe(true);

      // DELETE: Remove event
      const deleteResponse = await request(app)
        .delete(`/api/events/${createdEvent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    it('should import events from JSON', async () => {
      const eventsData = [
        {
          name: 'Imported Event 1',
          startDate: '2024-07-01',
          endDate: '2024-07-02',
          location: 'Import Location 1',
          isActive: false
        },
        {
          name: 'Imported Event 2',
          startDate: '2024-08-01',
          endDate: '2024-08-02',
          location: 'Import Location 2',
          isActive: false
        }
      ];

      const importResponse = await request(app)
        .post('/api/events/import/json')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send({ events: eventsData })
        .expect(200);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.data.imported).toBe(2);
      expect(importResponse.body.data.errors).toHaveLength(0);
    });
  });

  describe('🔥 Complete Check-in Management Workflow', () => {
    it('should manage check-ins with full CRUD operations', async () => {
      // Setup test data
      const worker = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({ isActive: true });
      const checkIn = await testUtils.createTestCheckIn(worker.id, event.id);

      // READ: Get check-ins list
      const listResponse = await request(app)
        .get('/api/checkins?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.some((c: any) => c.id === checkIn.id)).toBe(true);

      // UPDATE: Modify check-in
      const updateData = {
        question1Response: 'Updated Response',
        question2Response: false
      };

      const updateResponse = await request(app)
        .put(`/api/checkins/${checkIn.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.question1Response).toBe('Updated Response');

      // DELETE: Remove check-in
      const deleteResponse = await request(app)
        .delete(`/api/checkins/${checkIn.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('🔥 Complete Reporting Workflow', () => {
    it('should generate comprehensive reports', async () => {
      // Setup test data
      const worker1 = await testUtils.createTestWorker();
      const worker2 = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({ isActive: true });
      
      await testUtils.createTestCheckIn(worker1.id, event.id, {
        question1Response: 'Social Media',
        question2Response: true
      });
      
      await testUtils.createTestCheckIn(worker2.id, event.id, {
        question1Response: 'Friend',
        question2Response: false
      });

      // Get analytics
      const analyticsResponse = await request(app)
        .get(`/api/checkins/analytics/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data.question1Responses).toBeDefined();
      expect(analyticsResponse.body.data.question2Responses).toBeDefined();
      expect(analyticsResponse.body.data.question1Responses['Social Media']).toBe(1);
      expect(analyticsResponse.body.data.question1Responses['Friend']).toBe(1);
      expect(analyticsResponse.body.data.question2Responses.yes).toBe(1);
      expect(analyticsResponse.body.data.question2Responses.no).toBe(1);

      // Get event-specific check-ins
      const eventCheckinsResponse = await request(app)
        .get(`/api/checkins/event/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(eventCheckinsResponse.body.success).toBe(true);
      expect(eventCheckinsResponse.body.data).toHaveLength(2);
    });
  });

  describe('🔥 Admin Session Management', () => {
    it('should handle session lifecycle properly', async () => {
      // Verify token
      const verifyResponse = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.valid).toBe(true);

      // Get user info
      const userInfoResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(userInfoResponse.body.success).toBe(true);
      expect(userInfoResponse.body.data.role).toBe('admin');

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-session-id', sessionId)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      const invalidResponse = await request(app)
        .get('/api/workers')
        .set('Authorization', 'Bearer invalid-token')
        .set('x-session-id', 'invalid-session')
        .expect(401);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('🔥 Performance Under Admin Load', () => {
    it('should handle concurrent admin operations', async () => {
      // Create multiple workers concurrently
      const workerPromises = Array.from({ length: 5 }, (_, i) => {
        const workerData = {
          firstName: `Concurrent${i}`,
          lastName: 'Admin',
          dateOfBirth: '1990-01-01',
          email: `concurrent.admin${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`,
          streetAddress: '123 Concurrent St',
          city: 'Concurrent City',
          state: 'CS',
          zipCode: '12345',
          country: 'USA'
        };

        return request(app)
          .post('/api/workers')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-session-id', sessionId)
          .send(workerData);
      });

      const startTime = Date.now();
      const responses = await Promise.all(workerPromises);
      const endTime = Date.now();

      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000);

      console.log(`🚀 Concurrent admin operations completed in ${duration}ms`);
    });
  });
});