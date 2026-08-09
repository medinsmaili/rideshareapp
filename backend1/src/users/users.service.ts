import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Used for Admin Panel
  async findAllAndCount(skip: number = 0, take: number = 25, order: any = { created_at: 'DESC' }): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({ skip, take, order });
  }

  // Used for Admin Panel
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { created_at: 'DESC' } });
  }

  // Used for Profile / Digital Garage
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['vehicles'] // ✅ FIX: Load vehicles so Digital Garage works
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ✅ FIX: Added missing method for AuthService
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  // ✅ FIX: Added missing method for AuthService
  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone_number: phone } });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [
        { email: identifier },
        { phone_number: identifier }
      ]
    });
  }

  async create(userParams: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userParams);
    return this.usersRepository.save(user);
  }

  async update(id: string, userParams: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userParams);
    return this.findOne(id);
  }

  async findAllFiltered(opts: {
    skip: number; take: number; sort: string; order: 'ASC' | 'DESC';
    q?: string; driverStatus?: string; studentStatus?: string;
  }): Promise<[User[], number]> {
    // Whitelist sort columns to prevent SQL errors from arbitrary strings
    const allowedSort = new Set([
      'id', 'email', 'first_name', 'last_name', 'phone_number', 'role',
      'created_at', 'updated_at', 'is_banned', 'is_verified_driver',
      'is_student_verified', 'driver_verification_status', 'student_verification_status',
    ]);
    const sortCol = allowedSort.has(opts.sort) ? opts.sort : 'created_at';

    const qb = this.usersRepository.createQueryBuilder('user');

    if (opts.q) {
      qb.andWhere(
        '(user.first_name ILIKE :q OR user.last_name ILIKE :q OR user.email ILIKE :q)',
        { q: `%${opts.q}%` },
      );
    }
    if (opts.driverStatus) {
      qb.andWhere('user.driver_verification_status = :ds', { ds: opts.driverStatus });
    }
    if (opts.studentStatus) {
      qb.andWhere('user.student_verification_status = :ss', { ss: opts.studentStatus });
    }

    qb.orderBy(`user.${sortCol}`, opts.order)
      .skip(opts.skip)
      .take(opts.take);

    return qb.getManyAndCount();
  }

  async safeRemove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Delete related records in dependency order to avoid FK constraints.
    // Each query runs inside its own SAVEPOINT so a missing table (42P01) can
    // be rolled back without poisoning the surrounding transaction.
    await this.usersRepository.manager.transaction(async (tx) => {
      let spCount = 0;
      const run = async (sql: string, params: any[] = []) => {
        const sp = `sp_${++spCount}`;
        await tx.query(`SAVEPOINT ${sp}`);
        try {
          await tx.query(sql, params);
          await tx.query(`RELEASE SAVEPOINT ${sp}`);
        } catch (err: any) {
          await tx.query(`ROLLBACK TO SAVEPOINT ${sp}`);
          if (err?.code === '42P01') {
            console.warn(`[USERS:safeRemove] skipping missing table: ${err.message}`);
            return;
          }
          throw err;
        }
      };
      await run(`DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1`, [id]);
      await run(`DELETE FROM messages WHERE sender_id = $1`, [id]);
      await run(`DELETE FROM messages WHERE ride_id IN (SELECT id FROM rides WHERE driver_id = $1)`, [id]);
      await run(`DELETE FROM bookings WHERE passenger_id = $1`, [id]);
      await run(`DELETE FROM bookings WHERE ride_id IN (SELECT id FROM rides WHERE driver_id = $1)`, [id]);
      await run(`DELETE FROM ride_alerts WHERE user_id = $1`, [id]);
      await run(`DELETE FROM rides WHERE driver_id = $1`, [id]);
      await run(`DELETE FROM vehicles WHERE owner_id = $1`, [id]);
      await tx.query(`DELETE FROM users WHERE id = $1`, [id]);
    });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async blockUser(userId: string, userToBlockId: string): Promise<User> {
    const user = await this.findOne(userId);
    let blocked = Array.isArray(user.blocked_users) ? user.blocked_users : (user.blocked_users ? [user.blocked_users] : []);
    if (!blocked.includes(userToBlockId)) {
      blocked.push(userToBlockId);
      user.blocked_users = blocked;
      await this.usersRepository.save(user);
    }
    return user;
  }

  async rateUser(userId: string, score: number): Promise<any> {
    const user = await this.findOne(userId);
    const totalRatings = (user.rating_count || 0) + 1;
    const currentRating = Number(user.average_rating) || 5.0; 

    const newRating = ((currentRating * (totalRatings - 1)) + score) / totalRatings;

    await this.usersRepository.update(userId, {
      average_rating: parseFloat(newRating.toFixed(2)),
      rating_count: totalRatings,
    });
    
    return { success: true, newRating: parseFloat(newRating.toFixed(2)) };
  }
}