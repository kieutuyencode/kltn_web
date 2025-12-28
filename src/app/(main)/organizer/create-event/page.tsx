"use client";
import { EventStepper, Step1, Step2 } from "./components";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const steps = ["Thông tin sự kiện", "Thời gian & Loại vé"];

function CreateEventContent() {
  const searchParams = useSearchParams();
  const editEventId = searchParams.get("edit");
  const [currentStep, setCurrentStep] = useState(1);
  const [eventId, setEventId] = useState<number | undefined>(
    editEventId ? parseInt(editEventId) : undefined
  );

  useEffect(() => {
    if (editEventId) {
      setEventId(parseInt(editEventId));
    }
  }, [editEventId]);

  const handleEventCreated = (id: number) => {
    setEventId(id);
    setCurrentStep(2);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            key={`step1-${eventId}-${currentStep}`}
            eventId={eventId}
            onNext={handleEventCreated}
          />
        );
      case 2:
        return (
          <Step2 key={`step2-${eventId}-${currentStep}`} eventId={eventId} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <EventStepper
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />

      <div className="mt-4">{renderStep()}</div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEventContent />
    </Suspense>
  );
}
