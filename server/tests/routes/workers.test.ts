// SAVAGE WORKER API TESTS - UNLEASH THE TESTING FURY!!! 🔥⚔️🔥

import request from 'supertest';
import express from 'express';
import { testPool, testUtils } from '../setup';
import workerRoutes from '../../routes/workers';

const app = express();
app.use(express.json());
app.use('/api/workers', workerRoutes);

describe('🔥 WORKER API ENDPOINTS - TESTING APOCALYPSE!!! 💀', () => {
  
  describe('GET /api/workers/search', () => {
    it('should return empty array for queries less than 3 characters', async () => {
      const response = await request(app)
        .get('/api/workers/search?q=ab')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return workers matching search query', async () => {
      const worker = await testUtils.createTestWorker({
        firstName: 'SearchTest',
        lastName: 'Worker',
        email: 'searchtest@test.com'
      });

      const response = await request(app)
        .get('/api/workers/search?q=SearchTest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('SearchTest');
    });

    it('should search by email', async () => {
      const worker = await testUtils.createTestWorker({
        email: 'unique.email@test.com'
      });

      const response = await request(app)
        .get('/api/workers/search?q=unique.email')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('unique.email@test.com');
    });

    it('should search by phone number', async () => {
      const worker = await testUtils.createTestWorker({
        phone: '555-9999'
      });

      const response = await request(app)
        .get('/api/workers/search?q=555-9999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].phone).toBe('555-9999');
    });

    it('should limit results to 10 by default', async () => {
      // Create 15 workers
      for (let i = 0; i < 15; i++) {
        await testUtils.createTestWorker({
          firstName: `TestWorker${i}`,
          email: `testworker${i}@test.com`
        });
      }

      const response = await request(app)
        .get('/api/workers/search?q=TestWorker')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/workers', () => {
    it('should return paginated workers list', async () => {
      const response = await request(app)
        .get('/api/workers?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter workers by city', async () => {
      await testUtils.createTestWorker({
        city: 'FilterCity',
        firstName: 'FilterTest'
      });

      const response = await request(app)
        .get('/api/workers?city=FilterCity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((w: any) => w.city === 'FilterCity')).toBe(true);
    });

    it('should sort workers by specified field', async () => {
      const response = await request(app)
        .get('/api/workers?sortBy=firstName&sortOrder=ASC')
        .expect(200);

      expect(response.body.success).toBe(true);
      const firstNames = response.body.data.map((w: any) => w.firstName);
      const sortedNames = [...firstNames].sort();
      expect(firstNames).toEqual(sortedNames);
    });
  });

  describe('POST /api/workers', () => {
    it('should create a new worker', async () => {
      const newWorker = {
        firstName: 'New',
        lastName: 'Worker',
        dateOfBirth: '1990-01-01',
        email: 'new.worker@test.com',
        phone: '555-1234',
        streetAddress: '123 New St',
        city: 'New City',
        state: 'NS',
        zipCode: '12345',
        country: 'USA'
      };

      const response = await request(app)
        .post('/api/workers')
        .send(newWorker)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.email).toBe('new.worker@test.com');
    });

    it('should reject worker with duplicate email', async () => {
      const worker = await testUtils.createTestWorker({
        email: 'duplicate@test.com'
      });

      const newWorker = {
        firstName: 'Duplicate',
        lastName: 'Worker',
        dateOfBirth: '1990-01-01',
        email: 'duplicate@test.com',
        phone: '555-5555',
        streetAddress: '123 Dup St',
        city: 'Dup City',
        state: 'DS',
        zipCode: '12345',
        country: 'USA'
      };

      const response = await request(app)
        .post('/api/workers')
        .send(newWorker)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should validate required fields', async () => {
      const invalidWorker = {
        firstName: 'Invalid'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/workers')
        .send(invalidWorker)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/workers/:id', () => {
    it('should update an existing worker', async () => {
      const worker = await testUtils.createTestWorker();

      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/workers/${worker.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should return 404 for non-existent worker', async () => {
      const response = await request(app)
        .put('/api/workers/99999')
        .send({ firstName: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WORKER_NOT_FOUND');
    });
  });

  describe('DELETE /api/workers/:id', () => {
    it('should delete an existing worker', async () => {
      const worker = await testUtils.createTestWorker();

      const response = await request(app)
        .delete(`/api/workers/${worker.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');
    });

    it('should return 404 for non-existent worker', async () => {
      const response = await request(app)
        .delete('/api/workers/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WORKER_NOT_FOUND');
    });
  });

  describe('POST /api/workers/bulk/delete', () => {
    it('should delete multiple workers', async () => {
      const worker1 = await testUtils.createTestWorker();
      const worker2 = await testUtils.createTestWorker();

      const response = await request(app)
        .post('/api/workers/bulk/delete')
        .send({ workerIds: [worker1.id, worker2.id] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(2);
      expect(response.body.data.totalRequested).toBe(2);
    });

    it('should handle partial failures gracefully', async () => {
      const worker = await testUtils.createTestWorker();

      const response = await request(app)
        .post('/api/workers/bulk/delete')
        .send({ workerIds: [worker.id, 99999] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(1);
      expect(response.body.data.totalRequested).toBe(2);
      expect(response.body.data.errors).toHaveLength(1);
    });
  });

  describe('GET /api/workers/stats/overview', () => {
    it('should return worker statistics', async () => {
      const response = await request(app)
        .get('/api/workers/stats/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalWorkers');
      expect(response.body.data).toHaveProperty('newThisWeek');
      expect(response.body.data).toHaveProperty('newThisMonth');
      expect(response.body.data).toHaveProperty('topCities');
      expect(response.body.data).toHaveProperty('topStates');
    });
  });
});