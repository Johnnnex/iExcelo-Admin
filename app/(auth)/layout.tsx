import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="p-[3.75rem] absolute top-0 left-0">
        <Link href="/login">
          <Image
            src="/svg/logo.svg"
            alt="iExcelo"
            width={88}
            height={34}
            priority
          />
        </Link>
      </header>
      <main
        style={{
          background:
            "radial-gradient(149.9% 125.17% at 22.8% 0%, #F2E2F5 5.59%, #ECFCFF 64.15%, #FFF 100%)",
        }}
        className="min-h-screen py-[5rem] flex items-center justify-center"
      >
        {children}
      </main>
    </>
  );
}
