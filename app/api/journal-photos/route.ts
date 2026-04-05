import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/journal-photos — upload a photo to the private journal-photos bucket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const experimentId = formData.get("experimentId") as string | null;

    if (!file || !experimentId) {
      return NextResponse.json({ error: "file and experimentId required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${user.id}/${experimentId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("journal-photos")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    // Generate a signed URL (valid for 1 year for display)
    const { data: signedData } = await supabase.storage
      .from("journal-photos")
      .createSignedUrl(fileName, 365 * 24 * 60 * 60);

    return NextResponse.json({
      path: fileName,
      url: signedData?.signedUrl ?? "",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
