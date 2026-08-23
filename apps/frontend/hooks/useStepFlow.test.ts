import { act, renderHook } from "@testing-library/react-native";

import { useStepFlow, type StepFlowStepConfig } from "./useStepFlow";

type StepKey = "name" | "email" | "phone";

const steps: StepFlowStepConfig<StepKey>[] = [
  { key: "name", title: "Name", hint: "Your name" },
  { key: "email", title: "Email", hint: "Your email" },
  { key: "phone", title: "Phone", hint: "Your phone number" },
];

// This RTL version's renderHook/act are both async (they return
// Promises even for synchronous callbacks), so every call is awaited to
// avoid overlapping act() warnings and to ensure state updates have
// flushed before assertions run.

describe("useStepFlow", () => {
  it("starts inactive, with no active step", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    expect(result.current.activeStep).toBeNull();
    expect(result.current.draft).toBe("");
  });

  it("starts a flow at the first step, seeding the draft from initial values", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    await act(() => {
      result.current.start({ name: "Ada", email: "", phone: "" });
    });

    expect(result.current.activeStep?.key).toBe("name");
    expect(result.current.draft).toBe("Ada");
    expect(result.current.isLastStep).toBe(false);
  });

  it("advances to the next step on confirmStep, seeding its draft from initial values", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    await act(() => {
      result.current.start({ name: "", email: "pre-filled@example.com", phone: "" });
    });
    await act(() => {
      result.current.setDraft("Ada");
    });
    await act(async () => {
      await result.current.confirmStep();
    });

    expect(result.current.activeStep?.key).toBe("email");
    expect(result.current.draft).toBe("pre-filled@example.com");
    expect(result.current.isLastStep).toBe(false);
  });

  it("calls onStepConfirmed with the trimmed value as each step is confirmed", async () => {
    const onStepConfirmed = jest.fn();
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onStepConfirmed, onComplete }));

    await act(() => {
      result.current.start({ name: "", email: "", phone: "" });
    });
    await act(() => {
      result.current.setDraft("  Ada Lovelace  ");
    });
    await act(async () => {
      await result.current.confirmStep();
    });

    expect(onStepConfirmed).toHaveBeenCalledWith("name", "Ada Lovelace");
  });

  it("reports isLastStep once on the final step", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    await act(() => {
      result.current.start({ name: "", email: "", phone: "" });
    });

    await act(() => {
      result.current.setDraft("Ada");
    });
    await act(async () => {
      await result.current.confirmStep();
    });

    await act(() => {
      result.current.setDraft("ada@example.com");
    });
    await act(async () => {
      await result.current.confirmStep();
    });

    expect(result.current.activeStep?.key).toBe("phone");
    expect(result.current.isLastStep).toBe(true);
  });

  it("calls onComplete with every step's final trimmed value once the last step is confirmed, and closes the flow", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    await act(() => {
      result.current.start({ name: "", email: "", phone: "" });
    });

    const values = ["Ada Lovelace", "ada@example.com", "555-0100"];
    for (const value of values) {
      // eslint-disable-next-line no-await-in-loop
      await act(() => {
        result.current.setDraft(value);
      });
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await result.current.confirmStep();
      });
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0100",
    });
    // The flow closes itself once the last step is confirmed.
    expect(result.current.activeStep).toBeNull();
    expect(result.current.draft).toBe("");
  });

  it("close() resets to inactive without calling onComplete", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onComplete }));

    await act(() => {
      result.current.start({ name: "", email: "", phone: "" });
    });
    await act(() => {
      result.current.setDraft("Ada");
    });
    await act(() => {
      result.current.close();
    });

    expect(result.current.activeStep).toBeNull();
    expect(result.current.draft).toBe("");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("confirmStep is a no-op when no flow is active", async () => {
    const onComplete = jest.fn();
    const onStepConfirmed = jest.fn();
    const { result } = await renderHook(() => useStepFlow({ steps, onStepConfirmed, onComplete }));

    await act(async () => {
      await result.current.confirmStep();
    });

    expect(onStepConfirmed).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.activeStep).toBeNull();
  });
});
