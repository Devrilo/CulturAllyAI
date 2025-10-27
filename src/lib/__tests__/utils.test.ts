import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn utility function", () => {
  it("should merge single class name", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("should merge multiple class names", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes with clsx", () => {
    const isHidden = false;
    const isActive = true;
    expect(cn("base-class", isHidden && "hidden", "visible-class")).toBe("base-class visible-class");
    expect(cn("base-class", isActive && "active")).toBe("base-class active");
  });

  it("should handle undefined and null values", () => {
    expect(cn("text-red-500", undefined, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    expect(cn("text-red-500", null, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle empty strings", () => {
    expect(cn("", "text-red-500")).toBe("text-red-500");
    expect(cn("text-red-500", "")).toBe("text-red-500");
  });

  it("should merge conflicting Tailwind classes correctly", () => {
    // twMerge should keep the last conflicting class
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["text-red-500", "bg-blue-500"])).toBe("text-red-500 bg-blue-500");
  });

  it("should handle objects with conditional classes", () => {
    expect(cn({ "text-red-500": true, "bg-blue-500": false })).toBe("text-red-500");
    expect(cn({ "text-red-500": false, "bg-blue-500": true })).toBe("bg-blue-500");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base-class",
      {
        "active-class": true,
        "inactive-class": false,
      },
      ["array-class-1", "array-class-2"],
      undefined,
      "final-class"
    );

    expect(result).toBe("base-class active-class array-class-1 array-class-2 final-class");
  });

  it("should handle no arguments", () => {
    expect(cn()).toBe("");
  });

  it("should deduplicate identical classes", () => {
    expect(cn("text-red-500", "text-red-500")).toBe("text-red-500");
  });

  it("should handle Tailwind modifiers correctly", () => {
    expect(cn("hover:text-red-500", "hover:text-blue-500")).toBe("hover:text-blue-500");
    expect(cn("dark:bg-gray-800", "dark:bg-gray-900")).toBe("dark:bg-gray-900");
  });

  it("should preserve non-conflicting classes with modifiers", () => {
    expect(cn("text-red-500", "hover:text-blue-500")).toBe("text-red-500 hover:text-blue-500");
    expect(cn("bg-white", "dark:bg-gray-800")).toBe("bg-white dark:bg-gray-800");
  });

  it("should handle responsive classes correctly", () => {
    expect(cn("text-sm", "md:text-lg", "lg:text-xl")).toBe("text-sm md:text-lg lg:text-xl");
    expect(cn("px-2", "md:px-4", "px-6")).toBe("md:px-4 px-6");
  });

  it("should work with arbitrary values", () => {
    expect(cn("w-[123px]", "w-[456px]")).toBe("w-[456px]");
    expect(cn("bg-[#ff0000]", "bg-[#00ff00]")).toBe("bg-[#00ff00]");
  });

  it("should handle whitespace correctly", () => {
    expect(cn("  text-red-500  ", "  bg-blue-500  ")).toBe("text-red-500 bg-blue-500");
  });
});
