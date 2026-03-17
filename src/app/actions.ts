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

export async function reviewFacility(formData: FormData) {
  const facilityId = String(formData.get("facilityId") ?? "");
  const action = String(formData.get("actionType") ?? "");
  const supabase = createServiceSupabaseClient();

  if (!facilityId || !supabase) {
    return;
  }

  if (action === "approve") {
    await supabase
      .from("facilities")
      .update({ status: "verified", is_active: true })
      .eq("id", facilityId);
  }

  if (action === "deactivate") {
    await supabase.from("facilities").update({ is_active: false }).eq("id", facilityId);
  }

  if (action === "restore") {
    await supabase.from("facilities").update({ is_active: true }).eq("id", facilityId);
  }

  revalidatePath("/admin/review");
  revalidatePath("/");
}

export async function updateFacilityFromReview(formData: FormData) {
  const facilityId = String(formData.get("facilityId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const facilityType = String(formData.get("facilityType") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const supabase = createServiceSupabaseClient();

  if (!facilityId || !supabase || !name || !facilityType) {
    return;
  }

  await supabase
    .from("facilities")
    .update({
      name: name.slice(0, 160),
      facility_type: facilityType.slice(0, 64),
      address: address ? address.slice(0, 240) : "Adress saknas",
      description_short: description.slice(0, 280)
    })
    .eq("id", facilityId);

  revalidatePath("/admin/review");
  revalidatePath("/");
}

function createPairKey(leftId: string, rightId: string) {
  return [leftId, rightId].sort().join(":");
}

export async function resolveDuplicate(formData: FormData) {
  const actionType = String(formData.get("actionType") ?? "");
  const primaryId = String(formData.get("primaryId") ?? "");
  const secondaryId = String(formData.get("secondaryId") ?? "");
  const winnerId = String(formData.get("winnerId") ?? "");
  const supabase = createServiceSupabaseClient();

  if (!supabase || !primaryId || !secondaryId) {
    return;
  }

  const pairKey = createPairKey(primaryId, secondaryId);

  if (actionType === "not_duplicate") {
    await supabase.from("duplicate_decisions").upsert(
      {
        pair_key: pairKey,
        left_facility_id: primaryId,
        right_facility_id: secondaryId,
        decision: "not_duplicate",
        winner_facility_id: null
      },
      { onConflict: "pair_key" }
    );
  }

  if (actionType === "merge" && winnerId) {
    const loserId = winnerId === primaryId ? secondaryId : primaryId;

    const { data: winner } = await supabase
      .from("facilities")
      .select("name")
      .eq("id", winnerId)
      .maybeSingle();

    await supabase.from("duplicate_decisions").upsert(
      {
        pair_key: pairKey,
        left_facility_id: primaryId,
        right_facility_id: secondaryId,
        decision: "merged",
        winner_facility_id: winnerId
      },
      { onConflict: "pair_key" }
    );

    await supabase.from("claims").update({ facility_id: winnerId }).eq("facility_id", loserId);
    await supabase
      .from("applications")
      .update({
        facility_id: winnerId,
        facility_name: winner?.name ?? "Merged facility"
      })
      .eq("facility_id", loserId);

    await supabase
      .from("facilities")
      .update({ is_active: false })
      .eq("id", loserId);
  }

  revalidatePath("/admin/duplicates");
  revalidatePath("/admin/review");
  revalidatePath("/");
}
