import { NextResponse } from 'next/server'

import { getSessionStudent, unauthorized } from '@/lib/server/auth'

export const runtime = 'nodejs'

export async function GET() {
  const student = await getSessionStudent()
  if (!student) {
    return unauthorized()
  }
  return NextResponse.json({ authenticated: true, student })
}
