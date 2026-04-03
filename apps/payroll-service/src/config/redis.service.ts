import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  constructor(private configService: ConfigService) { this.client = new Redis(this.configService.get('REDIS_URL', 'redis://localhost:6379')); }
  async get(key: string) { return this.client.get(key); }
  async set(key: string, value: string, ttl?: number) { ttl ? await this.client.setex(key, ttl, value) : await this.client.set(key, value); }
  async del(key: string) { await this.client.del(key); }
  onModuleDestroy() { this.client.disconnect(); }
}
