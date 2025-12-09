import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the base URL from the request or use a default
    const url = new URL(req.url)
    const baseUrl = url.searchParams.get('baseUrl') || 'https://your-domain.com'

    console.log('Generating sitemap for base URL:', baseUrl)

    // Fetch all communities
    const { data: communities, error } = await supabase
      .from('communities')
      .select('slug, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching communities:', error)
      throw error
    }

    console.log(`Found ${communities?.length || 0} communities`)

    // Generate XML sitemap
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/communities</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/auth</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`

    // Add community landing pages
    if (communities) {
      for (const community of communities) {
        const lastmod = community.updated_at 
          ? new Date(community.updated_at).toISOString().split('T')[0]
          : currentDate
        
        sitemap += `
  <url>
    <loc>${baseUrl}/c/${community.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      }
    }

    sitemap += `
</urlset>`

    return new Response(sitemap, {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        status: 200,
        headers: corsHeaders,
      }
    )
  }
})
