import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full flex flex-col sm:flex-row items-center justify-end px-4 py-3 gap-4 bg-ub-purple text-white">
      {/* Contact Links */}
      <Link
        href="mailto:records@ub.edu.bz"
        className="flex items-center gap-2 hover:text-ub-yellow transition-colors"
      >
        <Mail size={20} /> records@ub.edu.bz
      </Link>
      <Link
        href="tel:+5012231234"
        className="flex items-center gap-2 hover:text-ub-yellow transition-colors"
      >
        <Phone size={20} /> +501 223-1234
      </Link>
    </footer>
  );
}
