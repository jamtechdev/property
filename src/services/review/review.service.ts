import { Injectable, NotFoundException } from '@nestjs/common';
import { Review } from 'models/review.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateReviewDto } from 'src/dto/review/review.dto';
import PropertyList from 'models/propertylist.model';
@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review)
    private readonly reviewModel: typeof Review,
  ) {}
  async createReviews(createReviewDto: CreateReviewDto): Promise<Review> {
    const createdReview = await this.reviewModel.create(createReviewDto);
    return createdReview;
  }
  async getReviews(id: number): Promise<{
    reviews: {
      review: Review;
      helpfullCount: number;
      notHelpfullCount: number;
    }[];
  }> {
    const reviews = await this.reviewModel.findAll({
      where: { propertyId: id },
      include: {
        model: PropertyList,
        attributes: ['propertyName'],
      },
    });
    const processedReviews = reviews.map((review) => {
      let helpfullCount = 0;
      let notHelpfullCount = 0;
      if (review.helpfull) {
        try {
          const helpfullArray = JSON.parse(review.helpfull);
          if (Array.isArray(helpfullArray)) {
            helpfullCount = helpfullArray.length;
          }
        } catch (error) {
          throw error;
        }
      }
      if (review.not_helpfull) {
        try {
          const notHelpfullArray = JSON.parse(review.not_helpfull);
          if (Array.isArray(notHelpfullArray)) {
            notHelpfullCount = notHelpfullArray.length;
          }
        } catch (error) {
          throw error;
        }
      }
      return {
        review,
        helpfullCount,
        notHelpfullCount,
      };
    });

    return { reviews: processedReviews };
  }

  async updateHelpFullOrNot(
    id: number,
    helpfull: number,
    not_helpfull: number,
  ): Promise<Review> {
    const review = await this.reviewModel.findOne({
      where: { id: id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    let helpfulArray = review.helpfull ? JSON.parse(review.helpfull) : [];
    let notHelpfulArray = review.not_helpfull
      ? JSON.parse(review.not_helpfull)
      : [];
    if (helpfull) {
      notHelpfulArray = notHelpfulArray.filter((number) => number !== helpfull);
      if (!helpfulArray.includes(helpfull)) {
        helpfulArray.push(helpfull);
      }
      review.helpfull = JSON.stringify(helpfulArray);
      review.not_helpfull = JSON.stringify(notHelpfulArray);
    }
    if (not_helpfull) {
      helpfulArray = helpfulArray.filter((number) => number !== not_helpfull);
      if (!notHelpfulArray.includes(not_helpfull)) {
        notHelpfulArray.push(not_helpfull);
      }
      review.helpfull = JSON.stringify(helpfulArray);
      review.not_helpfull = JSON.stringify(notHelpfulArray);
    }
    await review.save();

    return review;
  }

  async update(id: any, updateReviewDto: CreateReviewDto): Promise<any> {
    const updatedReview = await this.reviewModel.findOne({
      where: { id: id, userId: updateReviewDto.userId },
    });
    if (!updatedReview) {
      throw new Error('reviews not found');
    }
    await updatedReview.update(updateReviewDto, { where: { id: id } });

    return {
      statusCode: 200,
      message: 'reviews updated successfully',
      data: updatedReview,
    };
  }
  async toggleApprovalStatus(
    id: number,
    propertyId: number,
    is_approved: boolean,
  ): Promise<Review> {
    const review = await this.reviewModel.findOne({
      where: { id: id, propertyId: propertyId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Toggle the is_approved status
    review.is_approved = is_approved;

    // Save the updated review
    await review.save();

    return review;
  }
}
