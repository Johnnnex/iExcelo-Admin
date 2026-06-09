"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/atoms";
import { InputField } from "@/src/components/molecules";
import { useAdminAuthStore } from "@/src/store";

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Password too short").required("Password is required"),
});

type FormValues = yup.InferType<typeof schema>;

export default function Login() {
  const router = useRouter();
  const { login } = useAdminAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    await login(data.email, data.password, () => router.replace("/dashboard"));
  };

  return (
    <section className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 md:p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-[#101828] mb-2">
          Admin sign in
        </h1>
        <p className="text-sm text-[#667085] mb-6">
          Sign in to your iExcelo admin account to manage the platform.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputField
                type="email"
                label="Email address"
                placeholder="admin@iexcelo.com"
                error={errors.email?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <InputField
                type="password"
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              className="px-8 justify-center"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
