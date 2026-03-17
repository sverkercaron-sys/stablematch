"use server";

import { revalidatePath } from "next/cache";

import { createServiceSupabaseClient } from "@/lib/supabase";

export async function submitInquiry(formData: FormData) {
  const payload = {
    facility_id: String(formData.get("facilityId") ?? ""),
    facility_name: String(formData.get("facilityName") ?? ""),
    applicant_name: String(formData.get("applicantName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    horse_name: String(formData.get("horseName") ?? ""),
    horse_age: String(formData.get("horseAge") ?? ""),
    message: String(formData.get("message") ?? "")
  };

  const supabase = createServiceSupabaseClient();

  if (supabase) {
    await supabase.from("applications").insert(payload);
  } else {
    console.log("Inquiry payload", payload);
  }

  revalidatePath("/");
}

export async function submitClaim(formData: FormData) {
  const payload = {
    facility_id: String(formData.get("facilityId") ?? ""),
    claimant_name: String(formData.get("claimantName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
    note: String(formData.get("note") ?? ""),
    status: "pending"
  };

  const supabase = createServiceSupabaseClient();

  if (supabase) {
    await supabase.from("claims").insert(payload);
  } else {
    console.log("Claim payload", payload);
  }

  revalidatePath("/");
}
