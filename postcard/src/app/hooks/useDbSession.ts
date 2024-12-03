'use client';

import { useSession } from 'next-auth/react';
import DbSession from '../models/DbSession';

export default function useDbSession() {
  const session = useSession();
  return { ...session, data: session.data as DbSession };
}
