import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { Container } from '../ui/Container'
import { Section } from '../ui/Section'

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium text-slate-900 pr-4">{question}</span>
        <ChevronDown className={clsx('h-5 w-5 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="pb-5 text-sm text-slate-600 leading-relaxed">{answer}</p>}
    </div>
  )
}

export function FAQ({ title = 'Frequently Asked Questions', items }) {
  return (
    <Section bg="white">
      <Container size="narrow">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">{title}</h2>
        <div>
          {items.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
