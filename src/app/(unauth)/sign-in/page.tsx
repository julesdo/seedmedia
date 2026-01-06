"use client";

import { Suspense } from "react";
import SignIn from "@/app/(unauth)/sign-in/SignIn";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { NewsCarouselBackground } from "@/components/auth/NewsCarouselBackground";

function SignInContent() {
  const t = useTranslations('auth.signIn');
  return (
    <>
      <SignIn />
      <p className="text-center mt-4 text-sm text-white/90 drop-shadow-lg">
        {t('dontHaveAccount')}{" "}
        <Link
          href="/sign-up"
          className="text-orange-400 hover:text-orange-300 underline font-medium"
        >
          {t('signUp')}
        </Link>
      </p>
    </>
  );
}

function SignInLoading() {
  const t = useTranslations('auth.signIn');
  return (
    <div className="text-center py-8">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('loading')}
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-6">
      {/* Carousel de news en arrière-plan */}
      <NewsCarouselBackground />
      
      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<SignInLoading />}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
