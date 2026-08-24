import type { ReactNode } from "react";
import { Text, View } from "react-native";

import PageScaffold from "../components/PageScaffold";
import Card from "../components/ui/Card";

const CONTACT_EMAIL = "bubba7xallahan@gmail.com";
const LAST_UPDATED = "August 24, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-xs">
      <Text className="text-base font-bold text-text">{title}</Text>
      <Text className="text-sm leading-[21px] text-textMuted">{children}</Text>
    </View>
  );
}

// Publicly reachable without signing in (see the isPublicLegalPage
// exemption in app/_layout.tsx) - Play/App Store reviewers and
// prospective users need to read this before, or without, creating an
// account. Content describes what this app actually does today: no ad
// SDK, no analytics/tracking SDK, no third-party data sale - update
// this if that ever changes.
export default function PrivacyPolicy() {
  return (
    <PageScaffold title="Privacy Policy" subtitle={`Last updated ${LAST_UPDATED}`} narrow>
      <Card gap="md">
        <Section title="What this app is">
          ThinkTwice is a personal budgeting and fuel-cost planning app. It helps you track income,
          expenses, and vehicle fuel costs, and forecasts your upcoming spending based on the
          numbers you enter.
        </Section>

        <Section title="Information we collect">
          Account information: when you sign in, we collect your email address, display name, and
          profile photo (if you sign in with Google) through Firebase Authentication.{"\n\n"}
          Budget and vehicle data you enter: income, expenses, fixed costs, vehicle details, fuel
          prices, mileage, and fill-up history. This is data you type into the app yourself - we
          don’t infer or purchase it from anywhere else.{"\n\n"}
          We do not collect your location, contacts, photos (beyond an optional Google profile
          picture), or any device data beyond what’s needed to run the app.
        </Section>

        <Section title="How we use this information">
          Your account identifies which budget and vehicle data belongs to you. The numbers you
          enter are used only to calculate the forecasts and summaries the app shows you - your
          projected monthly balance, fuel cost estimates, and similar figures. We don’t use your
          data for advertising, and we don’t build a profile of you for any purpose beyond running
          the app’s own features.
        </Section>

        <Section title="Who we share it with">
          We don’t sell your data or share it with advertisers. Your data is processed by the
          service providers that run the app: Firebase (Google) for authentication, and a
          Google Cloud-hosted database and forecasting service that we operate ourselves. No
          third party receives your budget or vehicle data for their own purposes.
        </Section>

        <Section title="Advertising and analytics">
          This app has no advertising SDK and no analytics or tracking SDK. Nothing about your use
          of the app is sold or shared for advertising purposes, because no such sharing exists in
          the first place.
        </Section>

        <Section title="Data retention and deletion">
          Your account and budget data are kept until you ask us to delete them. To request
          deletion of your account and all associated data, email us at the address below - we’ll
          confirm once it’s done.
        </Section>

        <Section title="Children’s privacy">
          ThinkTwice is not directed at children under 13, and we don’t knowingly collect
          information from them.
        </Section>

        <Section title="Changes to this policy">
          If this policy changes in a way that affects how your data is handled, we’ll update the
          date at the top of this page.
        </Section>

        <Section title="Contact us">
          {`Questions about this policy or your data? Email ${CONTACT_EMAIL}.`}
        </Section>
      </Card>
    </PageScaffold>
  );
}
