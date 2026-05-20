import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Hero } from '../../../components/marketing/Hero'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Input } from '../../../components/ui/Input'
import { blogPosts, blogCategories } from '../../../data/sample-blog'
import { ROUTES } from '../../../lib/routes'

export default function BlogIndex() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return blogPosts.filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [category, search])

  return (
    <>
      <Seo title="CSR Insights Blog" description="Expert insights on CSR compliance, ESG reporting, NGO partnerships, and social impact measurement." path="/blog" />
      <Hero title="CSR Insights" subtitle="Expert perspectives on compliance, impact measurement, and the future of corporate social responsibility." primaryCta={null} secondaryCta={null} />
      <Section bg="white">
        <Container>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {blogCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    category === cat ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.slug} to={ROUTES.blogPost(post.slug)}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <Badge variant="primary" className="mb-3">{post.category}</Badge>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{post.excerpt}</p>
                  <div className="text-xs text-slate-400">
                    {post.author} &middot; {post.date} &middot; {post.readTime}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
