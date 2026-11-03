import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lưu góp ý; trả về mã ngắn để khách nhắc lại khi cần */
  async create(dto: CreateFeedbackDto) {
    const row = await this.prisma.feedback.create({ data: dto, select: { id: true, createdAt: true } });
    return { ref: row.id.slice(0, 8).toUpperCase(), createdAt: row.createdAt };
  }

  /** 50 góp ý mới nhất cho nhân viên */
  findLatest() {
    return this.prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
