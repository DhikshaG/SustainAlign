import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Container } from './ui/Container'
import { Button } from './ui/Button'
import { ROUTES } from '../lib/routes'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-32 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-6">An unexpected error occurred. Please try again.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => this.setState({ hasError: false, error: null })}>Try Again</Button>
            <Button as={Link} to={ROUTES.home} variant="secondary">Go Home</Button>
          </div>
        </Container>
      )
    }
    return this.props.children
  }
}
