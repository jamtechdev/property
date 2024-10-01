import {
  Controller,
  Post,
  UseGuards,
  Body,
  HttpException,
  HttpStatus,
  NotFoundException,
  Query,
  Get,
  Req,
  Put,
  Request,
  ParseIntPipe,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { BlogPostService } from 'src/services/blog-post/blog-post.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto, UpdateBlogDto } from 'src/dto/blogs/blog.dto';
import Blog from 'models/blog.post.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import slugify from 'slugify';
import { CreateBlogReviewDto } from 'src/dto/leaveAReview/leaveAReview.dto';

@Controller('blog-post')
export class BlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}
  @Post('add-blog')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createModeratorDto: CreateBlogDto) {
    try {
      const moderator =
        await this.blogPostService.createBlogs(createModeratorDto);
      return moderator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('blogById')
  @UseGuards(AuthGuard('jwt'))
  async getBlogById(
    @Query('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
    @Query('key') key: string,
    @Req() req: Request,
  ): Promise<Blog[]> {
    const blog = await this.blogPostService.findByUserId(
      userId,
      paginationDto,
      key,
    );
    if (!blog) {
      throw new NotFoundException(`blog not found ${userId}`);
    }
    return blog;
  }

  @Get('get-blog')
  // @UseGuards(AuthGuard('jwt'))
  async findBlog(
    @Query('key') key: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<any> {
    const allBlogs = await this.blogPostService.findAllBlog(key, paginationDto);
    if (!allBlogs) {
      throw new NotFoundException(`blog not found`);
    }
    return allBlogs;
  }

  @Put('update-blog/:id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: number, @Body() updateBlogDto: UpdateBlogDto) {
    try {
      const updatedBlog = await this.blogPostService.update(id, {
        ...updateBlogDto,
      });
      return updatedBlog;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete-blog/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteBlogById(@Param('id', ParseIntPipe) id: number) {
    const deleteBlog = await this.blogPostService.deleteBlogById(id);
    return deleteBlog;
  }
  @Get('get-blog-by-slug/:slug')
  // @UseGuards(AuthGuard('jwt'))
  async findBlogBySlug(@Param('slug') slug: string): Promise<any> {
    const blog = await this.blogPostService.findBlogBySlug(slug);

    return blog;
  }
  @Post('add-blogs-review')
  async createReview(@Body() createBlogReviewDto: CreateBlogReviewDto) {
    const blogReview =
      await this.blogPostService.createBlogReviews(createBlogReviewDto);
    return blogReview;
  }
}
