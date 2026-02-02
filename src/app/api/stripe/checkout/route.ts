import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { priceId } = body

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
  }

  // Get or create customer
  let subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  let customerId = subscription?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id

    if (subscription) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          tier: 'free',
          status: 'active',
        },
      })
    }
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
