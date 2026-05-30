import {useQuery, UseQueryOptions} from '@tanstack/react-query';
import {userService} from '@/api/services/user';
import {UserProfile} from '@/api/types';

export const useProfile = (options?: Partial<UseQueryOptions<UserProfile>>) => {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: () => userService.getProfile(),
        ...options,
    });
};

export const useMyQrCode = () => {
    return useQuery({
        queryKey: ['myQrCode'],
        queryFn: () => userService.getMyQrCode(),
    });
};
