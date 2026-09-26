export function validateCustomer(data: {
  name?: string;
  phone?: string;
}) {
  if (!data.name || data.name.trim() === "") {
    return "Name is required";
  }

  if (!data.phone || data.phone.trim() === "") {
    return "Phone is required";
  }

  return null;
}

