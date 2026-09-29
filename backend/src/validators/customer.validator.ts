export type CustomerInput = {
  name: string;
  phone: string;
};

export function validateCustomer(data: unknown): data is CustomerInput {
  if (!data || typeof data !== "object") {
    return false;
  }

  const customer = data as Record<string, unknown>;
  if (
    typeof customer.name !== "string" ||
    customer.name.trim() === ""
  ) {
    return false;
  }

  if (
    typeof customer.phone !== "string" ||
    customer.phone.trim() === ""
  ) {
    return false;
  }

  return true;
}

export function customerValidationMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return "Request body is required";
  }

  const customer = data as Record<string, unknown>;
  if (typeof customer.name !== "string" || customer.name.trim() === "") {
    return "Name is required";
  }

  if (typeof customer.phone !== "string" || customer.phone.trim() === "") {
    return "Phone is required";
  }

  return null;
}
