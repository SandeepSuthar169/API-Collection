import { z } from "zod";

export interface Avatar {
    id: number;
    image: string;
    image_name: string
    categories: string;
    createdAt: Date;
};


export const avatarCategories = [
  "Clay",
  "Criters",
  "Planets",
  "Sprouts",
  "Thumbs",
] as const;

export const createAvatarBodySchema = z.object({
  image: z.string().min(1, "Image is required"),
  image_name: z.string().trim().min(1, "Image name is required").max(255, "Image name must be at most 255 characters"),
  categories: z.enum(avatarCategories),
});

export type CreateAvatarInput = z.infer< typeof createAvatarBodySchema >;


