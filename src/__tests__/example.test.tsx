import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";

/**
 * Example Unit Test
 * Demonstrates Vitest setup with React Testing Library
 */

// Example component to test
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

describe("Counter Component", () => {
  it("renders with initial count of 0", () => {
    // Arrange & Act
    render(<Counter />);

    // Assert
    expect(screen.getByRole("heading")).toHaveTextContent("Count: 0");
  });

  it("increments count when button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Counter />);

    // Act
    await user.click(screen.getByRole("button", { name: /increment/i }));

    // Assert
    expect(screen.getByRole("heading")).toHaveTextContent("Count: 1");
  });
});

// Example service function to test
export function calculateTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

describe("calculateTotal", () => {
  it("returns 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("calculates total correctly", () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateTotal(items)).toBe(35);
  });
});

// Example mock test
describe("Mock Examples", () => {
  it("demonstrates vi.fn() usage", () => {
    const mockFn = vi.fn();
    mockFn("test");

    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("demonstrates vi.spyOn() usage", () => {
    const obj = { method: () => "original" };
    const spy = vi.spyOn(obj, "method");

    obj.method();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
