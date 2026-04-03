/**
 * SRP AI HRMS - Third-Party Integration Configuration
 * All integrations use OFFICIAL APIs only.
 * Scraping or unofficial access is strictly prohibited.
 */

export interface IntegrationConfig {
  enabled: boolean;
  name: string;
  provider: string;
  apiVersion: string;
  officialDocs: string;
  requiredScopes: string[];
  complianceNotes: string;
}

export const integrationConfigs: Record<string, IntegrationConfig> = {
  // ---- Microsoft Office 365 / Outlook ----
  microsoft: {
    enabled: !!process.env.MICROSOFT_CLIENT_ID,
    name: 'Microsoft Office 365',
    provider: 'microsoft',
    apiVersion: 'v1.0',
    officialDocs: 'https://learn.microsoft.com/en-us/graph/overview',
    requiredScopes: [
      'openid',
      'profile',
      'email',
      'User.Read',
      'Mail.Read',
      'Mail.Send',
      'Calendars.ReadWrite',
    ],
    complianceNotes:
      'Requires Azure AD App Registration. Data accessed only with user consent via OAuth 2.0.',
  },

  // ---- WhatsApp Business API ----
  whatsapp: {
    enabled: !!process.env.WHATSAPP_ACCESS_TOKEN,
    name: 'WhatsApp Business',
    provider: 'meta',
    apiVersion: 'v18.0',
    officialDocs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    requiredScopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    complianceNotes:
      'Uses official Meta Cloud API only. Messages require user opt-in. No bulk unsolicited messaging. 24-hour messaging window applies.',
  },

  // ---- LinkedIn ----
  linkedin: {
    enabled: !!process.env.LINKEDIN_CLIENT_ID,
    name: 'LinkedIn',
    provider: 'linkedin',
    apiVersion: 'v2',
    officialDocs: 'https://learn.microsoft.com/en-us/linkedin/',
    requiredScopes: ['openid', 'profile', 'email', 'w_member_social'],
    complianceNotes:
      'OAuth 2.0 login only. Job posting requires LinkedIn Recruiter System Connect (RSC) partnership. No scraping of profiles or data.',
  },

  // ---- Telegram ----
  telegram: {
    enabled: !!process.env.TELEGRAM_BOT_TOKEN,
    name: 'Telegram Bot',
    provider: 'telegram',
    apiVersion: 'Bot API 7.0',
    officialDocs: 'https://core.telegram.org/bots/api',
    requiredScopes: [],
    complianceNotes:
      'Uses official Bot API. Users must /start the bot first. No unsolicited messages. Webhook-based for efficiency.',
  },

  // ---- Naukri.com ----
  naukri: {
    enabled: !!process.env.NAUKRI_API_KEY,
    name: 'Naukri.com',
    provider: 'infoedge',
    apiVersion: 'v1',
    officialDocs: 'https://www.naukri.com/employers',
    requiredScopes: [],
    complianceNotes:
      'OFFICIAL PARTNER API ONLY. Requires paid Naukri Recruiter subscription. Direct scraping is illegal under IT Act 2000 and violates Naukri ToS. All job data handling must comply with Indian data protection laws.',
  },

  // ---- Monster ----
  monster: {
    enabled: !!process.env.MONSTER_API_KEY,
    name: 'Monster',
    provider: 'monster',
    apiVersion: 'v1',
    officialDocs: 'https://www.monster.com/hiring/products',
    requiredScopes: [],
    complianceNotes:
      'OFFICIAL PARTNER API ONLY. Requires Monster enterprise partnership agreement. No scraping or unauthorized data access.',
  },

  // ---- Google (SSO) ----
  google: {
    enabled: !!process.env.GOOGLE_CLIENT_ID,
    name: 'Google OAuth',
    provider: 'google',
    apiVersion: 'v2',
    officialDocs: 'https://developers.google.com/identity',
    requiredScopes: ['openid', 'profile', 'email'],
    complianceNotes:
      'OAuth 2.0 consent flow. Minimal data collection (name, email, profile picture). No access to Gmail, Drive, or other services without explicit scope.',
  },
};

/**
 * Get all enabled integrations
 */
export function getEnabledIntegrations(): IntegrationConfig[] {
  return Object.values(integrationConfigs).filter((config) => config.enabled);
}

/**
 * Check if a specific integration is configured
 */
export function isIntegrationEnabled(name: string): boolean {
  return integrationConfigs[name]?.enabled ?? false;
}
