import type { Metadata } from 'next';
import { ForumsClient } from './_components/forums-client';

export const metadata: Metadata = {
  title: 'Forums - Fort Worth TX DAO',
};

export default function ForumsPage() {
  return <ForumsClient />;
}
