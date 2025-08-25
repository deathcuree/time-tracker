export const serializeUser = (user: any) => ({
  id: user._id?.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  email: user.email,
  position: user.position,
});
