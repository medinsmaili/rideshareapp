import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Translation } from '../translations/translation.entity';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn() // BigInt/Integer ID
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string; // e.g. 'en', 'sq'

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Translation, (translation) => translation.language)
  translations: Translation[];
}