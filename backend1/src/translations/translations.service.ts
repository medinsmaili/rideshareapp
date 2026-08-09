import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './translation.entity';

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Translation)
    private repo: Repository<Translation>,
  ) {}

  async findAllAndCount(filter: any = {}) {
    const query = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.language', 'language')
      .orderBy('t.id', 'ASC');

    if (filter.language_id) {
        query.where('t.language_id = :lid', { lid: filter.language_id });
    }
    if (filter.q) {
        query.andWhere('t.key LIKE :q OR t.value LIKE :q', { q: `%${filter.q}%` });
    }

    return query.getManyAndCount();
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['language'] });
  }

  // ✅ FIXED: Upsert Logic + Safety Check
  async create(data: any) {
    // 1. SAFETY CHECK: Reject rows with missing essential data
    // This prevents the "null value in column language_id" error
    if (!data.language_id || !data.key || !data.value) {
        console.warn("Skipping invalid translation data (missing fields):", data);
        return null; // Return null so the API doesn't crash
    }

    // 2. Check if this translation key already exists for this language
    const existing = await this.repo.findOne({
      where: { 
        language: { id: data.language_id },
        key: data.key 
      }
    });

    if (existing) {
      // 3. If it exists, UPDATE it instead of crashing
      existing.value = data.value;
      return this.repo.save(existing);
    }

    // 4. If not, CREATE a new one
    return this.repo.save(this.repo.create({
        ...data,
        language: { id: data.language_id }
    }));
  }

  async update(id: number, data: any) {
    if (data.language_id) {
        data.language = { id: data.language_id };
        delete data.language_id;
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }

  async getTranslationsForApp(langCode: string) {
    const translations = await this.repo.find({
        where: { language: { code: langCode, is_active: true } }
    });
    return translations.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
  }
}