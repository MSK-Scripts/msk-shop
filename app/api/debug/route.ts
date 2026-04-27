import { NextResponse } from 'next/server'

// Debug route disabled in production
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
