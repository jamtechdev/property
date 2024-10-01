export class CreateStoreContentDto {
  title: string;
  heading: string;
  subHeading: string;
}
export class CreateBannerOptionsDto {
  banner_color?: string;
  font_family?: string;
}

export class UpdateBannerOptionsDto {
  font_color?: string;
  userId?: number;
  banner_color?: string;
  font_family?: string;
}
