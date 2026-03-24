import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { signupSchema } from "@/lib/schemas"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Loader2 } from "lucide-react"

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true)
    try {
      await authRegister({ 
        username: data.username, 
        name: data.name, 
        email: data.email,
        password: data.password 
      })
      toast.success("Đăng ký thành công!", {
        description: "Tài khoản của bạn đã được tạo.",
      })
      navigate("/")
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Đăng ký thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản mới để quản lý nhà thuốc của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  error={!!errors.username}
                  errorMessage={errors.username?.message as React.ReactNode}
                  {...register("username")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  error={!!errors.name}
                  errorMessage={errors.name?.message as React.ReactNode}
                  {...register("name")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email (Tùy chọn)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  error={!!errors.email}
                  errorMessage={errors.email?.message as React.ReactNode}
                  {...register("email")}
                />
              </Field>
              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      error={!!errors.password}
                      errorMessage={errors.password?.message as React.ReactNode}
                      {...register("password")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      error={!!errors.confirmPassword}
                      errorMessage={errors.confirmPassword?.message as React.ReactNode}
                      {...register("confirmPassword")}
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Mật khẩu phải có ít nhất 6 ký tự
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white dark:bg-[#5c9a38] dark:text-white dark:hover:bg-[#5c9a38]/90 w-full"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Đăng ký
                </Button>
                <FieldDescription className="text-center">
                  Bạn đã có tài khoản? <a href="/login" className="underline underline-offset-4">Đăng nhập</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
