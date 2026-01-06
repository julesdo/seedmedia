"use client";

import SignUp from "@/app/(unauth)/sign-up/SignUp";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { NewsCarouselBackground } from "@/components/auth/NewsCarouselBackground";

export default function SignUpPage() {
  const t = useTranslations('auth.signUp');
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-6">
      {/* Carousel de news en arrière-plan */}
      <NewsCarouselBackground />
      
      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-md">
        <SignUp />
        <p className="text-center mt-4 text-sm text-white/90 drop-shadow-lg">
          {t('alreadyHaveAccount')}{" "}
          <Link
            href="/sign-in"
            className="text-orange-400 hover:text-orange-300 underline font-medium"
          >
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
