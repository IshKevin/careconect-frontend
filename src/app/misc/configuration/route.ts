import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      appName: 'IsanoMed',
      supportEmail: 'support@careconnect.demo',
      timezone: 'Africa/Kigali',
      sessionTimeoutMins: 30,
      systemMaintenance: false,
      maintenanceMessage: '',
      allowSelfSignup: true,
      emailNotifications: true,
      smsNotifications: false,
      version: '1.0.0-demo',
      updatedAt: new Date().toISOString(),
    },
  });
}
