// Placeholder for the logged-in user until real authentication is wired up.
// Everything that displays "who's using the app" reads from here, so
// swapping this out for a real auth/session value (e.g. from a JWT or
// an AuthContext) only requires changing this one file.
export const currentUser = {
  name: 'Anirban Chatterjee',
  role: 'Product Manager',
};
