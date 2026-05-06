import { Knowledge, DataSource } from '@botpress/runtime' 

const localDocs = DataSource.Directory.fromPath('src/knowledge', { 
  id: 'seville-tours-docs', 
  filter: (filePath) => filePath.endsWith('.md') 
}) 

async function fetchWithoutImages(url: string): Promise<Response> {
  const res = await fetch(url)
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('xml')) {
    return res
  }
  const html = await res.text()
  const stripped = html
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
  return new Response(stripped, {
    status: res.status,
    headers: res.headers,
  })
}

const sevillaWebsite = DataSource.Website.fromSitemap(
  'https://www.sevillawalkingtours.com/sitemap.xml',
  {
    id: 'seville-website',
    fetch: fetchWithoutImages,
    maxPages: 200,
  }
) 

export const SevillaKB = new Knowledge({ 
  name: 'sevilla-walking-tours', 
  description: 
    'Knowledge base for Sevilla Walking Tours with tour information, booking details, FAQs, and contact information', 
  sources: [localDocs, sevillaWebsite], 
}) 
