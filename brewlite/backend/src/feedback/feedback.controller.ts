import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller()
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  /** POST /feedback: ai cũng gửi được, mỗi IP tối đa 5 lần/phút để chống spam */
  @Post('feedback')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedback.create(dto);
  }

  /** GET /staff/feedback: nhân viên đọc góp ý mới nhất */
  @Get('staff/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER')
  findLatest() {
    return this.feedback.findLatest();
  }
}
