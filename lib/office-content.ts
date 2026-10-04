export type OfficePhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type TeamMember = {
  name: string;
  role?: string;
  description?: string;
};

export const officePresentation: {
  photo?: OfficePhoto;
  people: TeamMember[];
} = { people: [] };

export type ClientTestimonial = {
  text: string;
  author: string;
  company?: string;
  source: string;
  authorizedForPublication: boolean;
};

export const clientTestimonials: ClientTestimonial[] = [];
