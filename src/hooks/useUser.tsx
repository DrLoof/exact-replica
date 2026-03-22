import { useAuth } from './useAuth';

export function useUser() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return {
      id: null,
      name: null,
      email: null,
      role: null,
      agencyId: null,
      avatarUrl: null,
      isOwner: false,
      isAdmin: false,
      isMember: true,
    };
  }

  // Default to 'owner' if role is not set (legacy users who created the agency)
  const role = userProfile.role || 'owner';

  return {
    id: userProfile.id,
    name: userProfile.full_name,
    email: userProfile.email,
    role,
    agencyId: userProfile.agency_id,
    avatarUrl: userProfile.avatar_url,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isMember: role === 'member',
  };
}
