import { z } from 'zod'

// Staff Login Schema
export const StaffLoginSchema = z.object({
    username: z.string()
        .min(1, 'Tên đăng nhập không được để trống')
        .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
    password: z.string()
        .min(1, 'Mật khẩu không được để trống')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

// Change Password Schema
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string()
        .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
        .regex(/\d/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
})

// Export form data types
export type StaffLoginFormData = z.infer<typeof StaffLoginSchema>
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>
