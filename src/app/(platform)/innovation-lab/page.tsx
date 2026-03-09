import type { Metadata } from 'next';
import { ProjectsClient } from './_components/projects-client';

export const metadata: Metadata = {
  title: 'Innovation Lab - Fort Worth TX DAO',
};

export default function InnovationLabPage() {
  return <ProjectsClient />;
}
