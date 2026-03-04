import type { Metadata } from 'next';
import { BountiesClient } from './_components/bounties-client';

export const metadata: Metadata = {
  title: 'Bounties - Fort Worth TX DAO',
};

export default function BountiesPage() {
  return <BountiesClient />;
}
