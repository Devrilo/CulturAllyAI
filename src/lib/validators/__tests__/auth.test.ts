import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  deleteAccountSchema,
  authActivitySchema,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../auth";

describe("emailSchema", () => {
  it("should accept valid email addresses", () => {
    expect(emailSchema.parse("user@example.com")).toBe("user@example.com");
    expect(emailSchema.parse("test.user+tag@example.co.uk")).toBe("test.user+tag@example.co.uk");
    expect(emailSchema.parse("user@domain.com")).toBe("user@domain.com");
  });

  it("should reject empty email", () => {
    expect(() => emailSchema.parse("")).toThrow("Email jest wymagany");
  });

  it("should reject invalid email format", () => {
    expect(() => emailSchema.parse("invalid")).toThrow("Nieprawidłowy format email");
    expect(() => emailSchema.parse("@example.com")).toThrow("Nieprawidłowy format email");
    expect(() => emailSchema.parse("user@")).toThrow("Nieprawidłowy format email");
    expect(() => emailSchema.parse("user@.com")).toThrow("Nieprawidłowy format email");
  });

  it("should reject email exceeding 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com"; // 256 characters total
    expect(() => emailSchema.parse(longEmail)).toThrow("Email nie może być dłuższy niż 255 znaków");
  });
});

describe("passwordSchema", () => {
  it("should accept valid passwords", () => {
    expect(passwordSchema.parse("password1")).toBe("password1");
    expect(passwordSchema.parse("MyPass123")).toBe("MyPass123");
    expect(passwordSchema.parse("a1b2c3d4")).toBe("a1b2c3d4");
    expect(passwordSchema.parse("StrongP@ssw0rd!")).toBe("StrongP@ssw0rd!");
  });

  it("should reject password shorter than 8 characters", () => {
    expect(() => passwordSchema.parse("Pass1")).toThrow("Hasło musi mieć minimum 8 znaków");
    expect(() => passwordSchema.parse("abc123")).toThrow("Hasło musi mieć minimum 8 znaków");
  });

  it("should reject password exceeding 128 characters", () => {
    const longPassword = "a1" + "b".repeat(127); // 129 characters
    expect(() => passwordSchema.parse(longPassword)).toThrow("Hasło nie może być dłuższe niż 128 znaków");
  });

  it("should reject password without letters", () => {
    expect(() => passwordSchema.parse("12345678")).toThrow("Hasło musi zawierać przynajmniej jedną literę");
  });

  it("should reject password without numbers", () => {
    expect(() => passwordSchema.parse("password")).toThrow("Hasło musi zawierać przynajmniej jedną cyfrę");
  });
});

describe("loginSchema", () => {
  it("should accept valid login credentials", () => {
    const result = loginSchema.parse({
      email: "user@example.com",
      password: "anypassword",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: "anypassword",
    });
  });

  it("should reject invalid email", () => {
    expect(() =>
      loginSchema.parse({
        email: "invalid-email",
        password: "password",
      })
    ).toThrow("Nieprawidłowy format email");
  });

  it("should reject empty password", () => {
    expect(() =>
      loginSchema.parse({
        email: "user@example.com",
        password: "",
      })
    ).toThrow("Hasło jest wymagane");
  });

  it("should reject missing fields", () => {
    expect(() => loginSchema.parse({ email: "user@example.com" })).toThrow();
    expect(() => loginSchema.parse({ password: "password" })).toThrow();
  });
});

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.parse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
  });

  it("should reject when passwords do not match", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "different123",
      })
    ).toThrow("Hasła muszą być identyczne");
  });

  it("should reject weak password", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "weak",
        confirmPassword: "weak",
      })
    ).toThrow("Hasło musi mieć minimum 8 znaków");
  });

  it("should reject password without letter", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      })
    ).toThrow("Hasło musi zawierać przynajmniej jedną literę");
  });

  it("should reject password without number", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "password",
        confirmPassword: "password",
      })
    ).toThrow("Hasło musi zawierać przynajmniej jedną cyfrę");
  });

  it("should reject empty confirmPassword", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "",
      })
    ).toThrow("Potwierdzenie hasła jest wymagane");
  });
});

describe("changePasswordSchema", () => {
  it("should accept valid password change data", () => {
    const result = changePasswordSchema.parse({
      currentPassword: "oldPass123",
      newPassword: "newPass456",
      confirmPassword: "newPass456",
    });

    expect(result).toEqual({
      currentPassword: "oldPass123",
      newPassword: "newPass456",
      confirmPassword: "newPass456",
    });
  });

  it("should reject when new password and confirmation do not match", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "oldPass123",
        newPassword: "newPass456",
        confirmPassword: "different789",
      })
    ).toThrow("Hasła muszą być identyczne");
  });

  it("should reject when new password is same as current password", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "samePass123",
        newPassword: "samePass123",
        confirmPassword: "samePass123",
      })
    ).toThrow("Nowe hasło musi być inne niż obecne");
  });

  it("should reject weak new password", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "oldPass123",
        newPassword: "weak",
        confirmPassword: "weak",
      })
    ).toThrow("Hasło musi mieć minimum 8 znaków");
  });

  it("should reject empty current password", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "",
        newPassword: "newPass456",
        confirmPassword: "newPass456",
      })
    ).toThrow("Aktualne hasło jest wymagane");
  });
});

