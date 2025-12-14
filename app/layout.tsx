import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🎰 Slot Machine - Habbi3',
  description: 'Interactive chat slot machine for Twitch',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}
