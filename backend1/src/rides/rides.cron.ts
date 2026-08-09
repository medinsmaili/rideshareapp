// ============================================================
// NEW: Rides Cron Job — Phase 3
// ✅ FIX #6: Auto-mark rides as "ended" 30min after departure
// ============================================================
// Add to rides.module.ts providers array
// Requires: @nestjs/schedule package
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';

// Adjust import path to your Ride entity
// import { Ride } from './ride.entity';

@Injectable()
export class RidesCronService {
  private readonly logger = new Logger(RidesCronService.name);

  constructor(
    // @InjectRepository(Ride)
    // private ridesRepository: Repository<Ride>,
    private ridesRepository: any, // Replace with actual repository injection
  ) {}

  /**
   * Runs every 5 minutes.
   * Marks rides as 'ended' if departure_time + 30 minutes < now
   * and the ride is still in 'active' status.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoEndRides() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    try {
      const result = await this.ridesRepository
        .createQueryBuilder()
        .update('ride') // Replace with your entity name
        .set({ status: 'ended' })
        .where('departure_time < :cutoff', { cutoff: thirtyMinutesAgo })
        .andWhere('status = :status', { status: 'active' })
        .andWhere('status != :cancelled', { cancelled: 'cancelled' })
        .execute();

      if (result.affected > 0) {
        this.logger.log(`Auto-ended ${result.affected} rides past 30min mark.`);
      }
    } catch (error) {
      this.logger.error('Failed to auto-end rides:', error);
    }
  }

  /**
   * Runs once daily at midnight.
   * Cleans up very old rides (optional).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupOldRides() {
    // Optional: archive or delete rides older than 90 days
    this.logger.debug('Daily ride cleanup check completed.');
  }
}
