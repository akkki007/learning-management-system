import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = req.headers;
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      await dbConnect();

      const { id, email_addresses, first_name, last_name, username } = evt.data;
      const email = email_addresses[0]?.email_address;

      // Check if user already exists (to avoid duplicates)
      const existingUser = await User.findOne({ clerkId: id });

      if (!existingUser) {
        // Create a basic user profile - they'll complete it later
        const newUser = await User.create({
          clerkId: id,
          email: email || "",
          username: username || `${first_name || "User"}_${id.slice(-6)}`,
          education: "", // Will be filled in complete-profile
          career: "", // Will be filled in complete-profile
          languagesKnown: [], // Will be filled in complete-profile
        });

        console.log("User created via webhook:", newUser);
      } else {
        console.log("User already exists:", existingUser);
      }
    } catch (error) {
      console.error("Error in webhook user creation:", error);
      // Don't return error response as it might cause Clerk to retry
      // The APIs will handle user creation as fallback
    }
  }

  return new Response("", { status: 200 });
}
