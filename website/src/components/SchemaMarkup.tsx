import React from 'react';
import Head from '@docusaurus/Head';

interface DefinitionData {
  term: string;
  description: string;
}

interface ArticleData {
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface HowToData {
  name: string;
  description?: string;
  steps: HowToStep[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  questions: FAQItem[];
}

interface PersonData {
  name: string;
  jobTitle: string;
  worksFor: string;
  url: string;
  sameAs: string[];
  knowsAbout: string[];
  alumniOf?: string[];
}

type SchemaType = 'definition' | 'article' | 'howto' | 'faq' | 'person';

interface SchemaMarkupProps {
  type: SchemaType;
  data: DefinitionData | ArticleData | HowToData | FAQData | PersonData;
}

function generateDefinitionSchema(data: DefinitionData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: data.term,
    description: data.description,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'AI Development Methodologies',
    },
  };
}

function generateArticleSchema(data: ArticleData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    ...(data.datePublished && { datePublished: data.datePublished }),
    ...(data.dateModified && { dateModified: data.dateModified }),
    author: {
      '@type': 'Organization',
      name: 'Agentic Coding',
      url: 'https://agenticoding.ai',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Agentic Coding',
      url: 'https://agenticoding.ai',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://agenticoding.ai',
    },
  };
}

function generateHowToSchema(data: HowToData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.name,
    ...(data.description && { description: data.description }),
    step: data.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

function generatePersonSchema(data: PersonData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    jobTitle: data.jobTitle,
    worksFor: {
      '@type': 'Organization',
      name: data.worksFor,
    },
    url: data.url,
    sameAs: data.sameAs,
    knowsAbout: data.knowsAbout,
    ...(data.alumniOf && {
      alumniOf: data.alumniOf.map((org) => ({
        '@type': 'Organization',
        name: org,
      })),
    }),
  };
}

function generateFAQSchema(data: FAQData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export default function SchemaMarkup({
  type,
  data,
}: SchemaMarkupProps): React.ReactElement {
  let schema: object;

  switch (type) {
    case 'definition':
      schema = generateDefinitionSchema(data as DefinitionData);
      break;
    case 'article':
      schema = generateArticleSchema(data as ArticleData);
      break;
    case 'howto':
      schema = generateHowToSchema(data as HowToData);
      break;
    case 'faq':
      schema = generateFAQSchema(data as FAQData);
      break;
    case 'person':
      schema = generatePersonSchema(data as PersonData);
      break;
    default:
      throw new Error(`Unknown schema type: ${type}`);
  }

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Head>
  );
}
