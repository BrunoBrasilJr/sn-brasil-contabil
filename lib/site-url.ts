const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const deploymentDomain = process.env.VERCEL_URL;

export const siteUrl = new URL(
  process.env.SITE_URL ||
  (productionDomain ? `https://${productionDomain}` :
    deploymentDomain ? `https://${deploymentDomain}` : 'http://localhost:5173'),
);
