"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditPage() {
  const { id } = useParams();
  const router = useRouter();
  const eventId = id as string;

  useEffect(() => {
    if (eventId) {
      router.push(`/organizer/create-event?edit=${eventId}`);
    } else {
      router.push("/organizer/manage");
    }
  }, [eventId, router]);

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Đang chuyển hướng...</p>
    </div>
  );
}
