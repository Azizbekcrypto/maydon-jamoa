import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  holat(): string {
    return 'Maydon Jamoa Backend ishlayapti';
  }
}
