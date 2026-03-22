/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Propopad verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://fegjortfpzptkztemmgl.supabase.co/storage/v1/object/public/agency-logos/email/propopad-logo.svg"
          width="40"
          height="40"
          alt="Propopad"
          style={{ marginBottom: '24px', borderRadius: '8px' }}
        />
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(24, 28%, 13%)',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: 'hsl(24, 8%, 68%)', margin: '30px 0 0' }
