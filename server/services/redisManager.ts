import Redis from 'ioredis';

interface RedisConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  db?: number;
  client: Redis;
  connected: boolean;
  lastUsed: Date;
}

interface QueueConfig {
  connectionId: string;
  queueName: string;
  priority?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

class RedisConnectionManager {
  private connections: Map<string, RedisConnection> = new Map();
  private queues: Map<string, QueueConfig> = new Map();

  async createConnection(config: {
    id: string;
    name: string;
    host: string;
    port: number;
    password?: string;
    db?: number;
  }): Promise<RedisConnection> {
    try {
      const client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });

      await client.ping();

      const connection: RedisConnection = {
        ...config,
        client,
        connected: true,
        lastUsed: new Date(),
      };

      this.connections.set(config.id, connection);
      return connection;
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const testClient = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        connectTimeout: 5000,
      });

      await testClient.ping();
      await testClient.quit();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getConnection(connectionId: string): RedisConnection | undefined {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastUsed = new Date();
    }
    return connection;
  }

  getAllConnections(): RedisConnection[] {
    return Array.from(this.connections.values());
  }

  async removeConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await connection.client.quit();
      this.connections.delete(connectionId);
      
      // Remove associated queues
      for (const [queueId, queue] of this.queues.entries()) {
        if (queue.connectionId === connectionId) {
          this.queues.delete(queueId);
        }
      }
      
      return true;
    }
    return false;
  }

  createQueue(queueId: string, config: QueueConfig): void {
    this.queues.set(queueId, config);
  }

  getQueue(queueId: string): QueueConfig | undefined {
    return this.queues.get(queueId);
  }

  getAllQueues(): Array<{ id: string; config: QueueConfig }> {
    return Array.from(this.queues.entries()).map(([id, config]) => ({ id, config }));
  }

  async addJob(queueId: string, jobData: any, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new Error(`Queue ${queueId} not found`);
    }

    const connection = this.connections.get(queue.connectionId);
    if (!connection || !connection.connected) {
      throw new Error(`Redis connection ${queue.connectionId} not available`);
    }

    const jobId = `${queueId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      queue: queue.queueName,
      data: jobData,
      attempts: options?.attempts || queue.retryAttempts || 3,
      priority: options?.priority || queue.priority || 0,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    if (options?.delay) {
      await connection.client.zadd(
        `${queue.queueName}:delayed`,
        Date.now() + options.delay,
        JSON.stringify(job)
      );
    } else {
      await connection.client.lpush(`${queue.queueName}:pending`, JSON.stringify(job));
    }
  }

  async getQueueStats(queueId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new Error(`Queue ${queueId} not found`);
    }

    const connection = this.connections.get(queue.connectionId);
    if (!connection || !connection.connected) {
      throw new Error(`Redis connection ${queue.connectionId} not available`);
    }

    const [pending, processing, completed, failed, delayed] = await Promise.all([
      connection.client.llen(`${queue.queueName}:pending`),
      connection.client.llen(`${queue.queueName}:processing`),
      connection.client.llen(`${queue.queueName}:completed`),
      connection.client.llen(`${queue.queueName}:failed`),
      connection.client.zcard(`${queue.queueName}:delayed`),
    ]);

    return { pending, processing, completed, failed, delayed };
  }

  async processJob(queueId: string): Promise<any | null> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new Error(`Queue ${queueId} not found`);
    }

    const connection = this.connections.get(queue.connectionId);
    if (!connection || !connection.connected) {
      throw new Error(`Redis connection ${queue.connectionId} not available`);
    }

    const jobData = await connection.client.rpoplpush(
      `${queue.queueName}:pending`,
      `${queue.queueName}:processing`
    );

    if (jobData) {
      return JSON.parse(jobData);
    }
    return null;
  }

  async completeJob(queueId: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) return;

    const connection = this.connections.get(queue.connectionId);
    if (!connection || !connection.connected) return;

    // Remove from processing and add to completed
    await connection.client.lrem(`${queue.queueName}:processing`, 1, jobId);
    await connection.client.lpush(`${queue.queueName}:completed`, jobId);
  }

  async failJob(queueId: string, jobId: string, error: string): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) return;

    const connection = this.connections.get(queue.connectionId);
    if (!connection || !connection.connected) return;

    // Remove from processing and add to failed
    await connection.client.lrem(`${queue.queueName}:processing`, 1, jobId);
    await connection.client.lpush(`${queue.queueName}:failed`, JSON.stringify({
      jobId,
      error,
      failedAt: new Date().toISOString(),
    }));
  }

  async cleanup(): Promise<void> {
    for (const connection of this.connections.values()) {
      if (connection.connected) {
        await connection.client.quit();
      }
    }
    this.connections.clear();
    this.queues.clear();
  }
}

export const redisManager = new RedisConnectionManager();

// Initialize default connections if environment variables are provided
if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisManager.createConnection({
    id: 'default',
    name: 'Default Redis',
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    db: 0,
  }).catch(console.error);
}