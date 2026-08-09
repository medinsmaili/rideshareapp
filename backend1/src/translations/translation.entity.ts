import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Language } from '../languages/language.entity';

@Entity('app_translations')
@Unique(['language', 'key']) // Prevent duplicate keys for same language
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Language, (lang) => lang.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @Column()
  language_id: number;

  @Column()
  key: string;

  @Column('text')
  value: string;

  @CreateDateColumn()
  created_at: Date;
}