// src/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPost } from './entities/blog-post.entity';
import { BlogSubscriber } from './entities/blog-subscriber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogSubscriber])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
