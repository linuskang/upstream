import Link from "next/link"

import { Event } from "@workspace/ui/components/event"
import { EventsList } from "@workspace/ui/components/event-list"
import { Button } from "@workspace/ui/components/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { Navbar } from "@/components/navbar"
import { DemoEvents } from "@/components/demo-events"

const starterCode = `import { Upstream } from "@uplabs/sdk"

const up = new Upstream({
  apiKey: "YOUR_API_KEY",
})

up.events.log({
    title: "hello, world!",
    icon: "👋",
})
`

const moreDetailedCode = `up.events.log({
    title: "hello, world!",
    icon: "👋",
    description: "this is a more detailed event",
    fields: [
        {
            title: "this is a field",
            value: "you can add some info here",
        },
        {
            title: "this is another field",
            value: "you can add some more info here",
        },
    ],
})
`

const actionsCode = `await ups.events.ingest({
  title: "This triggered a push notification!",
  pushNotify: true,
  contextId: "contextId-example-notifications",
  contextStart: true
})

await ups.events.ingest({
  title: "This triggered a notification inside the event!",
  contextId: "contextId-example-notifications",
  pushNotify: true,
  data: {
    "test": "This is a test with contextId and data.",
    "contextId": "contextId-example-notifications",
    "contextStart": true
  },
  actions: [
    {
      title: "View",
      url: "https://upstream.dev",
      variant: "primary"
    },
    {
      title: "Dismiss",
      url: "https://upstream.dev",
      variant: "secondary"
    }
  ]
})
`

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <section className="relative flex flex-col px-4 pt-20 text-center">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-2 sm:px-0">
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-5xl">
            Simple and open event logs for your next project.
          </h1>

          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Upstream is a simple logging platform for developers. View your
            events in a beautifully designed dashboard with powerful searching
            capabilities.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full gap-2 text-sm font-semibold sm:w-auto"
            >
              <Link href="https://up.linus.my/register" target="_blank">
                Create a free account
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full gap-2 text-sm font-semibold sm:w-auto"
            >
              <Link href="/docs">View the docs</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-5 w-full max-w-md sm:mt-12">
          <EventsList events={DemoEvents} />
        </div>
      </section>

      <section className="-mt-10 flex flex-col items-center px-4 py-16 sm:py-24">
        <div className="max-w-lg space-y-4">
          <p className="text-lg text-muted-foreground">
            look.{" "}
            <strong>managing your SaSS events in a project is not easy.</strong>{" "}
            every project needs an logs viewer, searching APIs, ingestion
            endpoints, SDKs, and analytics.{" "}
            <strong>there are a lot of moving parts.</strong>
          </p>
          <p className="text-lg text-muted-foreground">
            we&apos;ve all been there before, its a pain to set up and maintain.
            this is why developers pay for logging platforms.
            <br />
            <br />
            however, most platforms like datadog, seq, signoz, and many others
            aren&apos;t designed for your critical product events, which need to
            be viewed at a glance.
            <br />
            <br />
            <strong className="text-white">
              thats why i built this solution.
            </strong>
          </p>
        </div>

        <div className="mt-8 w-full max-w-lg space-y-4 border-t border-border pt-8">
          <p className="text-lg text-muted-foreground">
            heres what it looks like.
          </p>

          <pre className="rounded-lg bg-card p-5 text-sm">
            <code>{starterCode}</code>
          </pre>

          <p className="text-lg text-muted-foreground">
            8 lines of code, and you can easily start logging critical events to
            our dashboard. heres what the event looks like.
          </p>

          <Event
            id="1"
            emailNotify={false}
            pushNotify={false}
            title="hello, world!"
            icon="👋"
            createdAt={new Date().toISOString()}
          />

          <p className="text-lg text-muted-foreground">
            or, are you selfhosting? no problem, just add the{" "}
            <strong>host</strong> variable to your initialisation function:
          </p>

          <pre className="rounded-lg bg-card p-5 text-sm">
            <code>{`const up = new Upstream({
  apiKey: "YOUR_API_KEY",
  host: "https://your.upstream-instance.com"
})`}</code>
          </pre>

          <p className="text-lg text-muted-foreground">
            need to add more details to the event? no problem. here is the code
            to add fields, and a description.
          </p>

          <pre className="rounded-lg bg-card p-5 text-sm">
            <code>{moreDetailedCode}</code>
          </pre>

          <p className="text-lg text-muted-foreground">
            now, the event is a dropdown!
          </p>

          <Event
            id="2"
            pushNotify={false}
            title="hello, world!"
            emailNotify={false}
            icon="👋"
            description="this is a more detailed event"
            fields={[
              {
                title: "this is a field",
                value: "you can add some info here",
              },
              {
                title: "this is another field",
                value: "you can add some more info here",
              },
            ]}
            createdAt={new Date().toISOString()}
          />

          <p className="text-lg text-muted-foreground">
            what if you need to trigger workflows or have actions for your
            events? no problem. Upstream has those features too. Simply add a{" "}
            <strong>category</strong> to the event and setup webhooks in the
            dashboard.
          </p>

          <p className="text-lg text-muted-foreground">
            oh, and theres event actions too.
          </p>

          <Event
            id="3"
            pushNotify={false}
            title="sophisticated event with actions"
            icon="🚨"
            emailNotify={false}
            category="important"
            actions={[
              {
                title: "View Google.com",
                variant: "primary",
                url: "https://google.com",
              },
              {
                title: "Go to Github.com",
                variant: "secondary",
                url: "https://github.com",
              },
              {
                title: "Do nothing",
                variant: "ghost",
                url: "#",
              },
            ]}
            createdAt={new Date().toISOString()}
          />

          <p className="text-lg text-muted-foreground">
            or, do you need to add stack traces to events? do you need push
            notifications to send important events direct to your phone?
            Upstream can do that too.
          </p>

          <pre className="rounded-lg bg-card p-5 text-sm">
            <code className="overflow-x-auto">{actionsCode}</code>
          </pre>

          <p className="text-lg text-muted-foreground">
            now you have a stack trace inside of an event with push
            notifications to your devices!
          </p>

          <Event
            id="4"
            pushNotify={true}
            title="This triggered a push notification!"
            icon="~"
            createdAt={new Date().toISOString()}
            events={[
              {
                title: "This triggered a notification inside the event!",
                icon: "🚨",
                id: "5",
                emailNotify: false,
                createdAt: new Date().toISOString(),
                pushNotify: true,
                data: {
                  test: "This is a test with contextId and data.",
                  contextId: "contextId-example-notifications",
                  contextStart: true,
                },
                actions: [
                  {
                    title: "View",
                    url: "https://upstream.dev",
                    variant: "primary",
                  },
                  {
                    title: "Dismiss",
                    url: "https://upstream.dev",
                    variant: "secondary",
                  },
                ],
              },
            ]}
            emailNotify={false}
          />

          <p className="text-lg text-muted-foreground">
            and here is a full example with all event fields into 1 log entry.
          </p>

          <Event
            id="8"
            pushNotify={true}
            title="checkout completed"
            emailNotify={false}
            icon="🛒"
            category="commerce"
            description="A user completed checkout for a subscription upgrade. This event chains the whole purchase flow as nested context events and triggers a push notification."
            contextId="context-8a2f9c1e"
            fields={[
              { title: "Customer", value: "linus@upstream.dev" },
              { title: "Plan", value: "Pro (monthly)" },
              { title: "Amount", value: "$19.00" },
              { title: "Invoice ID", value: "in_1QyXfK2eZvKYlo2C" },
              { title: "Payment Status", value: "succeeded" },
              { title: "IP Address", value: "203.0.113.24" },
            ]}
            actions={[
              {
                title: "View invoice",
                variant: "primary",
                url: "https://dashboard.stripe.com/invoices/in_1QyXfK2eZvKYlo2C",
              },
              {
                title: "View customer",
                variant: "secondary",
                url: "https://dashboard.stripe.com/customers/cus_9a2b3c4d",
              },
              {
                title: "Refund",
                variant: "ghost",
                url: "https://dashboard.stripe.com/refunds/new",
              },
            ]}
            data={{
              id: "evt_1QyXfK2eZvKYlo2C",
              object: "checkout.session.completed",
              amount_total: 1900,
              currency: "usd",
              payment_status: "paid",
              customer_email: "linus@upstream.dev",
              metadata: {
                plan: "pro",
                interval: "monthly",
                coupon: "LAUNCH50",
              },
              fraud_details: null,
            }}
            events={[
              {
                id: "9",
                pushNotify: false,
                emailNotify: false,
                title: "checkout session created",
                icon: "🛒",
                category: "commerce",
                createdAt: new Date().toISOString(),
              },
              {
                id: "10",
                pushNotify: false,
                title: "payment intent succeeded",
                icon: "💳",
                category: "commerce",
                emailNotify: false,
                fields: [
                  { title: "Status", value: "succeeded" },
                  { title: "Amount", value: "$19.00" },
                ],
                createdAt: new Date().toISOString(),
              },
              {
                id: "11",
                pushNotify: false,
                emailNotify: false,
                title: "webhook delivered",
                icon: "🔗",
                category: "commerce",
                description:
                  "checkout.session.completed delivered to /api/webhooks/stripe",
                fields: [
                  { title: "Endpoint", value: "/api/webhooks/stripe" },
                  { title: "Status", value: "200 OK" },
                ],
                data: {
                  id: "wh_3O1234567890",
                  type: "checkout.session.completed",
                  livemode: false,
                },
                events: [
                  {
                    id: "13",
                    pushNotify: false,
                    emailNotify: false,
                    title: "webhook: signature verified",
                    icon: "🔐",
                    category: "commerce",
                    description: "Signature verified before dispatch.",
                    fields: [{ title: "Attempt", value: "1 of 3" }],
                    createdAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
              },
              {
                id: "12",
                pushNotify: true,
                title: "license key provisioned",
                emailNotify: false,
                icon: "🔑",
                category: "commerce",
                description:
                  "New license issued to customer. Push notification sent.",
                fields: [
                  { title: "License", value: "UP-XXXX-XXXX-XXXX" },
                  { title: "Seats", value: "5" },
                ],
                actions: [
                  {
                    title: "View license",
                    variant: "primary",
                    url: "https://dashboard.upstream.dev/licenses/UP-XXXX-XXXX-XXXX",
                  },
                ],
                createdAt: new Date().toISOString(),
              },
            ]}
            createdAt={new Date().toISOString()}
          />

          <p className="mt-8 border-t border-border pt-6 text-lg text-muted-foreground">
            we are just scratching the surface. Upstream also has features like
            query APIs, a mobile app with pager and push notification features,
            and much more.
          </p>

          <p className="text-lg text-muted-foreground">
            i also built this to be completely open source, so you can go
            self-host it if you want.
          </p>

          <p className="text-lg text-muted-foreground">
            if you want to see more, check out the{" "}
            <Link
              href="https://github.com/linuskang/up/tree/v3/apps/playground"
              className="underline"
            >
              playground
            </Link>{" "}
            for more information. documentation is coming soon once i finish
            writing it.
          </p>

          <p className="mt-8 border-t border-border pt-6 text-lg text-muted-foreground">
            in case you still have questions:
          </p>

          <Accordion className="mt-5 max-w-lg border-none bg-card p-3">
            <AccordionItem value="differences" className="border-none">
              <AccordionTrigger className="text-base">
                What makes this different compared to others like Seq and
                Datadog?
              </AccordionTrigger>
              <AccordionContent>
                <div>
                  <p>
                    Seq and Datadog are designed for the product analytics
                    space. They ingest large volumes of events and provide
                    powerful querying capabilities & statistics for your
                    application.
                  </p>

                  <p className="mt-2">
                    Upstream is designed for critical SaSS events like audit
                    logs, signups, and other important events. We focus on
                    delivering a beautiful, intuitive experience for viewing and
                    querying your most important events on the fly. You can use
                    Upstream for your product&apos;s audit logs, triggering
                    workflows, and logging complex events.
                  </p>

                  <p className="mt-2">We have:</p>
                  <ul className="mt-2 list-disc pl-6">
                    <li>
                      Arguably the better UI for querying events on the go,
                      especially for mobile.
                    </li>
                    <li>Fully open source. Mod Upstream however you want.</li>
                    <li>
                      Actions, workflows, and contexts are our main
                      differentiators.
                    </li>
                    <li>
                      Built for easy integration with your apps, no complex
                      setup required.
                    </li>
                  </ul>
                  <p className="mt-2">
                    Upstream was built to easily view your most critical logs on
                    the fly, with a expressive interface. If you don&apos;t need
                    easy access to important product event logs, Upstream
                    isn&apos;t for you.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="usage" className="border-none">
              <AccordionTrigger className="text-base">
                Who is using Upstream?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Because Upstream is still extremely new, we don&apos;t have
                  any major public customers yet.
                </p>
                <p>
                  However, I&apos;ve personally been using it in production for
                  the past couple months because I got tired of having to carry
                  a laptop around to check events.
                </p>
                <p>
                  Additionally, I am also using it in production for all my
                  personal projects, and its been working great for my usecase.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sdk" className="border-none">
              <AccordionTrigger className="text-base">
                You don&apos;t have an SDK for my framework
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  We thought of that too! Since Upstream is still relatively
                  new, we&apos;re currently focused on building up the core
                  features for Upstream first. For now, we only support Node.js
                  via. npm.
                </p>

                <p className="mt-4">
                  If your language isn&apos;t supported by our SDKs, you can
                  still send events using our Ingestion API. See the{" "}
                  <Link href="/docs" className="underline">
                    docs
                  </Link>{" "}
                  for more details.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="selfhost" className="border-none">
              <AccordionTrigger className="text-base">
                Can I self-host Upstream?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Yes! Upstream is fully open source, and you can self-host it
                  if you want. We&apos;re currently working on a self-hosting
                  guide for Upstream, but for now, you can check out the github
                  for quick start guides.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="getstarted" className="border-none">
              <AccordionTrigger className="text-base">
                I&apos;m sold! How do I get started?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Cool! Register a free account{" "}
                  <Link
                    href="https://up.linus.my/register"
                    className="underline"
                  >
                    here
                  </Link>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="mt-6 text-lg text-muted-foreground">
            thats it. go try it out!
          </p>

          <Button
            size="lg"
            className="w-full gap-2 text-sm font-semibold sm:w-auto"
          >
            <Link href="https://up.linus.my/register" target="_blank">
              Create a free account
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
