"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { findAppUserId } from "@/infrastructure/current-user";
import { database } from "@/infrastructure/database";

export async function savePrompt(prompt: string, description?: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Sign in to manage prompts");
  const userId = await findAppUserId(clerkId);
  if (!userId) throw new Error("Sign in to save prompts");
  const value = prompt.trim();
  if (!value || value.length > 20000)
    throw new Error("Prompt must be between 1 and 20,000 characters");
  const saved = await database().savedPrompt.create({
    data: { userId, prompt: value, description: description?.trim() || null },
  });
  revalidatePath("/prompts");
  return saved;
}

export async function listSavedPrompts() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Sign in to manage prompts");
  const userId = await findAppUserId(clerkId);
  if (!userId) return [];
  return database().savedPrompt.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, prompt: true, description: true, updatedAt: true },
  });
}

export async function deleteSavedPrompt(id: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Sign in to manage prompts");
  const userId = await findAppUserId(clerkId);
  if (!userId) throw new Error("Sign in to manage prompts");
  await database().savedPrompt.deleteMany({ where: { id, userId } });
  revalidatePath("/prompts");
}
