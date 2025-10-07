'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBookOpen, FiShoppingBag, FiMessageCircle, FiUser } from "react-icons/fi";

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { id: "home", icon: FiHome, label: "홈", href: "/" },
    { id: "magazine", icon: FiBookOpen, label: "매거진", href: "/magazineList" },
    { id: "artshop", icon: FiShoppingBag, label: "아트샵", href: "/artstore" },
    { id: "community", icon: FiMessageCircle, label: "커뮤니티", href: "/community" },
    { id: "mypage", icon: FiUser, label: "마이페이지", href: "/mypage" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 select-none">
      <div className="flex items-center justify-between px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors min-w-0"
            >
              <Icon 
                className={`w-6 h-6 mb-0.5 shrink-0 ${
                  isActive ? "text-blue-500" : "text-gray-400"
                }`} 
              />
              <span 
                className={`text-[11px] leading-[1] text-center ${
                  isActive ? "text-blue-500" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}