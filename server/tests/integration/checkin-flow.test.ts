// SAVAGE CHECK-IN FLOW INTEGRATION TESTS!!! 🔥🌊🔥

import request from 'supertest';
import express from 'express';
import { testPool, testUtils } from '../setup';
import workerRoutes from '../../routes/workers';
import eventRoutes from '../../routes/events';
import checkinRoutes from '../../routes/checkins';

const app = express();
app.use(express.json());
app.use('/api/workers', workerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkinRoutes);

describe('🌊 CHECK-IN FLOW INTEGRATION TESTS - COMPLETE USER JOURNEYS!!! 💀', () => {

  describe('🔥 Complete Check-in Flow for Existing Worker', () => {
    it('should complete full check-in process', async () => {
      // Step 1: Create test data
      const worker = await testUtils.createTestWorker({
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com'
      });

      const event = await testUtils.createTestEvent({
        name: 'Integration Test Event',
        isActive: true
      });

      // Step 2: Search for worker
      const searchResponse = await request(app)
        .get('/api/workers/search?q=Integration')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data).toHaveLength(1);
      expect(searchResponse.body.data[0].firstName).toBe('Integration');

      // Step 3: Get active events
      const eventsResponse = await request(app)
        .get('/api/events/active')
        .expect(200);

      expect(eventsResponse.body.success).toBe(true);
      expect(eventsResponse.body.data.some((e: any) => e.name === 'Integration Test Event')).toBe(true);

      // Step 4: Submit check-in
      const checkInData = {
        workerId: worker.id,
        eventId: event.id,
        question1Response: 'Social Media',
        question2Response: true,
        question3Response1: 'Networking',
        question3Response2: 'Intermediate',
        termsAccepted: true
      };

      const checkInResponse = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(201);

      expect(checkInResponse.body.success).toBe(true);
      expect(checkInResponse.body.data.checkIn.workerId).toBe(worker.id);
      expect(checkInResponse.body.data.checkIn.eventId).toBe(event.id);
      expect(checkInResponse.body.data.worker.firstName).toBe('Integration');
      expect(checkInResponse.body.data.event.name).toBe('Integration Test Event');

      // Step 5: Verify check-in was recorded
      const verifyResponse = await request(app)
        .get(`/api/checkins/worker/${worker.id}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data).toHaveLength(1);
      expect(verifyResponse.body.data[0].question1Response).toBe('Social Media');
    });
  });

  describe('🔥 Complete Check-in Flow for New Worker', () => {
    it('should register new worker and complete check-in', async () => {
      // Step 1: Create test event
      const event = await testUtils.createTestEvent({
        name: 'New Worker Test Event',
        isActive: true
      });

      // Step 2: Search for non-existent worker
      const searchResponse = await request(app)
        .get('/api/workers/search?q=NewWorker')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data).toHaveLength(0);

      // Step 3: Register new worker
      const newWorkerData = {
        firstName: 'NewWorker',
        lastName: 'Test',
        dateOfBirth: '1990-01-01',
        email: 'newworker@test.com',
        phone: '555-NEW1',
        streetAddress: '123 New St',
        city: 'New City',
        state: 'NS',
        zipCode: '12345',
        country: 'USA'
      };

      const registerResponse = await request(app)
        .post('/api/workers')
        .send(newWorkerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const newWorker = registerResponse.body.data;

      // Step 4: Submit check-in for new worker
      const checkInData = {
        workerId: newWorker.id,
        eventId: event.id,
        question1Response: 'Friend',
        question2Response: false,
        question3Response1: 'Learning',
        question3Response2: 'Beginner',
        termsAccepted: true
      };

      const checkInResponse = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(201);

      expect(checkInResponse.body.success).toBe(true);
      expect(checkInResponse.body.data.worker.firstName).toBe('NewWorker');
      expect(checkInResponse.body.data.checkIn.question1Response).toBe('Friend');
    });
  });

  describe('🔥 Duplicate Check-in Prevention', () => {
    it('should prevent duplicate check-ins for same worker and event', async () => {
      // Step 1: Create test data
      const worker = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({ isActive: true });

      // Step 2: First check-in (should succeed)
      const checkInData = {
        workerId: worker.id,
        eventId: event.id,
        question1Response: 'Social Media',
        question2Response: true,
        question3Response1: 'Networking',
        question3Response2: 'Intermediate',
        termsAccepted: true
      };

      const firstCheckIn = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(201);

      expect(firstCheckIn.body.success).toBe(true);

      // Step 3: Second check-in (should fail)
      const secondCheckIn = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(400);

      expect(secondCheckIn.body.success).toBe(false);
      expect(secondCheckIn.body.error.code).toBe('DUPLICATE_CHECKIN');
    });
  });

  describe('🔥 Multi-Event Check-in Flow', () => {
    it('should allow worker to check into multiple events', async () => {
      // Step 1: Create test data
      const worker = await testUtils.createTestWorker();
      const event1 = await testUtils.createTestEvent({
        name: 'Event 1',
        isActive: true
      });
      const event2 = await testUtils.createTestEvent({
        name: 'Event 2',
        isActive: true
      });

      // Step 2: Check into first event
      const checkIn1Data = {
        workerId: worker.id,
        eventId: event1.id,
        question1Response: 'Social Media',
        question2Response: true,
        question3Response1: 'Networking',
        question3Response2: 'Intermediate',
        termsAccepted: true
      };

      const checkIn1Response = await request(app)
        .post('/api/checkins')
        .send(checkIn1Data)
        .expect(201);

      expect(checkIn1Response.body.success).toBe(true);

      // Step 3: Check into second event
      const checkIn2Data = {
        workerId: worker.id,
        eventId: event2.id,
        question1Response: 'Friend',
        question2Response: false,
        question3Response1: 'Learning',
        question3Response2: 'Beginner',
        termsAccepted: true
      };

      const checkIn2Response = await request(app)
        .post('/api/checkins')
        .send(checkIn2Data)
        .expect(201);

      expect(checkIn2Response.body.success).toBe(true);

      // Step 4: Verify both check-ins exist
      const verifyResponse = await request(app)
        .get(`/api/checkins/worker/${worker.id}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data).toHaveLength(2);
    });
  });

  describe('🔥 Terms and Conditions Validation', () => {
    it('should reject check-in without terms acceptance', async () => {
      const worker = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({ isActive: true });

      const checkInData = {
        workerId: worker.id,
        eventId: event.id,
        question1Response: 'Social Media',
        question2Response: true,
        question3Response1: 'Networking',
        question3Response2: 'Intermediate',
        termsAccepted: false // Terms not accepted
      };

      const response = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TERMS_NOT_ACCEPTED');
    });
  });

  describe('🔥 Event Status Validation', () => {
    it('should reject check-in to inactive event', async () => {
      const worker = await testUtils.createTestWorker();
      const event = await testUtils.createTestEvent({
        isActive: false // Inactive event
      });

      const checkInData = {
        workerId: worker.id,
        eventId: event.id,
        question1Response: 'Social Media',
        question2Response: true,
        question3Response1: 'Networking',
        question3Response2: 'Intermediate',
        termsAccepted: true
      };

      const response = await request(app)
        .post('/api/checkins')
        .send(checkInData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EVENT_NOT_ACTIVE');
    });
  });

  describe('🔥 Performance Under Load', () => {
    it('should handle concurrent check-ins efficiently', async () => {
      // Create test data
      const event = await testUtils.createTestEvent({ isActive: true });
      const workers = [];
      
      // Create 10 workers
      for (let i = 0; i < 10; i++) {
        const worker = await testUtils.createTestWorker({
          email: `concurrent${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`
        });
        workers.push(worker);
      }

      // Perform concurrent check-ins
      const checkInPromises = workers.map(worker => {
        const checkInData = {
          workerId: worker.id,
          eventId: event.id,
          question1Response: 'Social Media',
          question2Response: true,
          question3Response1: 'Networking',
          question3Response2: 'Intermediate',
          termsAccepted: true
        };

        return request(app)
          .post('/api/checkins')
          .send(checkInData);
      });

      const startTime = Date.now();
      const responses = await Promise.all(checkInPromises);
      const endTime = Date.now();

      // All check-ins should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (5 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);

      console.log(`🚀 Concurrent check-ins completed in ${duration}ms`);
    });
  });
});