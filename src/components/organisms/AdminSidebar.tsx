"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { useAdminAuthStore } from "@/src/store";
import { AdminModule } from "@/src/types";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  module: AdminModule | null;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "hugeicons:dashboard-square-02",
    module: null,
  },
  {
    name: "Admin Management",
    href: "/management",
    icon: "hugeicons:user-shield-01",
    module: AdminModule.ADMIN_MANAGEMENT,
  },
  {
    name: "Exam Revision",
    href: "/exam-revision",
    icon: "hugeicons:book-open-02",
    module: AdminModule.EXAM_REVISION,
    children: [
      {
        name: "Exam Types",
        href: "/exam-revision/exam-types",
        icon: "hugeicons:book-01",
        module: AdminModule.EXAM_REVISION,
      },
      {
        name: "Subjects",
        href: "/exam-revision/subjects",
        icon: "hugeicons:library",
        module: AdminModule.EXAM_REVISION,
      },
      {
        name: "Topics",
        href: "/exam-revision/topics",
        icon: "hugeicons:layers-01",
        module: AdminModule.EXAM_REVISION,
      },
      {
        name: "Passages",
        href: "/exam-revision/passages",
        icon: "hugeicons:paragraph",
        module: AdminModule.EXAM_REVISION,
      },
      {
        name: "Questions",
        href: "/exam-revision/questions",
        icon: "hugeicons:quill-write-01",
        module: AdminModule.EXAM_REVISION,
      },
    ],
  },
  {
    name: "Students",
    href: "/students",
    icon: "hugeicons:student",
    module: AdminModule.STUDENTS,
  },
  {
    name: "Sponsors",
    href: "/sponsors",
    icon: "hugeicons:money-bag-01",
    module: AdminModule.SPONSORS,
  },
  {
    name: "Affiliates",
    href: "/affiliates",
    icon: "hugeicons:share-01",
    module: AdminModule.AFFILIATES,
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: "hugeicons:credit-card",
    module: AdminModule.SUBSCRIPTIONS,
  },
  {
    name: "Testimonials",
    href: "/testimonials",
    icon: "hugeicons:comment-add-01",
    module: AdminModule.TESTIMONIALS,
  },
  {
    name: "Bulk Emails",
    href: "/bulk-emails",
    icon: "hugeicons:mail-send-01",
    module: AdminModule.BULK_EMAILS,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: "hugeicons:analytics-01",
    module: AdminModule.ANALYTICS,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: "hugeicons:message-02",
    module: AdminModule.MESSAGES,
  },
];

function AccordionNavItem({
  item,
  pathname,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(
    item.children?.some((child) =>
      child.href === "/exam-revision"
        ? pathname === child.href || pathname.startsWith(child.href + "/")
        : pathname.startsWith(child.href),
    ) ?? false,
  );

  const hasActiveChild = item.children?.some((child) =>
    child.href === "/exam-revision"
      ? pathname === child.href || pathname.startsWith(child.href + "/")
      : pathname.startsWith(child.href),
  );

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-[.25rem] transition-all",
          hasActiveChild
            ? "bg-[#E5E8F8] text-[#007FFF] border border-[#E5E8F8]"
            : "text-white hover:bg-white/10",
        )}
      >
        <div className="flex items-center gap-3">
          <Icon icon={item.icon} className="w-5 h-5" />
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <Icon
          icon="hugeicons:arrow-up-01"
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen ? "" : "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 flex flex-col gap-[.25rem]">
          {item.children?.map((child) => {
            const isChildActive =
              child.href === "/exam-revision"
                ? pathname === child.href ||
                  pathname.startsWith(child.href + "/")
                : pathname.startsWith(child.href);
            return (
              <Link
                key={child.name}
                href={child.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-[.25rem] transition-all text-sm",
                  isChildActive
                    ? "bg-[#E5E8F8] text-[#007FFF] border border-[#E5E8F8]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon icon={child.icon} className="w-4 h-4" />
                <span className="font-medium">{child.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { canRead, logout } = useAdminAuthStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.module === null || canRead(item.module),
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "flex flex-col w-[272px] bg-[#00356B] text-white z-50 transition-transform duration-300",
          "md:relative md:translate-x-0 md:min-h-screen",
          "fixed left-0 top-0 bottom-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col mb-[.75rem] p-[1.5rem_1.5rem_0_1.5rem] gap-[.5rem]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[.5rem]">
              <Image
                src="/svg/logo.svg"
                alt="iExcelo"
                width={88}
                height={34}
                priority
              />
              <p className="text-[.875rem] text-[#E5E8F8]">ADMIN PORTAL</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white md:hidden"
            >
              <Icon icon="hugeicons:cancel-01" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-[.25rem] px-[.5rem] overflow-y-auto">
          {visibleItems.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <AccordionNavItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onClose={onClose}
                />
              );
            }

            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-[.25rem] transition-all",
                  isActive
                    ? "bg-[#E5E8F8] text-[#007FFF] border border-[#E5E8F8]"
                    : "text-white hover:bg-white/10",
                )}
              >
                <Icon icon={item.icon} className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-[.5rem]">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-[.25rem] text-sm font-medium text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Icon icon="hugeicons:logout-01" className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
