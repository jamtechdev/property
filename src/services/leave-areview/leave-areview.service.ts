import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import leaveAReview from 'models/leaveareviews.model';
import { CreateBlogReviewDto } from 'src/dto/leaveAReview/leaveAReview.dto';

@Injectable()
export class LeaveAreviewService {
    constructor(
        @InjectModel(leaveAReview)
        private readonly leaveAReviewModel: typeof leaveAReview,
    ) { }
    async createBlogReviews(createBlogReviewDto: CreateBlogReviewDto): Promise<leaveAReview> {
        const createdBlogReview = await this.leaveAReviewModel.create(createBlogReviewDto);
        return createdBlogReview;
    }

}
