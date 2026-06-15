"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Redirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/exam-revision/topics");
  }, [router]);
  return null;
}
