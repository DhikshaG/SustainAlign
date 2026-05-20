import { Link, useParams } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Badge } from '../../../components/ui/Badge'
import { blogPosts } from '../../../data/sample-blog'
import { ROUTES } from '../../../lib/routes'
import NotFound from '../NotFound'

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return <NotFound />

  return (
    <>
      <Seo title={post.title} description={post.excerpt} path={`/blog/${slug}`} />
      <Section bg="white" className="pt-12">
        <Container size="narrow">
          <Link to={ROUTES.blog} className="text-sm text-primary-600 hover:underline mb-6 inline-block">
            &larr; Back to Blog
          </Link>
          <Badge variant="primary" className="mb-4">{post.category}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{post.title}</h1>
          <p className="text-sm text-slate-500 mb-8">
            {post.author} &middot; {post.date} &middot; {post.readTime}
          </p>
          <div
            className="prose prose-slate max-w-none text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </Container>
      </Section>
    </>
  )
}
