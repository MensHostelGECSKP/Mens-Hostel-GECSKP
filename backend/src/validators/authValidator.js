const { z } = require('zod');

const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long');

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['student', 'admin']).default('student'),
    yearOfStudy: z.string().trim().max(20).optional(),
    roomNumber: z.string().trim().max(50).optional(),
  })
  .superRefine((data, ctx) => {
    const role = data.role ?? 'student';
    if (role === 'student') {
      if (!data.yearOfStudy?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['yearOfStudy'],
          message: 'Year of study is required for students',
        });
      }
      if (!data.roomNumber?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['roomNumber'],
          message: 'Room number is required for students',
        });
      }
    }
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema,
  roomNumber: z.string().trim().min(1, 'Room number is required').max(50, 'Room number is too long'),
  yearOfStudy: z
    .string()
    .trim()
    .min(1, 'Year is required')
    .refine((val) => /^[1-4]$/.test(val.replace(/^year\s*/i, '').trim()), {
      message: 'Year must be between 1 and 4',
    }),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status must be active or inactive' }),
  }),
});

const { validate } = require('../utils/zodValidate');

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateUpdateUser: validate(updateUserSchema),
};
