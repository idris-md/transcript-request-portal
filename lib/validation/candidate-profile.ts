// src/lib/validation/candidate-profile.ts
import { z } from "zod";

export const candidateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  headline: z.string().min(3, "Headline is required"),
  location: z.string().min(2, "Location is required"),
  yearsOfExperience: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = typeof val === "number" ? val : Number(val);
      return Number.isNaN(num) ? null : num;
    }),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
