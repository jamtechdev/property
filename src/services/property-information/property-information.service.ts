import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import PropertyInformation from 'models/propertyinformation.model';
import PropertyList from 'models/propertylist.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PropertyInformationDto } from 'src/dto/propertyInformation/propertyInformation.dto';


@Injectable()
export class PropertyInformationService {
    constructor(
        @InjectModel(PropertyInformation)
        private readonly propertyInformationModel: typeof PropertyInformation,
    ) { }

    async create(propertyInformationDto: PropertyInformationDto): Promise<PropertyInformation> {
        return this.propertyInformationModel.create(propertyInformationDto)
    }

    async findById(id: number): Promise<PropertyInformation> {
        const propertyInformation = await this.propertyInformationModel.findOne({ where: { id: id } });
        if (!propertyInformation) {
            throw new NotFoundException('propertyInformation not found')
        }
        return propertyInformation;
    }

    async findAllPropertyInformation(paginationDto: PaginationDto): Promise<any> {
        const { page, limit } = paginationDto;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit;
        const totalPropertyInformation = await this.propertyInformationModel.count();
        const totalPages = Math.ceil(totalPropertyInformation / parsedLimit);
        const propertyInformation = await this.propertyInformationModel.findAll({
            include: [
                {
                    model: PropertyList,
                    attributes: ['id', 'propertyName'],
                },
            ],
            offset,
            limit: parsedLimit
        })
        const from = offset + 1;
        const to = offset + propertyInformation.length;
        return {
            propertyInformation,
            totalPropertyInformation,
            currentPage: parsedPage,
            totalPages,
            from,
            to,
        }
    }


}
