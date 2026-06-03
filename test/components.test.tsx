import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CoursePlayer } from "../src/components/CoursePlayer";
import { QuizView } from "../src/components/QuizView";
import { sampleCourse } from "../src/data/course";

const quiz = sampleCourse.modules[0]!.lessons[1]!.quiz!;

describe("QuizView", () => {
  it("warns about unanswered questions, then grades with partial credit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuizView quiz={quiz} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("Parameterised queries"));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByText("Please answer this question.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText("Least-privilege DB user"));
    await user.click(screen.getByRole("button", { name: "Submit anyway" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ score: 0.75, passed: true }));
    expect(screen.getByText(/Partly correct \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("is operable with the keyboard alone", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuizView quiz={quiz} onSubmit={onSubmit} />);
    await user.tab(); // first radio group
    await user.keyboard("{ArrowDown}"); // selects option 2 ("Parameterised queries")
    expect(screen.getByLabelText("Parameterised queries")).toBeChecked();
  });

  it("offers a retry after failing", async () => {
    const user = userEvent.setup();
    render(<QuizView quiz={quiz} onSubmit={() => {}} />);
    await user.click(screen.getByLabelText("Escaping quotes"));
    await user.click(screen.getByLabelText("Running as superuser"));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByLabelText("Escaping quotes")).not.toBeChecked();
  });
});

describe("CoursePlayer", () => {
  it("gates completion on the quiz, tracks progress and persists it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CoursePlayer course={sampleCourse} />);

    expect(screen.getByRole("heading", { level: 2, name: "What is SQL injection?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "27"); // 8 of 30 min

    // Quiz lesson: completion disabled until the quiz is passed.
    expect(screen.getByRole("button", { name: "Mark complete" })).toBeDisabled();
    await user.click(screen.getByLabelText("Parameterised queries"));
    await user.click(screen.getByLabelText("Least-privilege DB user"));
    await user.click(screen.getByLabelText("Row Level Security"));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    await user.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "67");

    unmount();
    render(<CoursePlayer course={sampleCourse} />);
    expect(screen.getByRole("heading", { level: 2, name: "Cookies done right" })).toBeInTheDocument(); // resumed
    const outline = screen.getByRole("navigation", { name: "Course outline" });
    expect(within(outline).getAllByText(/\(completed\)/)).toHaveLength(2);
  });

  it("survives corrupt saved progress", () => {
    localStorage.setItem("learnhub:web-security-101:progress", "{not json");
    render(<CoursePlayer course={sampleCourse} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("supports Alt+Arrow lesson navigation", async () => {
    const user = userEvent.setup();
    render(<CoursePlayer course={sampleCourse} />);
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(screen.getByRole("heading", { level: 2, name: "Defences in depth" })).toBeInTheDocument();
  });

  it("turns missed questions into review cards", async () => {
    const user = userEvent.setup();
    render(<CoursePlayer course={sampleCourse} now={() => 1000} />);
    await user.click(screen.getByRole("button", { name: /Defences in depth/ }));
    await user.click(screen.getByLabelText("Parameterised queries"));
    await user.click(screen.getByLabelText("Least-privilege DB user"));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    const cards = JSON.parse(localStorage.getItem("learnhub:web-security-101:cards")!);
    expect(cards.map((c: { id: string }) => c.id)).toEqual(["q2"]);
  });
});
