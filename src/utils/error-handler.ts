import { AxiosError } from "axios";
import { toast } from "sonner";

export function handleAxiosError(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  const message =
    axiosError.response?.data?.message || axiosError.message || fallback;
  toast.error(message);
}
