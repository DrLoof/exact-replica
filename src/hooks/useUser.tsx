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

  const role = userProfile.role || 'member';

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