describe("deleteAccountSchema", () => {
  it("should accept valid account deletion data", () => {
    const result = deleteAccountSchema.parse({
      password: "password123",
      confirmDeletion: true,
    });

    expect(result).toEqual({
      password: "password123",
      confirmDeletion: true,
    });
  });

  it("should reject when confirmDeletion is false", () => {
    expect(() =>
      deleteAccountSchema.parse({
        password: "password123",
        confirmDeletion: false,
      })
    ).toThrow("Musisz potwierdzić usunięcie konta");
  });

  it("should reject empty password", () => {
    expect(() =>
      deleteAccountSchema.parse({
        password: "",
        confirmDeletion: true,
      })
    ).toThrow("Hasło jest wymagane do potwierdzenia");
  });

  it("should reject missing confirmDeletion", () => {
    expect(() =>
      deleteAccountSchema.parse({
        password: "password123",
      })
    ).toThrow();
  });
});

describe("authActivitySchema", () => {
  it("should accept valid action types", () => {
    const actionTypes = ["login", "logout", "account_created", "password_changed", "account_deleted"] as const;

    actionTypes.forEach((action) => {
      const result = authActivitySchema.parse({ action_type: action });
      expect(result.action_type).toBe(action);
    });
  });

  it("should accept optional metadata", () => {
    const result = authActivitySchema.parse({
      action_type: "login",
      metadata: { ip: "192.168.1.1", userAgent: "Mozilla" },
    });

    expect(result.metadata).toEqual({ ip: "192.168.1.1", userAgent: "Mozilla" });
  });

  it("should reject invalid action type", () => {
    expect(() =>
      authActivitySchema.parse({
        action_type: "invalid_action",
      })
    ).toThrow();
  });
});

describe("calculatePasswordStrength", () => {
  it("should return 0 for empty password", () => {
    expect(calculatePasswordStrength("")).toBe(0);
  });

  it("should return 1 for short password with only basic requirements", () => {
    expect(calculatePasswordStrength("abc12")).toBe(1); // 5 chars, has lowercase, has number = 1 point
  });

  it("should return 2 for 8+ char password with numbers only", () => {
    expect(calculatePasswordStrength("password1")).toBe(2); // 8+ chars (1) + number (1) = 2
  });

  it("should return 3 for 8+ char password with mixed case and numbers", () => {
    expect(calculatePasswordStrength("Password1")).toBe(3); // 8+ chars (1) + mixed case (1) + number (1) = 3
  });

  it("should return 4 for 12+ char password with mixed case and numbers", () => {
    expect(calculatePasswordStrength("Password12345")).toBe(4); // 12+ chars (2) + mixed case (1) + number (1) = 4
  });

  it("should return 4 for strong password with all character types", () => {
    expect(calculatePasswordStrength("P@ssw0rd1234")).toBe(4); // 12+ chars, mixed case, number, special
    expect(calculatePasswordStrength("MyStr0ng!Pass")).toBe(4);
  });

  it("should cap score at 4 even for very strong passwords", () => {
    expect(calculatePasswordStrength("VeryStr0ng!P@ssw0rd!123")).toBe(4);
  });

  it("should handle passwords with only lowercase and numbers", () => {
    expect(calculatePasswordStrength("password1")).toBe(2); // 8+ chars, number (no mixed case)
  });

  it("should handle passwords with special characters", () => {
    expect(calculatePasswordStrength("password123!")).toBe(4); // 8+ chars (1) + 12+ (1) + number (1) + special (1) = 4
  });
});

describe("getPasswordStrengthLabel", () => {
  it("should return correct label for each score", () => {
    expect(getPasswordStrengthLabel(0)).toBe("Bardzo słabe");
    expect(getPasswordStrengthLabel(1)).toBe("Słabe");
    expect(getPasswordStrengthLabel(2)).toBe("Średnie");
    expect(getPasswordStrengthLabel(3)).toBe("Silne");
    expect(getPasswordStrengthLabel(4)).toBe("Bardzo silne");
  });

  it("should return first label for invalid scores", () => {
    expect(getPasswordStrengthLabel(-1)).toBe("Bardzo słabe");
    expect(getPasswordStrengthLabel(5)).toBe("Bardzo słabe");
    expect(getPasswordStrengthLabel(100)).toBe("Bardzo słabe");
  });
});

describe("getPasswordStrengthColor", () => {
  it("should return correct color class for each score", () => {
    expect(getPasswordStrengthColor(0)).toBe("bg-destructive");
    expect(getPasswordStrengthColor(1)).toBe("bg-orange-500");
    expect(getPasswordStrengthColor(2)).toBe("bg-yellow-500");
    expect(getPasswordStrengthColor(3)).toBe("bg-green-500");
    expect(getPasswordStrengthColor(4)).toBe("bg-green-600");
  });

  it("should return first color for invalid scores", () => {
    expect(getPasswordStrengthColor(-1)).toBe("bg-destructive");
    expect(getPasswordStrengthColor(5)).toBe("bg-destructive");
    expect(getPasswordStrengthColor(100)).toBe("bg-destructive");
  });
});
