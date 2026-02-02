import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = session.subscription as string
      const customerId = session.customer as string

      // Get subscription details
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
      const priceId = stripeSubscription.items.data[0]?.price.id

      // Map price to tier
      const tier = mapPriceToTier(priceId)

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          tier,
          status: 'active',
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const tier = mapPriceToTier(priceId)

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          tier,
          status: subscription.status === 'active' ? 'active' : 'past_due',
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          tier: 'free',
          status: 'canceled',
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      const subscriptionId = invoice.subscription as string

      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'past_due' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

function mapPriceToTier(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '']: 'starter',
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'enterprise',
  }
  return priceMap[priceId] || 'free'
}
