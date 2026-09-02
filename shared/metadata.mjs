export function renderMetadata(html, config, siteUrl = '') {
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const values={
    __APP_TITLE__: `${config.school.name} ${config.branding.appName} | ${config.branding.tagline}`,
    __APP_DESCRIPTION__: `${config.school.name} 학생과 선생님을 이어주는 상담 예약, ${config.branding.appName}`,
    __THEME_COLOR__: config.branding.primaryColor,
    __OG_URL__: `${siteUrl.replace(/\/$/,'')}/og.png`,
  };
  return html.replace(/__APP_TITLE__|__APP_DESCRIPTION__|__THEME_COLOR__|__OG_URL__/g, token => escape(values[token]));
}
