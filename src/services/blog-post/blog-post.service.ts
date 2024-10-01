import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog } from 'models/blog.post.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateBlogDto, UpdateBlogDto } from 'src/dto/blogs/blog.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import User from 'models/user.model';
import leaveAReview from 'models/leaveareviews.model';
import { Op } from 'sequelize';
import { CreateBlogReviewDto } from 'src/dto/leaveAReview/leaveAReview.dto';

@Injectable()
export class BlogPostService {
  constructor(
    @InjectModel(Blog)
    private readonly blogPostModel: typeof Blog,
    @InjectModel(leaveAReview)
    private readonly leaveAReviewModel: typeof leaveAReview,
  ) {}

  async createBlogs(createBlogsDto: CreateBlogDto): Promise<Blog> {
    const slug = createBlogsDto.title.trim().toLowerCase().replace(/\s+/g, '-');
    createBlogsDto.slug = slug;
    return this.blogPostModel.create(createBlogsDto);
  }

  async findByUserId(
    userId: number,
    paginationDto?: PaginationDto,
    searchQuery?: string,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const searchCondition = searchQuery
      ? {
          [Op.and]: [
            { userId: userId },
            {
              [Op.or]: [
                { title: { [Op.like]: `%${searchQuery}%` } },
                { description: { [Op.like]: `%${searchQuery}%` } },
              ],
            },
          ],
        }
      : { userId: userId };
    const totalUserBlogs = await this.blogPostModel.count({
      where: searchCondition,
    });
    const totalPages = Math.ceil(totalUserBlogs / parsedLimit);
    const blogs = await this.blogPostModel.findAll({
      where: searchCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + blogs.length;
    if (!blogs || blogs.length === 0) {
      return {
        blogs,
        totalUserBlogs,
        currentPage: parsedPage,
        totalPages,
        from,
        to,
      };
    }
    return {
      blogs,
      totalUserBlogs,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async findAllBlog(
    searchQuery?: string,
    paginationDto?: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const searchCondition = searchQuery
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${searchQuery}%` } },
            { description: { [Op.like]: `%${searchQuery}%` } },
          ],
        }
      : {};
    const totalBlogs = await this.blogPostModel.count({
      where: searchCondition,
    });
    const totalPages = Math.ceil(totalBlogs / parsedLimit);

    const blogs = await this.blogPostModel.findAll({
      where: searchCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + blogs.length;
    if (!blogs) {
      return {
        blogs,
        totalBlogs,
        currentPage: parsedPage,
        totalPages,
        from,
        to,
      };
    }
    return {
      blogs,
      totalBlogs,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async update(id: any, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const updatedBlog = await this.blogPostModel.findOne({
      where: { id: id, userId: updateBlogDto.userId },
    });
    if (!updatedBlog) {
      throw new Error('blog not found');
    }
    await updatedBlog.update(updateBlogDto, { where: { id: id } });
    return updatedBlog;
  }

  async deleteBlogById(id: number): Promise<{ message: string }> {
    const result = await this.blogPostModel.destroy({ where: { id } });
    if (result) {
      return { message: 'Blog removed successfully.' };
    } else {
      return { message: 'Blog not found.' };
    }
  }

  async findBlogBySlug(slug: string): Promise<any> {
    const blog = await this.blogPostModel.findOne({
      where: { slug },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'image'],
        },
        {
          model: leaveAReview,
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'blogId'],
          },
        },
      ],
    });
    if (!blog) {
      throw new NotFoundException(`No blog found with the slug: ${slug}`);
    }
    return {
      blog,
    };
  }

  async createBlogReviews(
    createBlogReviewDto: CreateBlogReviewDto,
  ): Promise<leaveAReview> {
    const createdBlogReview =
      await this.leaveAReviewModel.create(createBlogReviewDto);
    return createdBlogReview;
  }
}
