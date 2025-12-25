import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NavBar from '../../components/NavBar.jsx'
import Footer from '../../components/Footer.jsx'
import { backgroundImage, backgroundImage2, backgroundImage3, img_home, img_home1 } from '../../Image/image.js'

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <div className="flex-1 font-sans text-slate-800 bg-white overflow-hidden">
        {/* PAGE 1: HERO SECTION */}
        <section
          className="relative h-screen flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(20,30,50,0.5), rgba(20,30,50,0.5)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 w-full">
            {/* Left side: Text content */}
            <div className="md:w-1/2 text-center md:text-left">
              <span className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-primary-300 bg-primary-400/30 px-7 py-3 text-base font-extrabold uppercase tracking-widest text-green-100 shadow-lg drop-shadow-lg">
                ✨ {t('home.hero.tat_team')}
              </span>

              <div className="mt-8 space-y-6">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
                  CaseStudy Hub
                </h1>
                <p className="max-w-2xl mx-auto md:mx-0 text-xl text-primary-100">
                  {t('home.hero.subtitle')}
                </p>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a href="#section-2" className="rounded-full border-2 border-white px-8 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-900">
                  {t('home.hero.cta_button')}
                </a>
              </div>
            </div>
            {/* Right side: Image */}
            <div className="md:w-1/2 mt-12 md:mt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column with 2 images */}
                <div className="flex flex-col gap-4">
                  <img
                    src={backgroundImage3}
                    alt="Case study example 1"
                    className="w-full h-auto rounded-xl shadow-2xl object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                  <img
                    src={img_home}
                    alt="CaseStudy Hub Illustration"
                    className="w-full h-auto rounded-xl shadow-2xl object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Right Column with 1 image, staggered */}
                <div className="flex items-center">
                  <img
                    src={img_home1}
                    alt="Case study example 2"
                    className="w-full h-auto rounded-xl shadow-2xl object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* PAGE 2: LEADERBOARDS & CASE LIBRARY */}
        <section
          className="min-h-screen flex items-center justify-center py-20 relative"
          style={{
            backgroundImage: `linear-gradient(rgba(20,30,50,0.7), rgba(20,30,50,0.7)), url(${backgroundImage2})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >

          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                {t('home.features.title')}
              </h2>
              <p className="text-2xl font-bold text-white drop-shadow-sm">
                {t('home.features.subtitle')}
              </p>
            </div>



            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Leaderboards Card */}
              <div className="group relative rounded-3xl border border-slate-200/20 bg-white/10 backdrop-blur-lg p-8 md:p-12 shadow-2xl transition hover:bg-white/15">
                <div className="relative z-10">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('home.features.leaderboard.title')}</h3>
                  <p className="text-lg text-slate-300 mb-6">
                    {t('home.features.leaderboard.desc')}
                  </p>
                  <button
                    onClick={() => navigate('/case-list')}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-primary-400 bg-primary-500/50 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
                  >
                    {t('home.features.leaderboard.button')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Case Library Card */}
              <div className="group relative rounded-3xl border border-slate-200/20 bg-white/10 backdrop-blur-lg p-8 md:p-12 shadow-2xl transition hover:bg-white/15">
                <div className="relative z-10">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('home.features.case_library.title')}</h3>
                  <p className="text-lg text-slate-300 mb-6">
                    {t('home.features.case_library.desc')}
                  </p>
                  <button
                    onClick={() => navigate('/case-home')}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-primary-400 bg-primary-500/50 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
                  >
                    {t('home.features.case_library.button')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 3: ABOUT US SECTION */}
        <section
          className="py-20 flex items-center"
          style={{
            backgroundImage: `linear-gradient(rgba(20,30,50,0.6), rgba(20,30,50,0.6)), url(${backgroundImage3})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
                {t('home.about.title')}
              </h2>
              <p className="text-xl text-slate-200 max-w-3xl mx-auto drop-shadow">
                {t('home.about.subtitle')}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/20 bg-white/10 backdrop-blur-lg p-8 md:p-12 shadow-2xl">
              <div className="grid md:grid-cols-5 gap-12 items-center">
                {/* Image */}
                <div className="md:col-span-2">
                  <img
                    src={img_home}
                    alt="TAT Team working"
                    className="rounded-2xl shadow-xl w-full h-auto object-cover"
                  />
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">
                  <h3 className="text-3xl font-bold text-white">{t('home.about.value_prop_title')}</h3>
                  <p className="text-lg text-slate-300">
                    {t('home.about.value_prop_desc')}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <span className="inline-flex items-center rounded-full border border-primary-400 bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm">
                      🎯 Product Strategy
                    </span>
                    <span className="inline-flex items-center rounded-full border border-primary-400 bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm">
                      🤖 Machine Learning
                    </span>
                    <span className="inline-flex items-center rounded-full border border-primary-400 bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm">
                      📊 Data Visualization
                    </span>
                    <span className="inline-flex items-center rounded-full border border-primary-400 bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm">
                      ‍💼 Community
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 4: FEATURES & CTA */}
        <section
          className="py-20 flex items-center"
          style={{
            backgroundImage: `linear-gradient(rgba(20,30,50,0.7), rgba(20,30,50,0.7)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
                {t('home.benefits.title')}
              </h2>
              <p className="text-xl text-slate-200 max-w-3xl mx-auto drop-shadow">
                {t('home.benefits.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <span className="text-3xl">📚</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{t('home.benefits.feature1.title')}</h4>
                <p className="text-slate-300 text-sm">{t('home.benefits.feature1.desc')}</p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{t('home.benefits.feature2.title')}</h4>
                <p className="text-slate-300 text-sm">{t('home.benefits.feature2.desc')}</p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <span className="text-3xl">👥</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{t('home.benefits.feature3.title')}</h4>
                <p className="text-slate-300 text-sm">{t('home.benefits.feature3.desc')}</p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <span className="text-3xl">🚀</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{t('home.benefits.feature4.title')}</h4>
                <p className="text-slate-300 text-sm">{t('home.benefits.feature4.desc')}</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-20 text-center">
              <button
                onClick={() => navigate('/case-list')}
                className="inline-flex items-center gap-3 rounded-full border-2 border-primary-400 bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition duration-300 hover:bg-transparent hover:text-primary-300 shadow-lg hover:shadow-primary-400/50"
              >
                {t('home.cta.button')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
