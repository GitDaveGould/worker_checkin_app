// SAVAGE PERFORMANCE TESTS - STRESS TEST THE BEAST!!! ⚡🔥⚡

import request from 'supertest';
import express from 'express';
import { testPool, testUtils } from '../setup';
import workerRoutes from '../../routes/workers';
import eventRoutes from '../../routes/events';
import checkinRoutes from '../../routes/checkins';
import { performanceMonitor } from '../../utils/performance';

const app = express();
app.use(express.json());
app.use('/api/workers', workerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkinRoutes);

describe('⚡ PERFORMANCE TESTS - UNLEASH THE LOAD!!! 💀', () => {

  describe('🔥 Concurrent Worker Search Performance', () => {
    it('should handle 50 concurrent searches efficiently', async () => {
      // Create test workers for searching
      const workers = [];
      for (let i = 0; i < 20; i++) {
        const worker = await testUtils.createTestWorker({
          firstName: `SearchWorker${i}`,
          lastName: `Test${i}`,
          email: `search${i}@test.com`
        });
        workers.push(worker);
      }

      // Perform 50 concurrent searches
      const searchPromises = Array.from({ length: 50 }, (_, i) => {
        const searchTerm = `SearchWorker${i % 20}`;
        return request(app)
          .get(`/api/workers/search?q=${searchTerm}`)
          .expect(200);
      });

      const startTime = Date.now();
      const responses = await Promise.all(searchPromises);
      const endTime = Date.now();

      // All searches should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      const duration = endTime - startTime;
      const avgResponseTime = duration / 50;

      console.log(`🚀 50 concurrent searches completed in ${duration}ms (avg: ${avgResponseTime}ms per search)`);

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(avgResponseTime).toBeLessThan(200); // Average response time under 200ms
    });

    it('should maintain search performance under heavy load', async () => {
      // Create more test data
      for (let i = 0; i < 100; i++) {
        await testUtils.createTestWorker({
          firstName: `LoadWorker${i}`,
          email: `load${i}@test.com`
        });
      }

      // Perform 100 concurrent searches with different patterns
      const searchPromises = Array.from({ length: 100 }, (_, i) => {
        const searchTerms = ['LoadWorker', 'load', '@test.com', '555-'];
        const searchTerm = searchTerms[i % searchTerms.length] + (i % 25);
        
        return request(app)
          .get(`/api/workers/search?q=${searchTerm}`)
          .expect(200);
      });

      const startTime = Date.now();
      const responses = await Promise.all(searchPromises);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const avgResponseTime = duration / 100;

      console.log(`🔥 100 concurrent heavy searches completed in ${duration}ms (avg: ${avgResponseTime}ms)`);

      // Performance assertions for heavy load
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(avgResponseTime).toBeLessThan(300); // Average response time under 300ms
    });
  });

  describe('🔥 Concurrent Check-in Performance', () => {
    it('should handle 100 concurrent check-ins', async () => {
      // Setup: Create event and workers
      const event = await testUtils.createTestEvent({ isActive: true });
      const workers = [];
      
      for (let i = 0; i < 100; i++) {
        const worker = await testUtils.createTestWorker({
          email: `checkin${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`
        });
        workers.push(worker);
      }

      // Perform 100 concurrent check-ins
      const checkInPromises = workers.map((worker, i) => {
        const checkInData = {
          workerId: worker.id,
          eventId: event.id,
          question1Response: ['Social Media', 'Friend', 'Website', 'Other'][i % 4],
          question2Response: i % 2 === 0,
          question3Response1: ['Networking', 'Learning', 'Job Search'][i % 3],
          question3Response2: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
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
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBe(100);

      const duration = endTime - startTime;
      const avgResponseTime = duration / 100;
      const throughput = (100 / duration) * 1000; // check-ins per second

      console.log(`🚀 100 concurrent check-ins completed in ${duration}ms`);
      console.log(`⚡ Average response time: ${avgResponseTime}ms`);
      console.log(`🔥 Throughput: ${throughput.toFixed(2)} check-ins/second`);

      // Performance assertions
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(avgResponseTime).toBeLessThan(500); // Average response time under 500ms
      expect(throughput).toBeGreaterThan(5); // At least 5 check-ins per second
    });

    it('should maintain database consistency under concurrent load', async () => {
      const event = await testUtils.createTestEvent({ isActive: true });
      const workers = [];
      
      // Create 50 workers
      for (let i = 0; i < 50; i++) {
        const worker = await testUtils.createTestWorker({
          email: `consistency${i}@test.com`
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

      const responses = await Promise.all(checkInPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify database consistency
      const verifyResponse = await request(app)
        .get(`/api/checkins/event/${event.id}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data).toHaveLength(50);

      // Verify no duplicate check-ins
      const workerIds = verifyResponse.body.data.map((c: any) => c.workerId);
      const uniqueWorkerIds = [...new Set(workerIds)];
      expect(uniqueWorkerIds).toHaveLength(50);
    });
  });

  describe('🔥 Database Connection Pool Performance', () => {
    it('should handle connection pool efficiently under load', async () => {
      // Create 30 concurrent database operations (more than default pool size)
      const dbOperations = Array.from({ length: 30 }, async (_, i) => {
        const worker = await testUtils.createTestWorker({
          firstName: `PoolTest${i}`,
          email: `pool${i}@test.com`
        });

        // Perform multiple operations per connection
        const searchResponse = await request(app)
          .get(`/api/workers/search?q=PoolTest${i}`)
          .expect(200);

        const listResponse = await request(app)
          .get('/api/workers?page=1&limit=5')
          .expect(200);

        return { worker, searchResponse, listResponse };
      });

      const startTime = Date.now();
      const results = await Promise.all(dbOperations);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`🔥 30 concurrent DB operations completed in ${duration}ms`);

      // All operations should succeed
      results.forEach(result => {
        expect(result.searchResponse.body.success).toBe(true);
        expect(result.listResponse.body.success).toBe(true);
      });

      // Should handle connection pool efficiently
      expect(duration).toBeLessThan(10000); // Within 10 seconds
    });
  });

  describe('🔥 Memory Usage and Cleanup', () => {
    it('should maintain stable memory usage during load', async () => {
      const initialMemory = process.memoryUsage();

      // Perform memory-intensive operations
      const operations = Array.from({ length: 200 }, async (_, i) => {
        const worker = await testUtils.createTestWorker({
          email: `memory${i}@test.com`
        });

        const event = await testUtils.createTestEvent({
          name: `Memory Event ${i}`
        });

        await testUtils.createTestCheckIn(worker.id, event.id);

        // Perform searches to test caching
        await request(app)
          .get(`/api/workers/search?q=memory${i}`)
          .expect(200);

        return { worker, event };
      });

      await Promise.all(operations);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`🧠 Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      console.log(`📊 Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📊 Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 100MB for 200 operations)
      expect(memoryIncreaseMB).toBeLessThan(100);
    });
  });

  describe('🔥 Performance Monitoring Integration', () => {
    it('should track performance metrics accurately', async () => {
      // Clear existing metrics
      (performanceMonitor as any).metrics = [];

      // Perform operations that will be tracked
      const operations = Array.from({ length: 20 }, (_, i) => {
        return request(app)
          .get(`/api/workers/search?q=perf${i}`)
          .expect(200);
      });

      await Promise.all(operations);

      // Get performance stats
      const stats = performanceMonitor.getStats(1); // Last 1 minute

      console.log(`📊 Performance Stats:`, {
        totalRequests: stats.totalRequests,
        successRate: `${stats.successRate}%`,
        avgResponseTime: `${stats.averageResponseTime}ms`,
        slowRequests: stats.slowRequests,
        errorRate: `${stats.errorRate}%`
      });

      // Verify metrics are being tracked
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(90); // At least 90% success rate
      expect(stats.averageResponseTime).toBeLessThan(1000); // Under 1 second average
    });
  });

  describe('🔥 Stress Test - Maximum Load', () => {
    it('should survive extreme concurrent load', async () => {
      // Create base data
      const event = await testUtils.createTestEvent({ isActive: true });
      
      // Create 500 workers (this is extreme!)
      const workerPromises = Array.from({ length: 500 }, (_, i) => {
        return testUtils.createTestWorker({
          firstName: `Stress${i}`,
          email: `stress${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`
        });
      });

      console.log('🔥 Creating 500 test workers...');
      const workers = await Promise.all(workerPromises);

      // Perform 500 concurrent check-ins (EXTREME LOAD!)
      console.log('⚡ Starting 500 concurrent check-ins...');
      const checkInPromises = workers.map((worker, i) => {
        const checkInData = {
          workerId: worker.id,
          eventId: event.id,
          question1Response: 'Social Media',
          question2Response: i % 2 === 0,
          question3Response1: 'Networking',
          question3Response2: 'Advanced',
          termsAccepted: true
        };

        return request(app)
          .post('/api/checkins')
          .send(checkInData);
      });

      const startTime = Date.now();
      const responses = await Promise.all(checkInPromises);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const successCount = responses.filter(r => r.status === 201).length;
      const throughput = (successCount / duration) * 1000;

      console.log(`🚀 EXTREME LOAD RESULTS:`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Successful: ${successCount}/500`);
      console.log(`   Success Rate: ${(successCount/500*100).toFixed(1)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} check-ins/second`);

      // Even under extreme load, we should have reasonable performance
      expect(successCount).toBeGreaterThan(450); // At least 90% success
      expect(duration).toBeLessThan(60000); // Complete within 1 minute
      expect(throughput).toBeGreaterThan(8); // At least 8 check-ins per second

      console.log('💀 SYSTEM SURVIVED EXTREME LOAD TEST!!! 🔥');
    }, 120000); // 2 minute timeout for extreme test
  });
});