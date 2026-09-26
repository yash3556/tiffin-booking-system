export function validateService(body: any) {
  if (!body) {
    return "Request body is required";
  }

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return "Service name is required";
  }

  if (typeof body.price !== "number" || body.price <= 0) {
    return "Price must be a positive number";
  }

  return null;
}