// ============================================================
// FIX #7: Block User — Service methods to add to UsersService
// ============================================================
// Add these methods to your existing UsersService class.
// Requires a `user_blocks` table in your database:
//
// CREATE TABLE user_blocks (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   created_at TIMESTAMP DEFAULT NOW(),
//   UNIQUE(blocker_id, blocked_id)
// );
// ============================================================

/*
  // Add to UsersService class:

  async blockUser(blockerId: string, blockedId: string) {
    // Check if already blocked
    const existing = await this.userBlocksRepository.findOne({
      where: { blocker_id: blockerId, blocked_id: blockedId },
    });

    if (existing) {
      return { message: 'User already blocked' };
    }

    await this.userBlocksRepository.save({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    return { message: 'User blocked successfully' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.userBlocksRepository.delete({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.userBlocksRepository.find({
      where: { blocker_id: userId },
      select: ['blocked_id'],
    });
    return blocks.map((b) => b.blocked_id);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.userBlocksRepository.findOne({
      where: { blocker_id: blockerId, blocked_id: blockedId },
    });
    return !!block;
  }
*/

// ============================================================
// FIX #7: Update RidesService.searchRides to filter blocked users
// ============================================================
// In your RidesService, modify the searchRides query to exclude
// rides from blocked drivers:
//
/*
  async searchRides(originId: string, destId: string, date: string, userId?: string) {
    const qb = this.ridesRepository.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('ride.origin_city', 'origin_city')
      .leftJoinAndSelect('ride.destination_city', 'destination_city')
      .leftJoinAndSelect('ride.vehicle', 'vehicle')
      .where('ride.status = :status', { status: 'active' });

    if (originId) qb.andWhere('ride.origin_city_id = :originId', { originId });
    if (destId) qb.andWhere('ride.destination_city_id = :destId', { destId });

    // ✅ FIX #7: Exclude rides from blocked users
    if (userId) {
      const blockedIds = await this.usersService.getBlockedUserIds(userId);
      if (blockedIds.length > 0) {
        qb.andWhere('ride.driver_id NOT IN (:...blockedIds)', { blockedIds });
      }
    }

    qb.orderBy('ride.departure_time', 'ASC');
    return qb.getMany();
  }
*/

export {}; // Make this a module
