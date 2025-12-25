import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-lg font-semibold text-white">
                TAT
              </div>
              <div>
                <h3 className="text-white font-semibold">{t('app_title')}</h3>
                <p className="text-xs">{t('footer.slogan')}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">{t('footer.description')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.products')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition">{t('footer.home')}</Link></li>
              <li><Link to="/case-list" className="hover:text-primary-400 transition">{t('footer.case_list')}</Link></li>
              <li><a href="#leaderboard" className="hover:text-primary-400 transition">{t('footer.leaderboard')}</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition">{t('footer.guide')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">{t('footer.blog')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">{t('footer.faq')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@example.com" className="hover:text-primary-400 transition">{t('footer.email')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-primary-400 transition">{t('footer.privacy')}</a>
              <a href="#" className="hover:text-primary-400 transition">{t('footer.terms')}</a>
              <a href="#" className="hover:text-primary-400 transition">{t('footer.cookies')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
