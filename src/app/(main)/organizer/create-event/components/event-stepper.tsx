import { Check } from "lucide-react";
import { cn } from "~/utils";

interface EventStepperProps {
  steps: string[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const EventStepper = ({
  steps,
  currentStep,
  setCurrentStep,
}: EventStepperProps) => {
  return (
    <div className="flex flex-col items-start md:flex-row md:items-center gap-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div
            key={step}
            className="flex-1 group w-full cursor-pointer"
            onClick={() => setCurrentStep(stepNumber)}
          >
            <div className="flex items-center">
              {/* Circle with number/icon */}
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold transition-colors duration-300",
                  {
                    "bg-red-600 text-white": isCompleted || isCurrent,
                    "bg-gray-200 text-gray-500 group-hover:bg-gray-300":
                      isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <span className="text-base">{stepNumber}</span>
                )}
              </div>

              {/* Step name */}
              <p
                className={cn(
                  "ml-3 text-base font-medium transition-colors duration-300",
                  {
                    "text-red-600": isCurrent,
                    "text-gray-900": isCompleted,
                    "text-gray-500 group-hover:text-gray-700": isUpcoming,
                  }
                )}
              >
                {step}
              </p>
            </div>

            {/* Underline for current step */}
            <div
              className={cn(
                "mt-2 h-1 rounded-full transition-all duration-300",
                isCurrent ? "bg-red-600 w-full" : "bg-transparent w-0"
              )}
            ></div>
          </div>
        );
      })}
    </div>
  );
};
