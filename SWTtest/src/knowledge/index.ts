import { Knowledge, DataSource } from '@botpress/runtime' 

const localDocs = DataSource.Directory.fromPath('src/knowledge', { 
  id: 'seville-tours-docs', 
  filter: (filePath) => filePath.endsWith('.md') 
}) 

const sevillaWebsite = DataSource.Website.fromSitemap( 
  'https://www.sevillawalkingtours.com/sitemap.xml', 
  { 
    id: 'seville-website', 
    maxPages: 200,           // límite razonable 
    maxDepth: 5,            // profundidad del árbol 
    fetch: 'integration:browser' // opcional, usar navegador 
  } 
) 

export const SevillaKB = new Knowledge({ 
  name: 'sevilla-walking-tours', 
  description: 
    'Knowledge base for Sevilla Walking Tours with tour information, booking details, FAQs, and contact information', 
  sources: [localDocs, sevillaWebsite], 
}) 
