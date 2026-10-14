// @ts-nocheck
// The signed-in user and role, read the way the header reads them.
export const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("unEncryptedUser") || localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

export const readRole = () => {
  const u = readUser();
  const role = u.userType || u.roles?.[0] || u.role || localStorage.getItem("userRole") || "agent";
  return String(role).toLowerCase().trim();
};
