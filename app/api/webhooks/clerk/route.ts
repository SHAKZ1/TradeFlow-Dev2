import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
 
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }

  const eventType = evt.type;
 
  // HANDLE USER CREATION
  if (eventType === 'user.created') {
    const { id, email_addresses, phone_numbers, first_name, last_name, image_url } = evt.data;
    
    // Get primary email
    const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id)?.email_address || email_addresses[0]?.email_address;
    
    // Get primary phone (if exists)
    const primaryPhone = phone_numbers.find(p => p.id === evt.data.primary_phone_number_id)?.phone_number || phone_numbers[0]?.phone_number;

    if (primaryEmail) {
        await db.user.create({
          data: {
            id: id,
            email: primaryEmail,
            phone: primaryPhone || null,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
          }
        });
    }
  }

  // HANDLE USER UPDATE (If they change profile in Clerk)
  if (eventType === 'user.updated') {
    const { id, email_addresses, phone_numbers, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id)?.email_address;
    const primaryPhone = phone_numbers.find(p => p.id === evt.data.primary_phone_number_id)?.phone_number;

    if (primaryEmail) {
        await db.user.update({
            where: { id: id },
            data: {
                email: primaryEmail,
                phone: primaryPhone || null,
                firstName: first_name,
                lastName: last_name,
                imageUrl: image_url,
            }
        });
    }
  }
 
  return new Response('', { status: 200 });
}