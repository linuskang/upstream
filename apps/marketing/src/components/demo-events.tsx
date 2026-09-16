import type { EventProps } from "@workspace/ui/components/event"

export const DemoEvents: EventProps[] = [
  {
    id: "1",
    pushNotify: true,
    title: "hello, world!",
    icon: "👋",
    emailNotify: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    pushNotify: false,
    emailNotify: false,
    title: "webhook delivered",
    icon: "🔗",
    fields: [
      { title: "Endpoint", value: "/api/webhooks/stripe" },
      { title: "Status", value: "200 OK" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    title: "stripe: early fraud warning",
    icon: "🚨",
    id: "3",
    pushNotify: true,
    emailNotify: false,
    description: "Stripe has detected a potential fraud on your account.",
    data: {
      id: "pi_3O1234567890abcdef",
      object: "payment_intent",
      amount: 4999,
      currency: "usd",
      status: "requires_action",
      fraud_details: {
        stripe_report: "fraudulent",
        user_report: null,
      },
    },
    actions: [
      {
        title: "View in Stripe",
        url: "#",
        variant: "primary",
      },
      {
        title: "Mark as safe",
        url: "#",
        variant: "secondary",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    pushNotify: false,
    emailNotify: false,
    title: "user signed up",
    icon: "🙅",
    category: "auth",
    description: "A new user has signed up for your service.",
    fields: [
      { title: "User ID", value: "1234567890abcdef" },
      { title: "Email", value: "user@example.com" },
      { title: "IP Address", value: "192.168.1.1" },
      { title: "User Agent", value: "Chrome/58.0.3029.110 Safari/537.3" },
    ],
    data: {
      id: "1234567890abcdef",
      object: "user",
      email: "user@example.com",
    },
    events: [
      {
        title: "user: account created",
        icon: "🆕",
        emailNotify: false,
        createdAt: new Date().toISOString(),
        id: "4",
        pushNotify: false,
      },
      {
        title: "user: email sent",
        emailNotify: false,
        icon: "📧",
        createdAt: new Date().toISOString(),
        id: "5",
        pushNotify: false,
      },
      {
        title: "user: email verified",
        emailNotify: false,
        icon: "✅",
        createdAt: new Date().toISOString(),
        id: "6",
        pushNotify: false,
      },
    ],
    actions: [
      {
        title: "View user profile",
        url: "#",
        variant: "primary",
      },
      {
        title: "Send welcome email",
        url: "#",
        variant: "secondary",
      },
    ],
    createdAt: new Date().toISOString(),
  },
]
