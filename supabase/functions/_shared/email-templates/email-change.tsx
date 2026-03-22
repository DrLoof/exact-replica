/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for Propopad</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://fegjortfpzptkztemmgl.supabase.co/storage/v1/object/public/agency-logos/email/propopad-logo.svg"
          width="40"
          height="40"
          alt="Propopad"
          style={{ marginBottom: '24px', borderRadius: '8px' }}
        />
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your Propopad email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Satoshi', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(24, 28%, 13%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(24, 8%, 49%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(24, 28%, 13%)',
  color: 'hsl(40, 20%, 98%)',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(24, 8%, 68%)', margin: '30px 0 0' }
