/** Dashboard path from API `user_type` after login. */
export function dashboardPathForUserType(userType) {
  if (userType === 'school') return '/school';
  if (userType === 'teacher') return '/teacher';
  if (userType === 'student') return '/student';
  return '/';
}
