"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Button } from "@/src/components/atoms";
import { InputField } from "@/src/components/molecules";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";

const schema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

type FormValues = yup.InferType<typeof schema>;

export default function AcceptInvite() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      toast.error("Invalid invite link");
      return;
    }
    try {
      await api.post("/admin/auth/accept-invite", {
        token,
        password: data.password,
      });
      toast.success("Account created! You can now log in.");
      router.replace("/login");
    } catch (error) {
      handleAxiosError(error, "Failed to accept invite. The link may have expired.");
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.2)] text-center">
          <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-[#D42620] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#101828]">Invalid Link</h2>
          <p className="text-sm text-[#667085] mt-2">
            This invite link is missing or invalid. Please request a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="bg-white rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#007FFF] flex items-center justify-center">
            <Icon icon="hugeicons:user-add-01" className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#101828]">Accept Invitation</h1>
            <p className="text-sm text-[#667085] mt-1">Set your password to activate your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="password"
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}
