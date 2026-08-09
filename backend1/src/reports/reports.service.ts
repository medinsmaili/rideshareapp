import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto, reporter: User): Promise<Report> {
    const report = this.reportRepo.create({
      reason: createReportDto.reason,
      status: 'pending',
      reporter: reporter,
      reported_user: { id: createReportDto.reported_user_id },
      ride: createReportDto.ride_id ? { id: createReportDto.ride_id } : undefined,
    });
    return this.reportRepo.save(report);
  }

  async findAll(): Promise<Report[]> {
    return this.reportRepo.find({
      relations: ['reporter', 'reported_user', 'ride'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['reporter', 'reported_user', 'ride'],
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(id: string, attrs: Partial<Report>): Promise<Report> {
    const report = await this.findOne(id);
    Object.assign(report, attrs);
    return this.reportRepo.save(report);
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.reportRepo.remove(report);
  }
}