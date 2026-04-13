import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import UserMenu from '@/components/UserMenu';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kanji Easy — Học tiếng Nhật bằng tiếng Việt',
  description: 'Công cụ học tiếng Nhật bằng tiếng Việt với flashcard, quiz và nhiều chế độ học.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <header className="bg-indigo-600 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <span className="text-white font-bold text-lg tracking-tight">
              Kanji Easy
            </span>
            <UserMenu />
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
