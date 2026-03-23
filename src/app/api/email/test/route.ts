import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addGmailAccount, removeGmailAccount, listGmailAccounts } from "@/lib/email/gmail-imap";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { email, appPassword, label } = await req.json();
  if (!email || !appPassword) return NextResponse.json({ error: "Email and app password required" }, { status: 400 });

  const result = await addGmailAccount(userId, email, appPassword, label);
  return NextResponse.json(result);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const accounts = await listGmailAccounts(userId);
  return NextResponse.json({ accounts });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { email } = await req.json();
  await removeGmailAccount(userId, email);
  return NextResponse.json({ success: true });
}
